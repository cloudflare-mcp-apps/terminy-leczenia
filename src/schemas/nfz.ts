/**
 * Raw NFZ ITL API response types.
 *
 * Shapes verified against live probes in api-samples/05-queues-alergologia-dzieci-malopolska.json
 * (full queue-attributes), 08-queue-by-id.json (single-object detail), and
 * 13-many-places-radiologica.json (many-places shape).
 *
 * @see projects/terminy-leczenia/docs/api2.md (Schematy)
 */

export interface NfzMeta {
  context: string;
  count?: number;
  page?: number;
  limit?: number;
  title?: string;
  url?: string | null;
  provider?: string;
  "date-published"?: string;
  "date-modified": string;
  description?: string;
  keywords?: string;
  language?: string;
  "content-type"?: string;
  "is-part-of"?: string;
  message: { type: "I" | "O"; content: string } | null;
}

export interface NfzLinks {
  first: string | null;
  prev: string | null;
  self: string | null;
  next: string | null;
  last: string | null;
}

/**
 * Full queue-attributes — same shape for /queues list items and /queues/{id} detail.
 */
export interface QueueAttributes {
  case: 1 | 2;
  benefit: string | null;
  anesthesia: "Y" | "N";
  "many-places": "Y" | "N";
  provider: string | null;
  "provider-code": string;
  "regon-provider": string | null;
  "nip-provider": string | null;
  "teryt-provider": string | null;
  place: string | null;
  address: string | null;
  locality: string | null;
  phone: string | null;
  "teryt-place": string | null;
  "registry-number": string | null;
  "id-resort-part-VII": string | null;
  "id-resort-part-VIII": string | null;
  "benefits-for-children": "Y" | "N" | null;
  "age-range": string | null;
  "covid-19": "Y" | "N";
  toilet: "Y" | "N";
  ramp: "Y" | "N";
  "car-park": "Y" | "N";
  elevator: "Y" | "N";
  /** Probe-confirmed: can be null even with full address (probe #10 record #5). */
  latitude: number | null;
  longitude: number | null;
  statistics: {
    "provider-data": {
      awaiting: number;
      removed: number;
      "average-period": number;
      update: string;
    } | null;
    /** Always null in current NFZ output (May 2026). */
    "computed-data": null;
  };
  dates: {
    applicable: boolean;
    date: string;
    "date-situation-as-at": string;
  };
  /** Always null in /queues output (May 2026). */
  "benefits-provided": null;
}

export interface NfzQueue {
  type: "queue";
  id: string;
  attributes: QueueAttributes;
}

export interface NfzQueueListResponse {
  meta: NfzMeta;
  links: NfzLinks;
  data: NfzQueue[];
}

export interface NfzQueueDetailResponse {
  meta: NfzMeta;
  data: NfzQueue;
}

/**
 * /many-places/{id} returns a single object with places[]. Per-place attributes
 * OMIT provider-level identifiers (provider, provider-code, case, benefit, etc. —
 * those live on the parent data.attributes, one level up).
 */
export type ManyPlacesAttributes = Omit<
  QueueAttributes,
  | "case"
  | "benefit"
  | "many-places"
  | "provider"
  | "provider-code"
  | "regon-provider"
  | "nip-provider"
  | "teryt-provider"
  | "registry-number"
  | "benefits-provided"
>;

export interface NfzManyPlacesQueue {
  id: string;
  type: "many-places-queue";
  attributes: ManyPlacesAttributes;
}

export interface NfzManyPlacesResponse {
  meta: NfzMeta;
  data: {
    type: "many-places";
    attributes: {
      benefit: string;
      provider: string;
      places: NfzManyPlacesQueue[];
    };
  };
}

/**
 * Dictionary endpoints return arrays of bare strings (not objects).
 */
export interface NfzDictionaryResponse {
  meta: NfzMeta;
  links: NfzLinks;
  data: string[];
}

/**
 * NFZ /version response.
 */
export interface NfzVersionResponse {
  "api-version": {
    major: number;
    minor: number;
    patch: number;
    "date-mod": string;
    deprecated: boolean;
  };
}

/**
 * NFZ error response. HTTP 400 status. Note: NFZ misspells "errorr-" in field names.
 */
export interface NfzErrorResponse {
  errors: Array<{
    id: string;
    "errorr-result": string;
    "errorr-reason": string;
    "errorr-solution": string;
    "error-help": string;
    "error-code": number;
  }>;
}

/**
 * Normalized error returned to tool handlers by NfzClient.
 */
export class NfzApiError extends Error {
  public readonly code: number;
  public readonly httpStatus: number;
  public readonly userMessage: string;
  public readonly isInfo: boolean;

  constructor(opts: {
    code: number;
    httpStatus: number;
    message: string;
    userMessage: string;
    isInfo?: boolean;
  }) {
    super(opts.message);
    this.name = "NfzApiError";
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
    this.userMessage = opts.userMessage;
    this.isInfo = opts.isInfo ?? false;
  }
}
