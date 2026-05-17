/**
 * NFZ ITL API Client.
 *
 * Wraps https://api.nfz.gov.pl/app-itl-api/ with:
 * - KV caching (24h dictionaries, 1h queue results)
 * - AbortController timeout (10s)
 * - HTTP 400 → typed NfzApiError with documented user-friendly messages
 * - One retry on 5xx with 500ms backoff
 *
 * @module api-client
 */

import { NFZ_API, KV_TTL } from "./shared/constants";
import { NfzApiError } from "./schemas/nfz";
import type {
  NfzDictionaryResponse,
  NfzErrorResponse,
  NfzManyPlacesResponse,
  NfzQueueDetailResponse,
  NfzQueueListResponse,
  NfzVersionResponse,
} from "./schemas/nfz";
import { logger } from "./shared/logger";

// ============================================================================
// Error code → user message map (from docs/api4.md)
// ============================================================================

interface NfzErrorMapping {
  message: string;
  isInfo?: boolean;
  redirectUrl?: string;
}

const NFZ_ERROR_MAP: Record<number, NfzErrorMapping> = {
  1001002: { message: "Invalid 'page' parameter — must be ≥ 1." },
  1001003: { message: "Invalid 'limit' parameter — must be 1–25." },
  1200005: { message: "Provide 'benefit' or 'province' — at least one is required." },
  1200006: { message: "'name' parameter is too long (max 250 chars)." },
  1200007: { message: "Invalid 'case' value — must be 1 (stable) or 2 (urgent)." },
  1200008: { message: "Invalid 'provider' value or missing parameter." },
  1200009: { message: "Invalid 'place' value or missing parameter." },
  1200010: { message: "Invalid 'street' value or missing parameter." },
  1200011: { message: "Invalid 'locality' value or missing parameter." },
  1200013: { message: "Invalid voivodeship code — must be 01-16." },
  1200022: { message: "'name' parameter is missing or shorter than 3 characters." },
  1200038: {
    message: "Sanatorium queries are not in this API. Use https://skierowania.nfz.gov.pl",
    isInfo: true,
    redirectUrl: "https://skierowania.nfz.gov.pl",
  },
  1200042: { message: "Provide 'benefit' or 'province' — at least one is required." },
  1200043: { message: "'name' parameter is too long (max 250 chars)." },
  1200044: { message: "Invalid 'case' value — must be 1 (stable) or 2 (urgent)." },
  1200045: { message: "Invalid 'provider' value." },
  1200046: { message: "Invalid 'place' value." },
  1200047: { message: "Invalid 'street' value." },
  1200048: { message: "Invalid 'locality' value." },
  1200049: { message: "Invalid voivodeship code — must be 01-16." },
  1200051: { message: "Resource not found — the supplied ID does not exist." },
  1200055: {
    message:
      "This benefit is delivered by the referring doctor — ask them where to perform it. " +
      "Not available in this API.",
    isInfo: true,
  },
};

function mapNfzError(body: NfzErrorResponse, httpStatus: number): NfzApiError {
  const err = body.errors?.[0];
  const code = err?.["error-code"] ?? 0;
  const mapping = NFZ_ERROR_MAP[code];
  return new NfzApiError({
    code,
    httpStatus,
    message: err?.["errorr-reason"] ?? `NFZ HTTP ${httpStatus}`,
    userMessage: mapping?.message ?? err?.["errorr-reason"] ?? `NFZ API error (code ${code}).`,
    isInfo: mapping?.isInfo,
  });
}

// ============================================================================
// Low-level fetch with timeout + retry + KV cache
// ============================================================================

