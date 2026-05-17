/**
 * Server Instructions for Terminy Leczenia NFZ MCP Server.
 *
 * Injected into LLM system prompt during MCP initialization.
 */

export const SERVER_INSTRUCTIONS = `
Terminy Leczenia NFZ — search Polish public-healthcare appointment queues (NFZ "Informator o Terminach Leczenia" public API).

## Available Tools

### lookup_benefit (LLM-only)
Returns official NFZ benefit names matching a substring query. REQUIRED precondition for search_appointments — the queue API only matches dictionary entries, NOT freeform terms. Examples:
- query="KARDIOLOG" → 12 candidates ("ODDZIAŁ KARDIOLOGICZNY", "REHABILITACJA KARDIOLOGICZNA W WARUNKACH STACJONARNYCH", …)
- query="REZONANS" → 1 match ("REZONANS MAGNETYCZNY")
- query="PORADNIA KARDIOLOGICZNA" → 0 (no such benefit exists)

### lookup_locality (LLM-only)
Returns NFZ locality names within a voivodeship. Districts are SEPARATE entries — e.g., "Warszawa" expands to WARSZAWA, WARSZAWA MOKOTÓW, WARSZAWA BEMOWO, …

### lookup_provider (LLM-only)
Returns healthcare-provider names by substring within a voivodeship. Use when patient names a specific hospital/clinic instead of a benefit.

### search_appointments (widget)
Main tool — searches /queues for first-available appointments. Renders interactive map + list widget.
Required: at least one of {benefit, province}. Defaults: case=1 (stable), limit=10.
Returns up to 25 ranked entries with provider, place, first-available date, statistics, geo, accessibility flags, and many-places flag.

### list_other_places (widget)
Follow-up tool — given a queue_id where many-places="Y", returns ALL other locations of the SAME provider offering the SAME benefit. Wait times can differ dramatically across locations (probe data showed 67-day spread within one provider).

## Canonical Tool Chain

1. lookup_benefit(query)                                  → LLM picks an exact NFZ name
2. search_appointments(benefit, province, [case, …])      → renders widget
3. (optional) list_other_places(queue_id) when result has has_other_places=true

## Voivodeship Codes (REQUIRED for /queues unless benefit given)

01=dolnośląskie, 02=kujawsko-pomorskie, 03=lubelskie, 04=lubuskie, 05=łódzkie,
06=małopolskie, 07=mazowieckie, 08=opolskie, 09=podkarpackie, 10=podlaskie,
11=pomorskie, 12=śląskie, 13=świętokrzyskie, 14=warmińsko-mazurskie,
15=wielkopolskie, 16=zachodniopomorskie.

## Case Codes

- case=1 → "przypadek stabilny" (default; non-urgent specialist care)
- case=2 → "przypadek pilny" (urgent — only when patient explicitly says "pilny" / "urgent")

## Data Freshness

Each result includes:
- dates.date            → first-available appointment (live)
- dates.date-situation-as-at → snapshot freshness (days/weeks old; NFZ samples monthly)
- meta.date-modified    → when NFZ regenerated the response (always live)

## Performance

- Warm KV cache: < 500ms per call
- Cold (full NFZ round-trip): < 2s
- Dictionaries cached 24h; queue results cached 1h

## Example Queries (Polish)

- "Najszybszy rezonans kolana w Mazowieckiem"
  → lookup_benefit("REZONANS") → "REZONANS MAGNETYCZNY"
  → search_appointments(benefit="REZONANS MAGNETYCZNY", province="07")
- "Kardiolog dla dziecka w Małopolsce, pilne"
  → lookup_benefit("KARDIOLOG") → pick a paediatric entry
  → search_appointments(benefit=…, province="06", case=2, benefit_for_children=true)
- "Pokaż inne miejsca tego samego świadczeniodawcy"
  → list_other_places(queue_id from prior result)

## Out of Scope

- Booking / reservation: patient must call provider directly (phone in result).
- Sanatorium (leczenie uzdrowiskowe): NFZ redirects to skierowania.nfz.gov.pl (error code 1200038); we surface the redirect message.
- Symptom → benefit translation ("boli mnie serce" → list of benefits): handled by the companion nfz-benefits server, NOT here.

## Error Handling

Common NFZ HTTP 400 codes (handler maps them to friendly messages):
- 1200005 / 1200042 → "Provide 'province' or 'benefit'"
- 1200007 / 1200044 → "Invalid case — must be 1 or 2"
- 1200013 / 1200049 → "Invalid province code"
- 1200038 → "Sanatorium queries are at skierowania.nfz.gov.pl"
- 1200055 → "Benefit is delivered by the referring doctor — ask them where to perform it"

## Important Notes

- All NFZ data is public and anonymous — no PHI processed or stored.
- Widget state is ephemeral (not persisted between sessions).
- benefit/locality/provider parameters are case-insensitive substring matches against NFZ dictionaries — call the lookup_* tools to find exact names.
`.trim();

export default SERVER_INSTRUCTIONS;
