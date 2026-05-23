/**
 * Output Types and Zod outputSchemas for Terminy Leczenia NFZ tools.
 *
 * The `*_OUTPUT_SCHEMA` exports are ZodRawShapeCompat plain objects passed
 * directly to `registerTool({ outputSchema })`. Each schema is intentionally
 * permissive on the success/error discriminator so an `is_info` redirect
 * response (kind: "error") and a successful payload (kind: "search" etc.)
 * both validate — the `kind` literal lets clients dispatch.
 *
 * @module schemas/outputs
 */

import * as z from "zod/v4";
import { PROVINCE_ENUM } from "./inputs";
import type { SearchAppointmentsParams } from "./inputs";

/**
 * One normalized queue result — flat camelCase derived from raw queue-attributes
 * plus computed `wait_days_from_today`.
 */
export interface NormalizedQueueResult {
  queue_id: string;
  benefit: string;
  provider: string;
  place: string;
  locality: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  wait_date: string;
  wait_days_from_today: number;
  snapshot_date: string;
  awaiting: number | null;
  average_period_days: number | null;
  accessibility: {
    toilet: boolean;
    ramp: boolean;
    carPark: boolean;
    elevator: boolean;
  };
  benefits_for_children: boolean;
  age_range: string | null;
  has_other_places: boolean;
}

/**
 * Output of `search_appointments`.
 */
export interface SearchAppointmentsOutput {
  kind: "search";
  query: SearchAppointmentsParams;
  count: number;
  page: number;
  total_pages: number;
  /** Records WITH latitude+longitude — renderable on the map. */
  results: NormalizedQueueResult[];
  /** Records WITHOUT geo — rendered in a separate "no-location" panel. */
  results_no_geo: NormalizedQueueResult[];
  /** Live NFZ regeneration timestamp (meta.date-modified). */
  /**
   * Number of records skipped during normalization (NFZ returned them with
   * dates=null — closed queues / data gaps). Helps explain mismatches
   * between NFZ's reported total and what the widget can render.
   */
  count_skipped_invalid?: number;
  /** Raw NFZ-reported total (kept for transparency vs `count` which is renderable). */
  count_raw_nfz?: number;
  data_freshness: string;
  /** Newest dates.date-situation-as-at across results, if any. */
  newest_snapshot: string | null;
  /** NFZ system banner (e.g. maintenance / info). */
  banner: { type: "I" | "O"; content: string } | null;
  /**
   * Server-side "Did You Mean" — when NFZ returns 0 hits for a benefit term,
   * the server runs lookup_benefit with keyword fallbacks and surfaces close
   * matches here so the LLM can re-run search_appointments without a separate
   * lookup_benefit round-trip.
   */
  did_you_mean?: string[];
  /**
   * Set when an elicitation step actually fired (e.g. user disambiguated
   * paediatric/adult scope mid-call). LLM can mention to the user how the
   * filter was applied.
   */
  elicited?: {
    province?: string;
    scope?: "adult" | "child" | "all";
  };
  /**
   * Fallback signal when the host does NOT support `elicitation/create`
   * (e.g. AWS Bedrock as of 2026-05). The widget renders inline buttons for
   * the user to pick the disambiguator; the LLM is instructed to ask the
   * user in chat if no widget is available.
   */
  disambiguation_needed?: {
    /** Province enum needed (when both benefit and province missing). */
    province?: boolean;
    /** Scope enum needed (when results have both adult and paediatric records). */
    scope?: { has_adult: boolean; has_paediatric: boolean };
  };
}

/**
 * Output of `list_other_places`.
 */
export interface ListOtherPlacesOutput {
  kind: "other-places";
  benefit: string;
  provider: string;
  /** UUID of the queue from which the user opened this drawer. */
  origin_queue_id: string;
  places: NormalizedQueueResult[];
  data_freshness: string;
}

/**
 * Error / info shape — surfaced to widget when NFZ returns HTTP 400 or
 * a documented info code (1200038 sanatorium, 1200055 referring doctor).
 */
export interface ErrorOutput {
  kind: "error";
  is_info: boolean;
  code: number;
  message: string;
  /** Optional redirect hint (e.g., skierowania.nfz.gov.pl for code 1200038). */
  redirect_url?: string;
}

// ============================================================================
// Zod outputSchemas (ZodRawShapeCompat — pass directly to registerTool)
// ============================================================================

const accessibilitySchema = z.object({
  toilet: z.boolean(),
  ramp: z.boolean(),
  carPark: z.boolean(),
  elevator: z.boolean(),
});

const normalizedQueueResultSchema = z.object({
  queue_id: z.string(),
  benefit: z.string(),
  provider: z.string(),
  place: z.string(),
  locality: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  wait_date: z.string(),
  wait_days_from_today: z.number().int(),
  snapshot_date: z.string(),
  awaiting: z.number().int().nullable(),
  average_period_days: z.number().nullable(),
  accessibility: accessibilitySchema,
  benefits_for_children: z.boolean(),
  age_range: z.string().nullable(),
  has_other_places: z.boolean(),
});

