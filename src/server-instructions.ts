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
1. **search_appointments is the entry point**. You may pass a freeform Polish benefit term ('operacja przegrody nosa', 'rezonans kolana') — if it does not match NFZ's official dictionary, the server returns 0 results PLUS a did_you_mean list of close matches in the same response. Re-call search_appointments with one of those names. Skip lookup_benefit unless the patient explicitly wants to browse the dictionary.
2. **Missing province?** Don't pre-fill. The server will elicit voivodeship via a form if both benefit and province are missing — let the user pick.
3. **Mixed paediatric/adult results?** Don't pre-fill benefit_for_children. If results contain both, the server will elicit scope via a form. The result then includes elicited.scope so you know which filter was applied.
4. **list_other_places(queue_id)** when a result has has_other_places=true — surfaces faster alternatives at the same provider.

## Disambiguation Rules
- **Procedure beats department.** When the patient names a specific procedure or condition, pass that literal Polish term as the benefit. Do NOT substitute the parent medical specialty or hospital-ward name. NFZ stores procedure-level entries and department-level entries as SEPARATE queues with very different waits — substituting the broader department returns a misleading first-available date for a different service. Fall back to the specialty only if the literal term returns 0 results and the did_you_mean array contains no procedure-shaped candidate.
- **case=1 stable** is the default. Use **case=2 urgent** ONLY when the patient explicitly says "pilny" / "urgent".
- **benefit_for_children=false** by default for adults. Paediatric departments are SEPARATE NFZ entries (e.g. "ODDZIAŁ OTOLARYNGOLOGICZNY DZIECIĘCY") and will otherwise mix into results.
- **benefit_for_children=true MUST be set explicitly** when the patient mentions a child ("dla dziecka", "dziecięcy", "pediatryczny", "dla mojego syna/córki", "pediatra"). Do NOT rely on the benefit name to imply paediatric scope — even if the freeform term contains "dziecięcy", the NFZ dictionary match may not, and the filter is what guarantees the correct department class.
- **locality** parameter is OPTIONAL — patient asking about a whole voivodeship should not get locality filtered; only set it when the patient names a specific city.

## Response Format
search_appointments and list_other_places return structuredContent with: results[] (with geo), results_no_geo[] (lat/lng=null edge cases), count (renderable, after filtering invalid records), count_raw_nfz, count_skipped_invalid, data_freshness, newest_snapshot, did_you_mean[] (close-match suggestions when count=0), elicited{province, scope} (filters applied via interactive form), disambiguation_needed{province, scope} (widget should render buttons).

## Interaction Boundaries (Claude MCP Apps philosophy)
Per Claude MCP Apps docs, **filtering of already-displayed data is widget territory**, not chat. When the response carries disambiguation_needed:
- The widget renders inline filter buttons (👤 / 👶) automatically.
- DO NOT also ask the user the same question in chat — that creates redundant double-questioning.
- DO briefly summarise the dual-top sections that already arrived in your text response (the server pre-segregates "earliest for adults" vs "earliest for children").
- Only narrate disambiguation when text-only summary is the ONLY output channel (rare — most hosts render the widget).

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