async function fetchNfz<T>(path: string, query: Record<string, string | number | boolean | undefined>): Promise<T> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const url = `${NFZ_API.BASE_URL}${path}${params.size > 0 ? "?" + params.toString() : ""}`;

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), NFZ_API.TIMEOUT_MS);

  const attempt = async (): Promise<Response> =>
    fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });

  let response: Response;
  try {
    response = await attempt();
    if (response.status >= 500 && response.status < 600) {
      await new Promise((r) => setTimeout(r, 500));
      response = await attempt();
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let body: NfzErrorResponse | null = null;
    try {
      body = (await response.json()) as NfzErrorResponse;
    } catch {
      body = null;
    }
    if (body?.errors?.length) {
      throw mapNfzError(body, response.status);
    }
    throw new NfzApiError({
      code: 0,
      httpStatus: response.status,
      message: `NFZ HTTP ${response.status}`,
      userMessage:
        response.status >= 500
          ? "NFZ API jest tymczasowo niedostępne — spróbuj ponownie za chwilę."
          : `NFZ returned HTTP ${response.status}.`,
    });
  }

  return (await response.json()) as T;
}

/**
 * Wrap a fetcher with KV cache. Only HTTP-200-derived results are cached.
 * NfzApiError is allowed to propagate; never cached.
 */
