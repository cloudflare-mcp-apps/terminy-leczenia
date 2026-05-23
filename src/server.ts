/**
 * MCP Server Factory for Terminy Leczenia NFZ — Cloudflare canonical pattern.
 *
 * createServer(env) returns a fresh McpServer per request. Transport layer
 * (createMcpHandler in src/index.ts) handles JSON-RPC dispatch via
 * WorkerTransport (Streamable HTTP, March 2025 spec). GHSA-345p-7cg4-v4c7 safe.
 *
 * Auth context (userId, email) populated by createMcpHandler from authContext
 * option in src/index.ts; tools access it via getMcpAuthContext().
 *
 * Five tools — 2 with widget, 3 LLM-only (canonical map-server chain pattern).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { getMcpAuthContext } from "agents/mcp";

import type { Env } from "./types";
import { SERVER_CONFIG, PROVINCE_NAMES, PROVINCE_CODES } from "./shared/constants";
import { UI_RESOURCES } from "./resources/ui-resources";
import { loadHtml } from "./helpers/assets";
import { BENEFIT_SYNONYMS } from "./helpers/benefit-synonyms";
import { SERVER_INSTRUCTIONS } from "./server-instructions";
import { logger } from "./shared/logger";
import { TOOL_METADATA, getToolDescription } from "./tools/descriptions";

import {
  SearchAppointmentsInput,
  ListOtherPlacesInput,
  LookupBenefitInput,
  LookupLocalityInput,
  LookupProviderInput,
  type SearchAppointmentsParams,
  type ListOtherPlacesParams,
  type LookupBenefitParams,
  type LookupLocalityParams,
  type LookupProviderParams,
} from "./schemas/inputs";

import type {
  SearchAppointmentsOutput,
  ListOtherPlacesOutput,
  ErrorOutput,
  NormalizedQueueResult,
} from "./schemas/outputs";
import {
  SEARCH_APPOINTMENTS_OUTPUT_SCHEMA,
  LIST_OTHER_PLACES_OUTPUT_SCHEMA,
  LOOKUP_OUTPUT_SCHEMA,
} from "./schemas/outputs";
import { znajdzTerminPrompt, sprawdzObjawPrompt } from "./optional/prompts";

import {
  NfzClient,
  normalizeQueueAttributes,
  normalizeManyPlacesQueue,
} from "./api-client";
import { NfzApiError } from "./schemas/nfz";

// ============================================================================
// Helpers
// ============================================================================

function getAuth(): { userId: string; email: string } {
  const auth = getMcpAuthContext();
  return {
    userId: (auth?.props?.userId as string | undefined) ?? "anonymous",
    email: (auth?.props?.email as string | undefined) ?? "",
  };
}

function asTextResult(text: string, structured: Record<string, unknown>, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: structured,
    isError,
  };
}

/**
 * Map NfzApiError → user-facing tool result. Info codes (e.g., sanatorium redirect)
 * are returned as non-error responses with kind="error", is_info=true so the LLM
 * can relay them to the user.
 */
// ============================================================================
// Elicitation helpers — forward-compatible with Claude.ai roadmap
// ============================================================================
//
// MCP Spec 2025-11-25 §Elicitation. Host support status as of 2026-05:
// - Claude Code (CLI): ✅ implemented
// - Claude.ai (web/desktop): ⏳ planned — Anthropic engineer @ochafik
//   self-assigned the feature request (github "Add elicitation support to
//   Claude.ai" 2026-04-06). NOT a dead path — will activate automatically
//   when Claude.ai ships the capability.
// - AWS Bedrock MCP client: ❌ not implemented, falls through to
//   disambiguation_needed widget banner.
// - basic-host (ext-apps test harness): partial.
//
// Always-on fallback: when elicit returns null (host unsupported or user
// declined), we set structuredContent.disambiguation_needed so the widget
// renders inline buttons. Both paths converge on the same filtered output —
// elicit is the cleaner single-shot UX, widget banner is the two-call
// graceful degradation.

/**
 * Try to elicit a voivodeship from the user mid-tool-call.
 * Returns the chosen code (01-16) or null if host doesn't support elicitation,
 * the user cancelled/declined, or the response was malformed.
 */
