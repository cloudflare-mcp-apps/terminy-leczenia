# NFZ ITL API — observations from live probes (2026-05-17)

13 probes against `https://api.nfz.gov.pl/app-itl-api/` covering every planned tool path.
No auth, no rate limit hit. All responses returned within seconds.

## Index of samples

| # | File | What it probes |
|---|---|---|
| 01 | `01-version.json` | `/version` — sanity, API live, v1.3.0, not deprecated |
| 02 | `02-benefits-kardiolog.json` | `/benefits?name=KARDIOLOG` — 12 cardiology benefit names |
| 03 | `03-benefits-rezonans.json` | `/benefits?name=REZONANS` — only 1 hit: `REZONANS MAGNETYCZNY` |
| 04 | `04-queues-kardiologia-mazowieckie-stable-EMPTY.json` | `benefit=PORADNIA KARDIOLOGICZNA` → count=0 (no such benefit) |
| 05 | `05-queues-alergologia-dzieci-malopolska.json` | Full happy-path queue list with all queue-attributes |
| 06 | `06-localities-warszawa.json` | `/localities?name=Warszawa&province=07` — dzielnice as items |
| 07 | `07-providers-szpital-malopolska.json` | `/providers?name=szpital&province=06` — bare strings |
| 08 | `08-queue-by-id.json` | `/queues/{id}` — single object shape |
| 09 | `09-queues-kardiolog-mazowieckie-substring.json` | substring proof: 270 hits, includes many-places=Y |
| 10 | `10-queues-rezonans-mazowieckie.json` | 84 hits, includes lat=null edge case |
| 11 | `11-error-invalid-case.txt` | `case=3` → HTTP 400 |
| 12 | `12-error-missing-province-or-name.txt` | only `case=1` → HTTP 400 |
| 13 | `13-many-places-radiologica.json` | `/many-places/{id}` — 3 locations, same benefit, same provider |

## Findings that change the plan

### 1. Benefit names are NOT freeform — they are exact dictionary entries

- `benefit=PORADNIA KARDIOLOGICZNA` → **0 results** (NFZ has no such benefit).
- `benefit=KARDIOLOG` (substring) → **270 results**, matches `REHABILITACJA KARDIOLOGICZNA`, `ODDZIAŁ KARDIOLOGICZNY`, etc.
- Search is **case-insensitive substring** on benefit name.

**Plan impact:** `lookup_benefit` tool is **mandatory** as a precursor to `search_appointments` — LLM cannot reliably guess names. Tool description must say: *"Always call lookup_benefit first if you don't have an exact NFZ benefit name from a previous search."* — to avoid 0-result calls.

### 2. NFZ returns proper HTTP 400 on errors (not 200 with `errors` array)

- WebFetch failed to capture error body, but HTTP status is 400 for invalid `case` and missing `province/name`.
- Docs (api4.md) show error JSON shape, but production may need fallback messaging since error body isn't always retrievable depending on client.

**Plan impact:** Worker fetch wrapper must check `response.ok`, attempt `response.json()` for the `errors[]` array, and on parse failure fall back to a static error-code map seeded from `api4.md`.

### 3. At least one of `{province, name}` is required for `/queues`

Confirmed via probe #12. `case` alone returns HTTP 400 (error 1200005).

**Plan impact:** `search_appointments` zod schema needs an `.refine()` invariant: `province || name`. Without this the LLM will routinely hit 400.

### 4. `latitude`/`longitude` can be `null` even when address exists

Probe #10 record #5 (MULTI-MED Warszawa Żoliborz) has `latitude: null, longitude: null` but full address.

**Plan impact:** Widget map cannot assume all results map-able. Need split rendering: **map markers** for `lat && lon`, separate **"bez lokalizacji" list** below the map. Tooltips also need fallback for missing coords.

### 5. `statistics.computed-data` and `benefits-provided` are always `null` in list/detail

Across 10 records: only `statistics.provider-data` is populated. `computed-data` (NFZ-side analytics) and `benefits-provided` (per-month performed counts) are documented but empty in current API output.

**Plan impact:** Don't promise these in MVP UI. Hide chart panels that rely on them. Schema types should mark them as `unknown | null`.

### 6. `/queues/{id}` returns identical `queue-attributes` shape — no extra fields

Probe #8 confirms detail endpoint adds nothing beyond list items. Other than dropping `meta.count/page/limit/links`.

**Plan impact:** Single TS type `QueueAttributes` for both list and detail. The detail tool (`get_appointment`) is **redundant** for the common path — list items are already complete. Keep it only for deep-linking by ID (e.g., shareable URL).

### 7. `/many-places/{id}` payload OMITS provider-level identifiers

Per-place attributes are missing: `provider-code`, `regon-provider`, `nip-provider`, `teryt-provider`, `registry-number`, `benefit`, `provider`, `case`, `many-places`.
Those are on the parent `data.attributes` (one level up), shared across `places[]`.

**Plan impact:** TS type for `many-places-queue` is a strict subset of `queue-attributes`. UI must thread parent context into child place rendering. The child queue `id` is unique and clickable to `/queues/{id}` if needed.

### 8. Locality dictionary returns **strings**, not objects

`data: ["WARSZAWA", "WARSZAWA BEMOWO", ...]` — same for `/providers`, `/benefits`, `/streets`.

**Plan impact:** Autocomplete tools (`lookup_*`) have zero-cost wrappers. No need for D1/KV — direct pass-through to NFZ, with KV cache (24h) keyed by query+province.

### 9. Data freshness: `date-modified` updates in real time

`/version` and every response show `date-modified` within minute-granularity of request time. NFZ recomputes meta per request.

**Plan impact:** UI freshness banner can show `meta.date-modified` from latest call — users see "dane aktualne na <timestamp>". No need to track our own ETag.

### 10. `data.attributes.dates.date-situation-as-at` ≠ `date-modified`

`dates.date-situation-as-at` is the as-of date for the queue snapshot (typically a few days ago — e.g., 2026-05-15 in probes taken on 2026-05-17). `dates.date` is the first-available appointment date.

**Plan impact:** UI must distinguish these. Show "termin: {date}" prominently, "stan na: {date-situation-as-at}" as small caption.

## Refined plan deltas

These updates merge into the plan from prior message:

1. **Add `.refine()` invariant** in `search_appointments` schema: `province || name`.
2. **Promote `lookup_benefit`** from "helper" to "REQUIRED precondition" — surface via tool description.
3. **Demote `get_appointment` (`/queues/{id}`)** from MVP — list items are complete. Keep only as Phase 2 deep-link.
4. **`computed-data` / `benefits-provided`** removed from MVP widget — server returns `null`.
5. **Map widget** must split markers vs. "no-coordinates" list (5% of records).
6. **Fetch wrapper** with 400-handling + static error map seeded from `api4.md`.
7. **Provider/place identity** — drop NIP/REGON from primary UI (clutter). Surface only in "details" drawer for power users (lekarze, dziennikarze).

## Open questions (not blocking)

- **Rate limit?** No hint in docs or in any response header observed. Assume soft limit; KV cache aggressively.
- **`age-range` format** is opaque: `"---,4-9,10-15,16-18"` — 4 comma-separated buckets, `---` means "not served". Need a parser.
- **`many-places=Y` count per result is unknown** until you call `/many-places/{id}`. UI can show flag but defer real count.
