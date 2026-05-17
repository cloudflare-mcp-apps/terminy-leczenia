/**
 * Server Instructions for Terminy Leczenia NFZ MCP.
 *
 * Injected into the LLM system prompt during MCP initialization.
 *
 * Pattern: Purpose → Capabilities → Usage Patterns → Performance → Constraints
 * Aligned with: guides/server_instruction_guide.md (v1.2.0), MCP Spec 2025-11-25.
 *
 * Anti-duplication: per-tool semantics live in tool descriptions (4-part).
 * This file documents only CROSS-CUTTING workflows, sequencing, and constraints.
 */

export const SERVER_INSTRUCTIONS = `
Terminy Leczenia NFZ — Polish public-healthcare appointment-queue search ("Informator o Terminach Leczenia" open data API).

## Key Capabilities
- First-available appointment date for any NFZ benefit nationwide
- Interactive map + list widget with wait times, accessibility flags, and provider phone
- Alternative locations of multi-site providers (wait times can differ by months)

## Usage Patterns
1. **lookup_benefit FIRST** when the patient names a procedure, symptom, or specialty in lay language. NFZ's dictionary is organised by DEPARTMENT/CLINIC names (e.g. "ODDZIAŁ OTORYNOLARYNGOLOGICZNY"), NOT by procedure names. Patient says "operacja przegrody nosa" → query "OTOLARYNGOLOGIA"; patient says "rezonans kolana" → query "REZONANS".
2. **search_appointments** with the exact benefit name + voivodeship code (01-16). Renders the widget.
3. **list_other_places(queue_id)** when a result has has_other_places=true — surfaces faster alternatives at the same provider.

## Disambiguation Rules
- **case=1 stable** is the default. Use **case=2 urgent** ONLY when the patient explicitly says "pilny" / "urgent".
- **benefit_for_children=false** by default for adults. Paediatric departments are SEPARATE NFZ entries (e.g. "ODDZIAŁ OTOLARYNGOLOGICZNY DZIECIĘCY") and will otherwise mix into results.
- **locality** parameter is OPTIONAL — patient asking about a whole voivodeship should not get locality filtered; only set it when the patient names a specific city.

## Response Format
search_appointments and list_other_places return structuredContent with: results[] (with geo), results_no_geo[] (lat/lng=null edge cases), data_freshness (live NFZ regeneration), newest_snapshot (when queue lengths were last sampled — can be weeks old).

## Performance & Limits
- Cold call < 2 s; warm KV cache < 500 ms
- Cache TTL: 24 h for dictionaries, 1 h for queue results
- Max 25 results per call (NFZ hard cap)
- Wait dates further than 12 months out are common in NFZ data and accurate, not stale

## Out of Scope
- **Sanatorium** (leczenie uzdrowiskowe) — NFZ redirects to skierowania.nfz.gov.pl (error code 1200038); we surface the redirect
- **Symptom → benefit translation** ("boli mnie serce" → list of suitable benefits) — handled by the companion nfz-benefits server
- **Booking** — patient must call the provider directly (phone is in the result)

## Important Notes
- All NFZ data is public and anonymous — no PHI processed
- Widget state is ephemeral (not persisted between sessions)
- Long-range agents: results are self-contained; no progress tracking or checkpoint tools needed
`.trim();

export default SERVER_INSTRUCTIONS;
