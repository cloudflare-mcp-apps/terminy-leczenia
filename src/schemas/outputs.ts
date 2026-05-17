/**
 * Output Types for Terminy Leczenia NFZ tools.
 *
 * Normalized shapes returned to widget and structuredContent.
 *
 * @module schemas/outputs
 */

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
