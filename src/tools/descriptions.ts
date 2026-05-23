/**
 * Tool descriptions for Terminy Leczenia NFZ MCP server.
 *
 * 4-part pattern: Purpose → Returns → Use Case → Constraints.
 * Tool descriptions deliberately chain (canonical map-server pattern):
 * `lookup_benefit` is referenced as a precondition from `search_appointments`,
 * etc.
 *
 * @module tools/descriptions
 */

export interface ToolMetadata {
  title: string;
  description: {
    part1_purpose: string;
    part2_returns: string;
    part3_useCase: string;
    part4_constraints: string;
  };
  examples: { scenario: string; description: string }[];
}

export const TOOL_METADATA = {
  search_appointments: {
    title: "Search NFZ Appointments",
    description: {
      part1_purpose:
        "Searches the public Polish healthcare appointment-queue system for the first available treatment date for a given benefit, optionally filtered by voivodeship, locality, urgency, and paediatric scope.",
      part2_returns:
        "Returns up to 25 ranked queue entries with provider, place, address, phone, first-available date, wait-time statistics (people in queue, average wait), accessibility flags (toilet, ramp, car-park, elevator), geographic coordinates, and a flag indicating whether the same provider offers the benefit at other locations — rendered as an interactive map + list widget.",
      part3_useCase:
        "Use whenever the patient asks where or when they can get a specific healthcare benefit (examples: 'najszybszy rezonans kolana w Mazowieckiem', 'kardiolog dla dziecka w Krakowie pilnie').",
      part4_constraints:
        "INTERACTIVE BEHAVIOR (let the server elicit): " +
        "(a) If both benefit and province are missing, the server elicits voivodeship via a form — DO NOT pre-fill defaults. " +
        "(b) If the freeform benefit does not match the NFZ dictionary, the response carries did_you_mean[] with close matches — re-call with one of those names. " +
        "(c) If results mix paediatric and adult departments AND benefit_for_children was not set, the server elicits scope via a form — DO NOT pre-fill benefit_for_children. " +
        "URGENCY: default to case=1 (stable); use case=2 only when the patient explicitly says 'pilny' / 'urgent'. " +
        "LOCALITY: only set when the patient names a specific city. " +
        "Max 25 results per call. The `elicited` field in the response tells you which filters were applied via form.",
    },
    examples: [
      {
        scenario: "Stable cardiology consultation in Mazowieckie",
        description: "search_appointments(benefit='KARDIOLOGICZNA', province='07', case=1, limit=10)",
      },
      {
        scenario: "Urgent paediatric MRI in Małopolskie",
        description: "search_appointments(benefit='REZONANS MAGNETYCZNY', province='06', case=2, benefit_for_children=true)",
      },
    ],
  },

  list_other_places: {
    title: "List Other Locations of Same Provider",
    description: {
      part1_purpose:
        "Lists every other location where the same healthcare provider offers the same benefit, with each location's distinct first-available date.",
      part2_returns:
        "Returns a list of places (address, locality, phone, geo, wait date, statistics, accessibility) — wait times can differ dramatically across locations of one provider (live probe data showed a 67-day spread within one provider). Rendered as an inline drawer in the parent map widget.",
      part3_useCase:
        "Use when the patient asks 'are there other locations of this same place' OR after a search_appointments result with has_other_places=true to surface a faster alternative at the same provider.",
      part4_constraints:
        "Input is the queue_id (UUID) from a search_appointments result. Only meaningful when the original result had has_other_places=true (NFZ flag many-places='Y').",
    },
    examples: [
      {
        scenario: "Same provider, alternative locations",
        description: "list_other_places(queue_id='51fce308-2de6-0c37-e063-b4200a0a4cb3')",
      },
    ],
  },

  lookup_benefit: {
    title: "Lookup NFZ Benefit Name",
    description: {
      part1_purpose:
        "Returns the official Polish healthcare benefit names matching a substring query — required precondition for search_appointments because the queue API only matches dictionary entries, not freeform terms.",
      part2_returns:
        "Returns up to 25 official benefit names (uppercase Polish) as a plain text list, one per line, ranked by NFZ. The dictionary mixes DEPARTMENT/CLINIC entries ('ODDZIAŁ KARDIOLOGICZNY', 'PORADNIA OKULISTYCZNA') with PROCEDURE entries ('ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)', 'REZONANS MAGNETYCZNY') — they are DIFFERENT NFZ queues with different waits.",
      part3_useCase:
        "Use whenever you do NOT already have an exact dictionary name. Pick the most specific match from the result list and pass it verbatim to search_appointments.",
      part4_constraints:
        "Query must be at least 3 characters. " +
        "CRITICAL: try the patient's LITERAL term first ('ZAĆMA', 'SOCZEWKI', 'PRZEGRODA', 'KOLANO') — NFZ exposes procedure-level benefits with realistic queue data. Only widen to department/specialty names ('OKULISTYCZNY', 'OTOLARYNGOLOG') if the literal term returns 0 results. " +
        "NEVER substitute a department for a procedure when both exist — 'ODDZIAŁ OKULISTYCZNY' (oddział, kilka osób w kolejce) is a different queue than 'ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)' (procedura, kolejka miesiące) even though both treat eyes. " +
        "Mapping (literal → fallback if 0 results): 'zaćma' → ['ZAĆMA' or 'SOCZEWKI', else 'OKULISTYCZNY']; 'septoplastyka' / 'przegroda nosa' → ['PRZEGRODA' or 'SEPTOPLASTYKA', else 'OTOLARYNGOLOG']; 'kolano' (rezonans) → ['REZONANS']; 'kardiolog' → ['KARDIOLOG']. " +
        "Avoid over-specific phrases ('PORADNIA KARDIOLOGICZNA' = 0 results — shorter substring wins). " +
        "If results=0, the response carries `did_you_mean[]` with NFZ-verified close matches — pick one and pass it verbatim to search_appointments, do NOT guess a new specialty term.",
    },
    examples: [
      {
        scenario: "Find cardiology-related benefits (specialty fallback)",
        description: "lookup_benefit(query='KARDIOLOG') → 12 official names",
      },
      {
        scenario: "Procedure-level benefit (literal term wins)",
        description: "lookup_benefit(query='ZAĆMA') → 'ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)' — pass THIS to search_appointments, not 'ODDZIAŁ OKULISTYCZNY'",
      },
    ],
  },

  lookup_locality: {
    title: "Lookup NFZ Locality Name",
    description: {
      part1_purpose:
        "Returns Polish locality names from the NFZ dictionary matching a substring within a specified voivodeship — needed to disambiguate city vs district before passing to search_appointments.",
      part2_returns:
        "Returns up to 25 locality names (uppercase Polish) as a plain text list. City districts are separate entries — example: query='Warszawa' in voivodeship 07 returns WARSZAWA, WARSZAWA BEMOWO, WARSZAWA BIAŁOŁĘKA, WARSZAWA BIELANY, WARSZAWA MOKOTÓW, ... (19 total).",
      part3_useCase:
        "Use when the patient mentions a city to find both the city itself and its districts. Pass the chosen exact name to search_appointments(locality=...).",
      part4_constraints:
        "Query must be at least 3 characters. Voivodeship code (01-16) is required.",
    },
    examples: [
      {
        scenario: "Warsaw and its districts in Mazowieckie",
        description: "lookup_locality(query='Warszawa', province='07')",
      },
    ],
  },

  lookup_provider: {
    title: "Lookup NFZ Healthcare Provider",
    description: {
      part1_purpose:
        "Returns Polish healthcare-provider names from the NFZ dictionary matching a substring within a specified voivodeship.",
      part2_returns:
        "Returns up to 25 official provider names (uppercase Polish, often long official forms like '5 WOJSKOWY SZPITAL KLINICZNY Z POLIKLINIKĄ - SAMODZIELNY PUBLICZNY ZAKŁAD OPIEKI ZDROWOTNEJ W KRAKOWIE') as a plain text list.",
      part3_useCase:
        "Use when the patient names a specific hospital or clinic ('chcę termin w CMKP', 'w Szpitalu Wolskim') rather than a benefit type.",
      part4_constraints:
        "Query must be at least 3 characters. Voivodeship code (01-16) is required. NFZ does not expose direct provider→queues lookup; for that, take a provider name from this list and feed it as a future provider parameter (not implemented in MVP) or filter results returned by search_appointments.",
    },
    examples: [
      {
        scenario: "Hospitals in Małopolskie",
        description: "lookup_provider(query='szpital', province='06')",
      },
    ],
  },
} as const satisfies Record<string, ToolMetadata>;

export type ToolName = keyof typeof TOOL_METADATA;

export function getToolDescription(toolName: ToolName): string {
  const meta = TOOL_METADATA[toolName];
  const { part1_purpose, part2_returns, part3_useCase, part4_constraints } = meta.description;
  return `${part1_purpose} ${part2_returns} ${part3_useCase} ${part4_constraints}`;
}

export function getToolExamples(toolName: ToolName): readonly { scenario: string; description: string }[] {
  return TOOL_METADATA[toolName].examples;
}
