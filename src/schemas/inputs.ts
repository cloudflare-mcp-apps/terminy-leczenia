/**
 * Input Schemas for Terminy Leczenia NFZ tools.
 *
 * Zod 4 plain-object pattern (ZodRawShapeCompat). Do NOT wrap in z.object().
 *
 * @module schemas/inputs
 */

import * as z from "zod/v4";

/**
 * Voivodeship code enum — 16 Polish provinces.
 * Tuple typed for `as const`-friendly z.enum() usage.
 */
export const PROVINCE_ENUM = [
  "01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16",
] as const;

const PROVINCE_DESC =
  "Voivodeship code (01-16): 01=dolnośląskie, 02=kujawsko-pomorskie, 03=lubelskie, " +
  "04=lubuskie, 05=łódzkie, 06=małopolskie, 07=mazowieckie, 08=opolskie, " +
  "09=podkarpackie, 10=podlaskie, 11=pomorskie, 12=śląskie, 13=świętokrzyskie, " +
  "14=warmińsko-mazurskie, 15=wielkopolskie, 16=zachodniopomorskie.";

// ============================================================================
// search_appointments — main tool (widget)
// ============================================================================

export const SearchAppointmentsInput = {
  benefit: z.string().min(3).max(250).optional().meta({
    description:
      "Freeform Polish benefit term (e.g. 'zaćma', 'rezonans kolana', 'kardiolog', 'operacja przegrody nosa') OR an exact NFZ dictionary name. " +
      "Required if `province` is not given. If the term does not match the NFZ dictionary, the server returns 0 results plus " +
      "`did_you_mean[]` with close matches in the same response — re-call `search_appointments` with one of those names. " +
      "Do NOT pre-call `lookup_benefit` unless the patient explicitly wants to browse the dictionary. " +
      "CRITICAL: prefer the patient's literal procedure term ('ZAĆMA', 'PRZEGRODA', 'SOCZEWKI') over a department label ('ODDZIAŁ OKULISTYCZNY'). " +
      "NFZ stores procedures and departments as SEPARATE queues with very different waits — querying the department when a procedure-specific benefit exists will return a misleading 'first-available' date for a different service.",
  }),
  province: z.enum(PROVINCE_ENUM).optional().meta({
    description: PROVINCE_DESC + " Required if `benefit` is not given.",
  }),
  case: z.union([z.literal(1), z.literal(2)]).optional().meta({
    description:
      "Medical urgency: 1 = przypadek stabilny (stable, default), " +
      "2 = przypadek pilny (urgent — only when patient explicitly says 'pilny' / 'urgent').",
  }),
  locality: z.string().max(250).optional().meta({
    description:
      "Exact NFZ locality name (uppercase). City districts are separate entries " +
      "(e.g. 'WARSZAWA' vs 'WARSZAWA MOKOTÓW'). Use `lookup_locality` to disambiguate.",
  }),
  benefit_for_children: z.boolean().optional().meta({
    description: "If true, restrict to places that offer the benefit for children.",
  }),
  limit: z.number().int().min(1).max(25).optional().meta({
    description: "Max results (default 10, NFZ hard cap 25).",
  }),
};

export interface SearchAppointmentsParams {
  benefit?: string;
  province?: (typeof PROVINCE_ENUM)[number];
  case?: 1 | 2;
  locality?: string;
  benefit_for_children?: boolean;
  limit?: number;
}

// ============================================================================
// list_other_places — follow-up tool (widget inline)
// ============================================================================

export const ListOtherPlacesInput = {
  queue_id: z.string().min(1).meta({
    description:
      "Queue UUID returned by `search_appointments` for an entry where has_other_places=true " +
      "(NFZ flag many-places='Y'). Fetches all other locations of the same provider offering " +
      "the same benefit. Wait times can differ dramatically across locations of one provider.",
  }),
};

export interface ListOtherPlacesParams {
  queue_id: string;
}

// ============================================================================
// lookup_benefit — LLM-only (geocode-style)
// ============================================================================

export const LookupBenefitInput = {
  query: z.string().min(3).max(250).meta({
    description:
      "Substring (case-insensitive) of an NFZ benefit name. Examples: 'KARDIOLOG' (returns 12 " +
      "entries including 'ODDZIAŁ KARDIOLOGICZNY', 'REHABILITACJA KARDIOLOGICZNA W WARUNKACH " +
      "STACJONARNYCH'), 'REZONANS' (returns 'REZONANS MAGNETYCZNY').",
  }),
  limit: z.number().int().min(1).max(25).optional().meta({
    description: "Max results (default 10, NFZ hard cap 25).",
  }),
};

export interface LookupBenefitParams {
  query: string;
  limit?: number;
}

// ============================================================================
// lookup_locality — LLM-only
// ============================================================================

export const LookupLocalityInput = {
  query: z.string().min(3).max(250).meta({
    description: "Substring of a locality name (Polish diacritics OK; min 3 chars).",
  }),
  province: z.enum(PROVINCE_ENUM).meta({ description: PROVINCE_DESC }),
  limit: z.number().int().min(1).max(25).optional().meta({
    description: "Max results (default 10, NFZ hard cap 25).",
  }),
};

export interface LookupLocalityParams {
  query: string;
  province: (typeof PROVINCE_ENUM)[number];
  limit?: number;
}

// ============================================================================
// lookup_provider — LLM-only
// ============================================================================

export const LookupProviderInput = {
  query: z.string().min(3).max(250).meta({
    description:
      "Substring of a healthcare provider's official name (long official forms, e.g. " +
      "'5 WOJSKOWY SZPITAL KLINICZNY Z POLIKLINIKĄ...'). Min 3 chars.",
  }),
  province: z.enum(PROVINCE_ENUM).meta({ description: PROVINCE_DESC }),
  limit: z.number().int().min(1).max(25).optional().meta({
    description: "Max results (default 10, NFZ hard cap 25).",
  }),
};

export interface LookupProviderParams {
  query: string;
  province: (typeof PROVINCE_ENUM)[number];
  limit?: number;
}