async function cacheFirst<T>(
  kv: KVNamespace,
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await kv.get<T>(cacheKey, { type: "json" });
  if (cached !== null) {
    logger.info({ event: "cache_operation", operation: "hit", key: cacheKey });
    return cached;
  }
  logger.info({ event: "cache_operation", operation: "miss", key: cacheKey });
  const start = Date.now();
  let fresh: T;
  try {
    fresh = await fetcher();
  } catch (err) {
    logger.error({
      event: "api_call",
      service: "nfz-itl",
      method: "GET",
      url: cacheKey,
      status: err instanceof NfzApiError ? err.httpStatus : 0,
      duration_ms: Date.now() - start,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
  logger.info({
    event: "api_call",
    service: "nfz-itl",
    method: "GET",
    url: cacheKey,
    status: 200,
    duration_ms: Date.now() - start,
    success: true,
  });
  // Fire-and-forget cache write — never block tool response on KV.
  void kv.put(cacheKey, JSON.stringify(fresh), { expirationTtl: ttlSeconds });
  return fresh;
}

function cacheKey(prefix: string, parts: Record<string, unknown>): string {
  const normalized = Object.entries(parts)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("|");
  // Keep keys human-readable (KV keys are limited to 512 bytes; this is safe at <250 chars).
  return `nfz:${prefix}:${normalized}`;
}

// ============================================================================
// Public client
// ============================================================================

export class NfzClient {
  constructor(private kv: KVNamespace) {}

  // ----- /queues -----
  async searchQueues(opts: {
    benefit?: string;
    province?: string;
    case?: 1 | 2;
    locality?: string;
    benefitForChildren?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NfzQueueListResponse> {
    const key = cacheKey("queues", opts);
    return cacheFirst(this.kv, key, KV_TTL.QUEUE, () =>
      fetchNfz<NfzQueueListResponse>("/queues", {
        case: opts.case ?? 1,
        province: opts.province,
        benefit: opts.benefit,
        locality: opts.locality,
        benefitForChildren: opts.benefitForChildren,
        page: opts.page ?? 1,
        limit: opts.limit ?? 10,
        format: "json",
      }),
    );
  }

  // ----- /queues/{id} -----
  async getQueueById(id: string): Promise<NfzQueueDetailResponse> {
    const key = cacheKey("queue", { id });
    return cacheFirst(this.kv, key, KV_TTL.QUEUE, () =>
      fetchNfz<NfzQueueDetailResponse>(`/queues/${encodeURIComponent(id)}`, {}),
    );
  }

  // ----- /many-places/{id} -----
  async getManyPlaces(id: string): Promise<NfzManyPlacesResponse> {
    const key = cacheKey("many-places", { id });
    return cacheFirst(this.kv, key, KV_TTL.QUEUE, () =>
      fetchNfz<NfzManyPlacesResponse>(`/many-places/${encodeURIComponent(id)}`, {}),
    );
  }

  // ----- /benefits -----
  async listBenefits(opts: { name: string; limit?: number }): Promise<NfzDictionaryResponse> {
    const key = cacheKey("benefits", opts);
    return cacheFirst(this.kv, key, KV_TTL.DICTIONARY, () =>
      fetchNfz<NfzDictionaryResponse>("/benefits", {
        name: opts.name,
        limit: opts.limit ?? 10,
        format: "json",
      }),
    );
  }

  // ----- /localities -----
  async listLocalities(opts: { name: string; province: string; limit?: number }): Promise<NfzDictionaryResponse> {
    const key = cacheKey("localities", opts);
    return cacheFirst(this.kv, key, KV_TTL.DICTIONARY, () =>
      fetchNfz<NfzDictionaryResponse>("/localities", {
        name: opts.name,
        province: opts.province,
        limit: opts.limit ?? 10,
        format: "json",
      }),
    );
  }

  // ----- /providers -----
  async listProviders(opts: { name: string; province: string; limit?: number }): Promise<NfzDictionaryResponse> {
    const key = cacheKey("providers", opts);
    return cacheFirst(this.kv, key, KV_TTL.DICTIONARY, () =>
      fetchNfz<NfzDictionaryResponse>("/providers", {
        name: opts.name,
        province: opts.province,
        limit: opts.limit ?? 10,
        format: "json",
      }),
    );
  }

  // ----- /version -----
  async getVersion(): Promise<NfzVersionResponse> {
    return cacheFirst(this.kv, "nfz:version", KV_TTL.VERSION, () =>
      fetchNfz<NfzVersionResponse>("/version", {}),
    );
  }
}

// ============================================================================
// Helpers — normalization
// ============================================================================

import type { NormalizedQueueResult } from "./schemas/outputs";
import type { ManyPlacesAttributes, QueueAttributes } from "./schemas/nfz";

function daysFromToday(isoDate: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00Z");
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function isY(value: "Y" | "N" | null | undefined): boolean {
  return value === "Y";
}

export function normalizeQueueAttributes(
  id: string,
  a: QueueAttributes,
): NormalizedQueueResult {
  return {
    queue_id: id,
    benefit: a.benefit ?? "",
    provider: a.provider ?? "",
    place: a.place ?? "",
    locality: a.locality ?? "",
    address: a.address ?? "",
    phone: a.phone,
    latitude: a.latitude,
    longitude: a.longitude,
    wait_date: a.dates.date,
    wait_days_from_today: daysFromToday(a.dates.date),
    snapshot_date: a.dates["date-situation-as-at"],
    awaiting: a.statistics["provider-data"]?.awaiting ?? null,
    average_period_days: a.statistics["provider-data"]?.["average-period"] ?? null,
    accessibility: {
      toilet: isY(a.toilet),
      ramp: isY(a.ramp),
      carPark: isY(a["car-park"]),
      elevator: isY(a.elevator),
    },
    benefits_for_children: isY(a["benefits-for-children"]),
    age_range: a["age-range"],
    has_other_places: isY(a["many-places"]),
  };
}

/**
 * /many-places child attributes are missing provider/benefit/case — caller injects parent context.
 */
export function normalizeManyPlacesQueue(
  id: string,
  a: ManyPlacesAttributes,
  parent: { benefit: string; provider: string },
): NormalizedQueueResult {
  return {
    queue_id: id,
    benefit: parent.benefit,
    provider: parent.provider,
    place: a.place ?? "",
    locality: a.locality ?? "",
    address: a.address ?? "",
    phone: a.phone,
    latitude: a.latitude,
    longitude: a.longitude,
    wait_date: a.dates.date,
    wait_days_from_today: daysFromToday(a.dates.date),
    snapshot_date: a.dates["date-situation-as-at"],
    awaiting: a.statistics["provider-data"]?.awaiting ?? null,
    average_period_days: a.statistics["provider-data"]?.["average-period"] ?? null,
    accessibility: {
      toilet: isY(a.toilet),
      ramp: isY(a.ramp),
      carPark: isY(a["car-park"]),
      elevator: isY(a.elevator),
    },
    benefits_for_children: isY(a["benefits-for-children"]),
    age_range: a["age-range"],
    // many-places children are by definition siblings of the original Y entry —
    // they themselves don't carry the many-places flag in the API.
    has_other_places: false,
  };
}