const searchQuerySchema = z.object({
  benefit: z.string().optional(),
  province: z.enum(PROVINCE_ENUM).optional(),
  case: z.union([z.literal(1), z.literal(2)]).optional(),
  locality: z.string().optional(),
  benefit_for_children: z.boolean().optional(),
  limit: z.number().int().optional(),
});

/**
 * `search_appointments` outputSchema. Optional success fields coexist with
 * optional error fields so an `is_info` redirect (kind: "error") and a
 * successful payload (kind: "search") both validate against the same shape.
 */
export const SEARCH_APPOINTMENTS_OUTPUT_SCHEMA = {
  kind: z.union([z.literal("search"), z.literal("error")])
    .meta({ description: "'search' on success; 'error' on NFZ-validation or info-code response" }),

  // -- success fields ------------------------------------------------------
  query: searchQuerySchema.optional()
    .meta({ description: "Echo of the input parameters as the server interpreted them" }),
  count: z.number().int().optional()
    .meta({ description: "Renderable results count after dropping null-date NFZ records" }),
  count_raw_nfz: z.number().int().optional()
    .meta({ description: "Raw NFZ-reported total before defensive filtering" }),
  count_skipped_invalid: z.number().int().optional()
    .meta({ description: "How many NFZ records were dropped (missing wait_date)" }),
  page: z.number().int().optional(),
  total_pages: z.number().int().optional(),
  results: z.array(normalizedQueueResultSchema).optional()
    .meta({ description: "Records with geo coordinates — renderable on the Leaflet map" }),
  results_no_geo: z.array(normalizedQueueResultSchema).optional()
    .meta({ description: "Records without lat/lng — rendered in the no-location panel" }),
  data_freshness: z.string().optional()
    .meta({ description: "NFZ meta.date-modified timestamp" }),
  newest_snapshot: z.string().nullable().optional()
    .meta({ description: "Newest dates.date-situation-as-at across results" }),
  banner: z.object({ type: z.enum(["I", "O"]), content: z.string() }).nullable().optional(),
  did_you_mean: z.array(z.string()).optional()
    .meta({ description: "Close-match benefit names returned when count=0 with a freeform benefit term" }),
  elicited: z.object({
    province: z.string().optional(),
    scope: z.enum(["adult", "child", "all"]).optional(),
  }).optional()
    .meta({ description: "Filters that were applied via interactive elicitation form" }),
  disambiguation_needed: z.object({
    province: z.boolean().optional(),
    scope: z.object({ has_adult: z.boolean(), has_paediatric: z.boolean() }).optional(),
  }).optional()
    .meta({ description: "Widget should render inline buttons; LLM should ask user in chat" }),

  // -- error / info fields -------------------------------------------------
  is_info: z.boolean().optional()
    .meta({ description: "True for non-fatal NFZ info codes (e.g. sanatorium redirect)" }),
  code: z.number().int().optional()
    .meta({ description: "NFZ error code (1200005, 1200038, ...) or 0 for transport errors" }),
  message: z.string().optional()
    .meta({ description: "User-facing error message (Polish for documented NFZ codes)" }),
  redirect_url: z.string().optional()
    .meta({ description: "Redirect target for info codes (e.g. skierowania.nfz.gov.pl)" }),
};

/**
 * `list_other_places` outputSchema. Same shape on success or error.
 */
export const LIST_OTHER_PLACES_OUTPUT_SCHEMA = {
  kind: z.union([z.literal("other-places"), z.literal("error")])
    .meta({ description: "'other-places' on success; 'error' otherwise" }),

  benefit: z.string().optional(),
  provider: z.string().optional(),
  origin_queue_id: z.string().optional()
    .meta({ description: "queue_id of the parent search_appointments result that opened this drawer" }),
  places: z.array(normalizedQueueResultSchema).optional(),
  data_freshness: z.string().optional(),

  is_info: z.boolean().optional(),
  code: z.number().int().optional(),
  message: z.string().optional(),
  redirect_url: z.string().optional(),
};

/**
 * Shared `lookup_*` outputSchema. Same shape across benefit / locality / provider.
 */
export const LOOKUP_OUTPUT_SCHEMA = {
  kind: z.union([z.literal("lookup"), z.literal("error")]),
  entity: z.enum(["benefit", "locality", "provider"]).optional()
    .meta({ description: "Which NFZ dictionary was queried" }),
  results: z.array(z.string()).optional()
    .meta({ description: "Up to 25 official Polish names ranked by NFZ" }),
  did_you_mean: z.array(z.string()).optional()
    .meta({ description: "When results is empty: NFZ-verified close matches to retry with" }),

  is_info: z.boolean().optional(),
  code: z.number().int().optional(),
  message: z.string().optional(),
  redirect_url: z.string().optional(),
};
