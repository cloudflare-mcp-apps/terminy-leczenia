---
Created: 2026-05-24
Updated: 2026-05-24
---

# Eval Report — terminy-leczenia

**Server:** https://terminy-leczenia.wtyczki.ai/mcp
**Model:** openai/gpt-5.4-mini
**Iterations:** 3 per scenario
**Run:** 2026-05-24 00:46 GMT+2
**Overall accuracy:** **7/9 scenarios at 100%**, average accuracy **0.81** across all 9.

## Summary table

| # | Scenario | Type | Tool target | Iter | Accuracy | Avg tokens |
|---|----------|------|-------------|------|----------|-----------:|
| 1 | search MRI knee in mazowieckie | happy | `search_appointments` | 3 | 3/3 (100%) | 8 609 |
| 2 | urgent paediatric cardio in malopolskie | happy | `search_appointments` | 3 | **2/3 (66%)** | 9 489 |
| 3 | explicit dictionary browse | happy | `lookup_benefit` | 3 | 3/3 (100%) | 7 969 |
| 4 | lookup_locality Warsaw districts | happy | `lookup_locality` | 3 | 3/3 (100%) | 5 966 |
| 5 | lookup_provider military hospitals | happy | `lookup_provider` | 3 | 3/3 (100%) | 8 521 |
| 6 | direct search, no lookup detour | vague-UI | `search_appointments` | 3 | **0/3 (0%)** | 5 547 |
| 7 | search then list_other_places | multi-turn | `search_appointments` → `list_other_places` | 3 | **0/3 (0%)** | 19 026 |
| 8 | documentation question | negative | (no calls) | 3 | 3/3 (100%) | 3 121 |
| 9 | vague non-actionable | negative | (no calls) | 3 | 3/3 (100%) | 2 737 |

## Failures (accuracy < 100%)

### #6 — "vague — direct search_appointments, no lookup_benefit detour" — 0%
- **Expected:** call `search_appointments` directly (per server instructions: *"search_appointments is the entry point"*, *"Skip lookup_benefit unless the patient explicitly wants to browse the dictionary"*).
- **Got (3/3 iterations):** `[lookup_benefit, lookup_benefit]` — model bounces off `lookup_benefit` twice and never reaches `search_appointments`.
- **Root cause — schema/instructions contradiction:** The `benefit` field description inside `search_appointments.inputSchema` says: *"ALWAYS call `lookup_benefit` first if you do not already have an exact NFZ name — the queue API only matches dictionary entries, not freeform terms."* This directly contradicts the server-level `instructions` ("Skip lookup_benefit unless..."). The LLM trusts the per-tool schema description (closer to the call site) over the server instructions and defaults to the lookup-first path. After `lookup_benefit` returns a long uppercase list, the model gives up rather than proceeding — likely because it cannot confidently pick one entry to feed back.

### #7 — "multi-turn — search then list_other_places" — 0%
- **Expected:** turn 1 calls `search_appointments({province:"15"})`, turn 2 calls `list_other_places({queue_id: <uuid from turn 1>})`.
- **Got (3/3 iterations):** Both calls happen, but `list_other_places` is invoked with `{queue_id: "unknown"}` and the server returns `isError: true` — *"Resource not found — the supplied ID does not exist."* (captured by `captureToolErrors`).
- **Root cause — UUIDs not surfaced in `content[]`:** `search_appointments` puts the queue UUID in `structuredContent.results[].queue_id` (consumed by the widget) but the text payload returned to the LLM in chat does not include the UUID per row. The model literally writes the string `"unknown"` as `queue_id` because no candidate value is visible. The dual-return pattern is wired for the widget but starves the chat-side LLM of the identifier needed for the chained tool.
- **Same lookup_benefit detour also appears here** (every iteration starts with `lookup_benefit, lookup_benefit`), confirming finding #6 is systemic.

### #2 — "happy — urgent paediatric cardio in malopolskie" — 66%
- **Expected:** `search_appointments({province:"06", case:2, benefit_for_children:true})`.
- **Got (1/3 failed iteration):** model called `lookup_benefit("KARDIOLOG")` first, picked a paediatric-specific entry like `ODDZIAŁ KARDIOLOGICZNY DLA DZIECI` from the result, then called `search_appointments` **without** `benefit_for_children:true` (it inferred "the benefit name already covers paediatrics, no need for the filter").
- **Root cause:** secondary effect of finding #6 — the unnecessary `lookup_benefit` detour rewrites the model's mental state and makes it drop the `benefit_for_children` filter. Pass rate stays above the 0.66 floor, but the failure mode is the same lookup-first contradiction.

## Recommendations

Ordered by impact. Numbers reference the failures above.

1. **[Fixes #6, #7-partial, #2] Remove the "ALWAYS call `lookup_benefit` first" sentence from the `benefit` field description in `search_appointments.inputSchema`.** It directly fights the server instructions and degrades two scenarios. Replace it with a single sentence aligned with the canonical flow: *"Accepts freeform Polish; if it does not match the NFZ dictionary, the server returns `did_you_mean[]` — re-call with one of those names."*
   Reference: `guides/tool_description_guide.md` §"When to Add a Second Sentence" point 2 (Cross-tool disambiguation). Description should narrate the **server's actual contract**, not a precondition the server itself overrides.

2. **[Fixes #7] Surface `queue_id` in the text `content[]` payload of `search_appointments`.** Today only `structuredContent` carries it, so chat-side LLMs writing `list_other_places({queue_id: ...})` from a prior result see no candidate and emit `"unknown"`. Either inline a short `(id: <short-uuid>)` per result line, or document in `list_other_places.description` that the UUID is only available via `structuredContent` and that the host's widget must initiate the call.
   Reference: `guides/tools.md` §"Output Schema" and `.claude/rules/server-registration.md` §"Dual Return Format" — dual-return is for human-display parity, not for hiding machine-needed identifiers from the model.

3. **[Reinforces #1] Pull the paediatric-disambiguation reminder up one level.** The server instructions already cover *"Mixed paediatric/adult results? Don't pre-fill benefit_for_children"*, but the model needs an inverse rule too: *"When the user explicitly says 'dla dziecka' / 'dziecięce', set `benefit_for_children:true` and do NOT rely on the benefit name covering paediatric scope."* Add this to the §Disambiguation Rules block of `server-instructions.ts`.
   Reference: `guides/server_instruction_guide.md` §"Template for wtyczki.ai Servers" — Usage Patterns + Disambiguation Rules.

4. **[Optional, low value] Negative-test floor.** Both negatives passed at 100%, so descriptions are well-scoped on the "don't over-call" axis. No action.

5. **[Validation suggestion]** After applying #1+#2, re-run with `--iterations 5` to confirm scenarios #6 and #7 climb to ≥66%. Scenario #7 in particular depends on the queue_id being surfaced; without that change, the multi-turn flow remains structurally untestable from chat.

## Artifacts

- `doctor.json` — full MCP surface snapshot (5 tools, 1 widget, 3 782-char instructions).
- `eval-summary.json` — per-scenario accuracy, token use, failure reports, captured tool errors.
- `vitest-results.json` — raw vitest JSON output.
- Eval test file: `mcp-evals/terminy-leczenia/terminy-leczenia.eval.test.ts` (committed; survives re-runs unless `--regenerate`).

## Changelog

- 2026-05-24 — Initial eval report (9 scenarios × 3 iterations, gpt-5.4-mini). 7/9 at 100%; 2 failures both rooted in the `benefit`-field schema contradiction with server instructions; multi-turn additionally blocked by missing `queue_id` in text payload.