async function tryElicitProvince(server: McpServer): Promise<string | null> {
  try {
    const result = await server.server.elicitInput({
      mode: "form",
      message:
        "W którym województwie szukać terminów? Podaj województwo aby zawęzić wyniki.",
      requestedSchema: {
        type: "object",
        properties: {
          province: {
            type: "string",
            title: "Województwo",
            enum: [...PROVINCE_CODES],
            enumNames: PROVINCE_CODES.map((c) => PROVINCE_NAMES[c]),
          },
        },
        required: ["province"],
      },
    });
    if (result.action === "accept" && result.content?.province) {
      const code = String(result.content.province);
      return PROVINCE_NAMES[code] ? code : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to elicit paediatric/adult scope when results contain a mix and the
 * caller did not set benefit_for_children. Returns null on host-unsupported,
 * cancel, decline, or malformed response.
 */
async function tryElicitScope(
  server: McpServer,
): Promise<"adult" | "child" | "all" | null> {
  try {
    const result = await server.server.elicitInput({
      mode: "form",
      message:
        "Wyniki zawierają zarówno oddziały dla dorosłych jak i dziecięce. Wybierz zakres wiekowy pacjenta:",
      requestedSchema: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            title: "Zakres wiekowy",
            enum: ["adult", "child", "all"],
            enumNames: ["Dorośli (18+)", "Dzieci (<18)", "Pokaż wszystko"],
          },
        },
        required: ["scope"],
      },
    });
    if (result.action === "accept" && result.content?.scope) {
      const scope = String(result.content.scope);
      if (scope === "adult" || scope === "child" || scope === "all") {
        return scope;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * "Did You Mean" — when search_appointments returned 0 hits, run lookup_benefit
 * with the full term + each long-enough keyword and union the results.
 * Used to surface close matches in the same tool result, eliminating the need
 * for the LLM to do a separate lookup_benefit round-trip.
 */
async function findDidYouMean(nfz: NfzClient, benefit: string): Promise<string[]> {
  const candidates = new Set<string>();
  const queries = [
    benefit,
    ...benefit
      .split(/[\s,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4)
      .slice(0, 3),
  ];
  for (const q of queries) {
    if (candidates.size >= 10) break;
    try {
      const res = await nfz.listBenefits({ name: q, limit: 10 });
      for (const r of res.data) {
        candidates.add(r);
        if (candidates.size >= 10) break;
      }
    } catch {
      // Skip — NfzApiError or transport error on a fallback query is non-fatal.
    }
  }
  return Array.from(candidates);
}

/**
 * "Did You Mean" for lookup_benefit when query returned 0 results.
 * Strategy:
 *   (A) Decompose multi-word query into ≥4-char tokens — helps freeform input.
 *   (B) Match BENEFIT_SYNONYMS keys overlapping the query — patient procedure
 *       term → NFZ-specialty substring (e.g. "PRZEGRODA" → "OTOLARYNGOLOG").
 * Probes are sent to NFZ /benefits to surface real dictionary names (not raw
 * specialty substrings), so the LLM can pass them verbatim to search_appointments.
 */
async function lookupBenefitDidYouMean(nfz: NfzClient, query: string): Promise<string[]> {
  const upper = query.toUpperCase();
  const probes = new Set<string>();

  // (A) Keyword split — useful when LLM passes multi-word freeform via lookup.
  for (const word of upper.split(/[\s,/-]+/).filter((w) => w.length >= 4).slice(0, 3)) {
    if (word !== upper) probes.add(word);
  }

  // (B) Synonym map — overlap min 5 chars, either direction.
  for (const [key, hints] of Object.entries(BENEFIT_SYNONYMS)) {
    if (key.length < 5) continue;
    const overlaps = upper.includes(key) || key.includes(upper.slice(0, Math.max(5, upper.length - 1)));
    if (overlaps) for (const h of hints) probes.add(h);
  }

  const candidates = new Set<string>();
  for (const p of probes) {
    if (candidates.size >= 6) break;
    try {
      const res = await nfz.listBenefits({ name: p, limit: 4 });
      for (const r of res.data) {
        candidates.add(r);
        if (candidates.size >= 6) break;
      }
    } catch {
      // Non-fatal: probe miss does not invalidate other probes.
    }
  }
  return Array.from(candidates);
}

function nfzErrorResult(err: NfzApiError, toolName: string): ReturnType<typeof asTextResult> {
  const output: ErrorOutput = {
    kind: "error",
    is_info: err.isInfo,
    code: err.code,
    message: err.userMessage,
  };
  logger.warn({
    event: "tool_failed",
    tool: toolName,
    error: `NFZ ${err.code}: ${err.userMessage}`,
  });
  return asTextResult(err.userMessage, output as unknown as Record<string, unknown>, !err.isInfo);
}

function summarizeResults(out: SearchAppointmentsOutput): string {
  if (out.count === 0) {
    const filters = [
      out.query.benefit ? `świadczenie: "${out.query.benefit}"` : null,
      out.query.province ? `woj.: ${PROVINCE_NAMES[out.query.province] ?? out.query.province}` : null,
      out.query.locality ? `miejscowość: ${out.query.locality}` : null,
      out.query.case === 2 ? "case: pilny" : null,
      out.query.benefit_for_children ? "dla dzieci" : null,
    ].filter(Boolean).join(", ");
    let msg = `Brak wyników dla podanych filtrów (${filters || "—"}).`;
    if (out.did_you_mean && out.did_you_mean.length > 0) {
      msg +=
        `\n\n💡 Czy chodziło o jedno z poniższych świadczeń? Ponów wyszukiwanie z dokładną nazwą:\n` +
        out.did_you_mean.map((s, i) => `${i + 1}. ${s}`).join("\n");
    } else {
      msg += ` Spróbuj złagodzić filtry lub użyć lookup_benefit aby znaleźć poprawną nazwę świadczenia.`;
    }
    return msg;
  }

  // Locality post-filter: if the user asked for a specific city, surface
  // matching records first in the text summary (case + diacritics insensitive).
  // Falls back to whole result set if no matches.
  const allResults = [...out.results, ...out.results_no_geo];
  const requestedLocality = out.query.locality?.trim().toLowerCase();
  const normalizeStr = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const matchingLocality = requestedLocality
    ? allResults.filter((r) => normalizeStr(r.locality) === normalizeStr(requestedLocality))
    : [];
  const localityNote = (() => {
    if (!requestedLocality) return "";
    if (matchingLocality.length === 0) {
      return ` ℹ Brak wyników w "${out.query.locality}" — pokazuję najbliższe w województwie.`;
    }
    if (matchingLocality.length < allResults.length) {
      return ` Filtrowanie do "${out.query.locality}" (${matchingLocality.length} placówek).`;
    }
    return "";
  })();
  const candidateTop = matchingLocality.length > 0 ? matchingLocality : allResults;
  const formatLine = (r: NormalizedQueueResult, i: number): string => {
    const days = r.wait_days_from_today;
    const when =
      days <= 0 ? "dziś" : days === 1 ? "za 1 dzień" : `za ${days} dni`;
    const provider = r.provider.length > 60 ? r.provider.slice(0, 57) + "..." : r.provider;
    // Surface the full queue_id (UUID) in text only when has_other_places=true,
    // so chat-side LLMs can call list_other_places without scraping
    // structuredContent. Kept off other rows to avoid token noise.
    const otherPlacesNote = r.has_other_places
      ? ` [⊕ inne miejsca dostępne — list_other_places(queue_id="${r.queue_id}")]`
      : "";
    return `${i + 1}. ${r.wait_date} (${when}) — ${provider}, ${r.place}, ${r.locality}` +
      otherPlacesNote;
  };

  // Dual-top when adult+paediatric mix and no scope filter chosen yet — split
  // sections so the LLM can immediately surface "earliest for adults" vs
  // "earliest for children" without re-scanning the full result list.
  let lines: string[];
  const scope = out.disambiguation_needed?.scope;
  if (scope && scope.has_adult && scope.has_paediatric) {
    const adults = candidateTop.filter((r) => !r.benefits_for_children).slice(0, 3);
    const children = candidateTop.filter((r) => r.benefits_for_children).slice(0, 3);
    const sections: string[] = [];
    if (adults.length > 0) {
      sections.push("👤 Najszybsze DLA DOROSŁYCH:\n" + adults.map(formatLine).join("\n"));
    }
    if (children.length > 0) {
      sections.push("👶 Najszybsze DLA DZIECI:\n" + children.map(formatLine).join("\n"));
    }
    lines = [sections.join("\n\n")];
  } else {
    const top = candidateTop.slice(0, 3);
    lines = top.map((r, i) => {
      const paediatricNote = r.benefits_for_children ? " 👶 ODDZIAŁ DZIECIĘCY" : "";
      return formatLine(r, i) + paediatricNote;
    });
  }

  // Freshness signal: how old is the queue-length snapshot vs. today?
  // Snapshots > 60 days old warrant a phone-check warning.
  let staleness = "";
  if (out.newest_snapshot) {
    const snapAge = Math.round(
      (Date.now() - new Date(out.newest_snapshot + "T00:00:00Z").getTime()) /
        (24 * 60 * 60 * 1000),
    );
    staleness =
      snapAge > 60
        ? ` ⚠ Snapshot kolejek: ${out.newest_snapshot} (${snapAge} dni temu — sprawdź telefonicznie).`
        : ` Snapshot kolejek: ${out.newest_snapshot}.`;
  }

  const total = out.count;
  const shown = out.results.length + out.results_no_geo.length;
  const skippedNote = out.count_skipped_invalid
    ? ` (NFZ zwrócił ${out.count_raw_nfz}, pominięto ${out.count_skipped_invalid} bez harmonogramu)`
    : "";

  // Surface elicitation context — let the LLM tell the user how the filter
  // was applied (e.g. "Wybrałeś województwo X" or "Filtruję do dorosłych").
  const elicitedNote = (() => {
    if (!out.elicited) return "";
    const parts: string[] = [];
    if (out.elicited.province) {
      parts.push(`woj. ${PROVINCE_NAMES[out.elicited.province] ?? out.elicited.province} (z elicyt.)`);
    }
    if (out.elicited.scope === "adult") parts.push("filtr: dorośli");
    else if (out.elicited.scope === "child") parts.push("filtr: dzieci");
    else if (out.elicited.scope === "all") parts.push("filtr: bez ograniczenia wieku");
    return parts.length > 0 ? ` Ustawienia: ${parts.join(", ")}.` : "";
  })();

  // Disambiguation hint (when host doesn't support elicit, e.g. AWS Bedrock).
  // Per Claude MCP Apps docs (mcp_apps_docs_claude.md §"App vs. chat
  // interactions"): filtering of already-displayed data should be handled by
  // the widget, NOT narrated in chat. Hint LLM accordingly.
  const disambigNote = (() => {
    const d = out.disambiguation_needed;
    if (!d) return "";
    const hints: string[] = [];
    if (d.province) hints.push("ask user for voivodeship (01-16)");
    if (d.scope) {
      hints.push(
        "results contain adult AND paediatric — widget already shows filter buttons; " +
          "do NOT re-ask in chat unless widget is unavailable",
      );
    }
    return hints.length > 0 ? ` ⚠ ${hints.join("; ")}.` : "";
  })();

  const footer =
    `\nZnaleziono ${total} kolejek, pokazano ${shown}${skippedNote}.${localityNote} ` +
    `Pełne wyniki + mapa w widgecie. ` +
    `Dane wygenerowane: ${out.data_freshness.slice(0, 10)}.${staleness}${elicitedNote}${disambigNote}`;

  return lines.join("\n") + footer;
}

// ============================================================================
// Server factory
// ============================================================================

export function createServer(env: Env): McpServer {
  const server = new McpServer(
    { name: SERVER_CONFIG.NAME, version: SERVER_CONFIG.VERSION },
    {
      capabilities: {
        tools: {},
        resources: { listChanged: true },
        prompts: { listChanged: true },
      },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  const nfz = new NfzClient(env.CACHE_KV);
  const widgetResource = UI_RESOURCES.widget;

  // ========================================================================
  // UI Resource — widget HTML with CSP on contents[] entry
  // ========================================================================
  server.registerResource(
    "widget",
    widgetResource.uri,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: widgetResource.description,
      // _meta here is informational; CSP/domain placement that actually counts is
      // on the contents[] entry returned by the handler below.
      _meta: { ui: widgetResource._meta.ui! },
    },
    async () => {
      const html = await loadHtml(env.ASSETS, "/widget.html");
      return {
        contents: [
          {
            uri: widgetResource.uri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: widgetResource._meta as Record<string, unknown>,
          },
        ],
      };
    },
  );

  // ========================================================================
  // Tool 1 — search_appointments (widget)
  // ========================================================================
  server.registerTool(
    "search_appointments",
    {
      title: TOOL_METADATA.search_appointments.title,
      description: getToolDescription("search_appointments"),
      inputSchema: SearchAppointmentsInput,
      outputSchema: SEARCH_APPOINTMENTS_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: { ui: { resourceUri: widgetResource.uri } },
    },
    async (args) => {
      let params = args as SearchAppointmentsParams;
      const auth = getAuth();
      const actionId = crypto.randomUUID();
      const start = Date.now();
      const elicited: { province?: string; scope?: "adult" | "child" | "all" } = {};
      const disambiguationNeeded: {
        province?: boolean;
        scope?: { has_adult: boolean; has_paediatric: boolean };
      } = {};

      logger.info({
        event: "tool_started",
        tool: "search_appointments",
        user_id: auth.userId,
        user_email: auth.email,
        action_id: actionId,
        args: params as unknown as Record<string, unknown>,
      });

      // -- Elicit voivodeship when both benefit and province are missing ----
      // NFZ /queues requires AT LEAST ONE of {benefit, province} (error 1200005).
      // Instead of failing immediately, try to elicit a voivodeship from the user.
      // If the host doesn't support elicitation, falls back to the original error.
      if (!params.benefit && !params.province) {
        const chosen = await tryElicitProvince(server);
        if (chosen) {
          params = { ...params, province: chosen as SearchAppointmentsParams["province"] };
          elicited.province = chosen;
        } else {
          // Host doesn't support elicit OR user declined. Signal widget/LLM
          // that disambiguation is needed inline rather than returning a
          // hard error (better UX on Bedrock-style hosts without elicit).
          disambiguationNeeded.province = true;
          const err: ErrorOutput = {
            kind: "error",
            is_info: false,
            code: 1200005,
            message:
              "Provide 'benefit' or 'province' — at least one is required. " +
              "Ask the user which voivodeship (01-16) they want to search.",
          };
          return asTextResult(err.message, err as unknown as Record<string, unknown>, true);
        }
      }

      try {
        const response = await nfz.searchQueues({
          benefit: params.benefit,
          province: params.province,
          case: params.case ?? 1,
          locality: params.locality,
          benefitForChildren: params.benefit_for_children,
          limit: params.limit ?? 10,
          page: 1,
        });

        // Defensive: drop records with null dates (NFZ data gap — production
        // crash 2026-05-17 on TORUŃ filter). Normalizer returns null for these.
        const rawCount = response.data.length;
        let normalized = response.data
          .map((q) => normalizeQueueAttributes(q.id, q.attributes))
          .filter((r): r is NormalizedQueueResult => r !== null);
        const skippedInvalid = rawCount - normalized.length;

        // -- Elicit paediatric/adult scope on mixed results --------------------
        if (params.benefit_for_children === undefined && normalized.length > 0) {
          const hasAdult = normalized.some((r) => !r.benefits_for_children);
          const hasPaediatric = normalized.some((r) => r.benefits_for_children);
          if (hasAdult && hasPaediatric) {
            const scope = await tryElicitScope(server);
            if (scope === "adult") {
              normalized = normalized.filter((r) => !r.benefits_for_children);
              elicited.scope = "adult";
            } else if (scope === "child") {
              normalized = normalized.filter((r) => r.benefits_for_children);
              elicited.scope = "child";
            } else if (scope === "all") {
              elicited.scope = "all";
            } else {
              // Host doesn't support elicit (e.g. AWS Bedrock) — signal the
              // widget to render inline disambiguation buttons, and tell the
              // LLM to ask the user in chat.
              disambiguationNeeded.scope = { has_adult: hasAdult, has_paediatric: hasPaediatric };
            }
          }
        }

        const results = normalized.filter(
          (r): r is NormalizedQueueResult & { latitude: number; longitude: number } =>
            r.latitude !== null && r.longitude !== null,
        );
        const results_no_geo = normalized.filter((r) => r.latitude === null || r.longitude === null);

        const newestSnapshot = normalized
          .map((r) => r.snapshot_date)
          .sort()
          .reverse()[0] ?? null;

        // `count` now reflects what the widget actually renders (after the
        // null-dates filter). `count_raw_nfz` preserves NFZ's view for
        // diagnostics; LLM should use `count` for user-facing numbers.
        const rawNfzCount = response.meta.count ?? rawCount;
        const renderableCount = Math.max(0, rawNfzCount - skippedInvalid);
        const limit = response.meta.limit ?? (params.limit ?? 10);
        const totalPages = limit > 0 ? Math.ceil(renderableCount / limit) : 1;

        // -- Did You Mean: 0 results with a benefit → fetch suggestions -------
        // Run lookup_benefit with the original term + extracted keywords so the
        // LLM gets close matches without a separate tool round-trip.
        let didYouMean: string[] | undefined;
        if (normalized.length === 0 && params.benefit) {
          const suggestions = await findDidYouMean(nfz, params.benefit);
          if (suggestions.length > 0) didYouMean = suggestions;
        }

        const output: SearchAppointmentsOutput = {
          kind: "search",
          query: { ...params, case: params.case ?? 1 },
          count: renderableCount,
          count_raw_nfz: rawNfzCount,
          count_skipped_invalid: skippedInvalid > 0 ? skippedInvalid : undefined,
          page: response.meta.page ?? 1,
          total_pages: totalPages,
          results,
          results_no_geo,
          data_freshness: response.meta["date-modified"],
          newest_snapshot: newestSnapshot,
          banner: response.meta.message,
          did_you_mean: didYouMean,
          elicited: Object.keys(elicited).length > 0 ? elicited : undefined,
          disambiguation_needed:
            Object.keys(disambiguationNeeded).length > 0 ? disambiguationNeeded : undefined,
        };

        logger.info({
          event: "tool_completed",
          tool: "search_appointments",
          user_id: auth.userId,
          user_email: auth.email,
          action_id: actionId,
          duration_ms: Date.now() - start,
        });

        return {
          content: [{ type: "text" as const, text: summarizeResults(output) }],
          structuredContent: output as unknown as Record<string, unknown>,
          _meta: { viewUUID: crypto.randomUUID() },
        };
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "search_appointments");
        logger.error({
          event: "tool_failed",
          tool: "search_appointments",
          error: err instanceof Error ? err.message : String(err),
        });
        return asTextResult(
          `Błąd wyszukiwania: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 2 — list_other_places (widget inline)
  // ========================================================================
  server.registerTool(
    "list_other_places",
    {
      title: TOOL_METADATA.list_other_places.title,
      description: getToolDescription("list_other_places"),
      inputSchema: ListOtherPlacesInput,
      outputSchema: LIST_OTHER_PLACES_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: { ui: { resourceUri: widgetResource.uri } },
    },
    async (args) => {
      const params = args as ListOtherPlacesParams;
      const auth = getAuth();
      const actionId = crypto.randomUUID();
      const start = Date.now();

      logger.info({
        event: "tool_started",
        tool: "list_other_places",
        user_id: auth.userId,
        user_email: auth.email,
        action_id: actionId,
        args: params as unknown as Record<string, unknown>,
      });

      try {
        const response = await nfz.getManyPlaces(params.queue_id);
        const parent = {
          benefit: response.data.attributes.benefit,
          provider: response.data.attributes.provider,
        };
        const places = response.data.attributes.places
          .map((p) => normalizeManyPlacesQueue(p.id, p.attributes, parent))
          .filter((r): r is NormalizedQueueResult => r !== null);

        const output: ListOtherPlacesOutput = {
          kind: "other-places",
          benefit: parent.benefit,
          provider: parent.provider,
          origin_queue_id: params.queue_id,
          places,
          data_freshness: response.meta["date-modified"],
        };

        const summary =
          `${places.length} miejsc tego samego świadczeniodawcy "${parent.provider.slice(0, 50)}" ` +
          `oferujących "${parent.benefit}". Najbliższy termin: ` +
          (places.length > 0
            ? `${places.reduce((a, b) => (a.wait_date < b.wait_date ? a : b)).wait_date}.`
            : "—.");

        logger.info({
          event: "tool_completed",
          tool: "list_other_places",
          user_id: auth.userId,
          user_email: auth.email,
          action_id: actionId,
          duration_ms: Date.now() - start,
        });

        return {
          content: [{ type: "text" as const, text: summary }],
          structuredContent: output as unknown as Record<string, unknown>,
        };
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "list_other_places");
        logger.error({
          event: "tool_failed",
          tool: "list_other_places",
          error: err instanceof Error ? err.message : String(err),
        });
        return asTextResult(
          `Błąd: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 3 — lookup_benefit (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_benefit",
    {
      title: TOOL_METADATA.lookup_benefit.title,
      description: getToolDescription("lookup_benefit"),
      inputSchema: LookupBenefitInput,
      outputSchema: LOOKUP_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupBenefitParams;
      try {
        const response = await nfz.listBenefits({ name: params.query, limit: params.limit ?? 10 });
        const names = response.data;

        if (names.length === 0) {
          const didYouMean = await lookupBenefitDidYouMean(nfz, params.query);
          const text = didYouMean.length > 0
            ? `Brak świadczeń pasujących do "${params.query}". 💡 Czy chodziło o:\n` +
              didYouMean.map((s, i) => `${i + 1}. ${s}`).join("\n") +
              `\nPonów lookup_benefit lub przekaż jedną z powyższych nazw bezpośrednio do search_appointments.`
            : `Brak świadczeń pasujących do "${params.query}". Spróbuj krótszej frazy lub innego słowa.`;
          return asTextResult(text, {
            kind: "lookup",
            entity: "benefit",
            results: [],
            did_you_mean: didYouMean,
          });
        }

        const text =
          `Znaleziono ${response.meta.count ?? names.length} świadczeń (pokazano ${names.length}):\n` +
          names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "benefit", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_benefit");
        return asTextResult(
          `Błąd słownika świadczeń: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 4 — lookup_locality (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_locality",
    {
      title: TOOL_METADATA.lookup_locality.title,
      description: getToolDescription("lookup_locality"),
      inputSchema: LookupLocalityInput,
      outputSchema: LOOKUP_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupLocalityParams;
      try {
        const response = await nfz.listLocalities({
          name: params.query,
          province: params.province,
          limit: params.limit ?? 10,
        });
        const names = response.data;
        const provinceName = PROVINCE_NAMES[params.province] ?? params.province;
        const text =
          names.length === 0
            ? `Brak miejscowości pasujących do "${params.query}" w woj. ${provinceName}.`
            : `Miejscowości w woj. ${provinceName} pasujące do "${params.query}" ` +
              `(${response.meta.count ?? names.length} total, pokazano ${names.length}):\n` +
              names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "locality", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_locality");
        return asTextResult(
          `Błąd słownika miejscowości: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 5 — lookup_provider (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_provider",
    {
      title: TOOL_METADATA.lookup_provider.title,
      description: getToolDescription("lookup_provider"),
      inputSchema: LookupProviderInput,
      outputSchema: LOOKUP_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupProviderParams;
      try {
        const response = await nfz.listProviders({
          name: params.query,
          province: params.province,
          limit: params.limit ?? 10,
        });
        const names = response.data;
        const provinceName = PROVINCE_NAMES[params.province] ?? params.province;
        const text =
          names.length === 0
            ? `Brak świadczeniodawców pasujących do "${params.query}" w woj. ${provinceName}.`
            : `Świadczeniodawcy w woj. ${provinceName} pasujący do "${params.query}" ` +
              `(${response.meta.count ?? names.length} total, pokazano ${names.length}):\n` +
              names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "provider", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_provider");
        return asTextResult(
          `Błąd słownika świadczeniodawców: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Prompts (slash-commands) — registered individually because each
  // argsSchema shape is different and a for-loop would unify the TS generic
  // to the first entry's shape (same gotcha as ads-roi).
  // ========================================================================
  server.registerPrompt(znajdzTerminPrompt.name, znajdzTerminPrompt.config, znajdzTerminPrompt.handler);
  server.registerPrompt(sprawdzObjawPrompt.name, sprawdzObjawPrompt.config, sprawdzObjawPrompt.handler);

  return server;
}
