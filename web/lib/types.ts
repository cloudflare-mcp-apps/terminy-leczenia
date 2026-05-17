/**
 * Widget Types for Terminy Leczenia NFZ.
 *
 * Mirror the server-side types in src/schemas/outputs.ts.
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

export interface SearchAppointmentsOutput {
  kind: "search";
  query: {
    benefit?: string;
    province?: string;
    case?: 1 | 2;
    locality?: string;
    benefit_for_children?: boolean;
    limit?: number;
  };
  count: number;
  page: number;
  total_pages: number;
  results: NormalizedQueueResult[];
  results_no_geo: NormalizedQueueResult[];
  data_freshness: string;
  newest_snapshot: string | null;
  banner: { type: "I" | "O"; content: string } | null;
  did_you_mean?: string[];
  elicited?: {
    province?: string;
    scope?: "adult" | "child" | "all";
  };
  disambiguation_needed?: {
    province?: boolean;
    scope?: { has_adult: boolean; has_paediatric: boolean };
  };
}

export interface ListOtherPlacesOutput {
  kind: "other-places";
  benefit: string;
  provider: string;
  origin_queue_id: string;
  places: NormalizedQueueResult[];
  data_freshness: string;
}

export interface ErrorOutput {
  kind: "error";
  is_info: boolean;
  code: number;
  message: string;
}

export type ToolOutput =
  | SearchAppointmentsOutput
  | ListOtherPlacesOutput
  | ErrorOutput;

export type WidgetStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "search"; data: SearchAppointmentsOutput }
  | { kind: "error"; message: string };
