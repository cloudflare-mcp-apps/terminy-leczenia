---
generator: /describe-server
generated: 2026-05-25
source_commit: 3d73f86
depends_on: [snapshot.md]
---

# MCP Server Description Report: terminy-leczenia

Generated: 2026-05-25
Source: projects/terminy-leczenia/

---

## 1. SERVER IDENTITY

- **Server name**: `terminy-leczenia` (McpServer constructor: `SERVER_CONFIG.NAME`)
- **Version**: `1.0.0` (package.json + SERVER_CONFIG)
- **One-sentence purpose**: Searches the Polish public-healthcare appointment-queue system (NFZ ITL Open Data API) for the first available treatment date for any benefit nationwide, returning results in an interactive Leaflet map + list widget.
- **Live URL / domain**: `https://terminy-leczenia.wtyczki.ai` (wrangler.jsonc custom domain; MCP endpoint: `https://terminy-leczenia.wtyczki.ai/mcp`)
- **Authentication method**: OAuth 2.1 (WorkOS AuthKit) — JWT Bearer token via JWKS verification + D1 user lookup; no API key path (removed 2026-05-18).
- **Language**: Bilingual. LLM-facing text (tool descriptions, `inputSchema` field descriptions, `serverInfo.instructions`) is **English**. Runtime text the user reads (tool-result `content[].text`, widget UI strings, prompt titles/descriptions/argsSchema) is **Polish**. No explicit "respond in Polish" directive in SERVER_INSTRUCTIONS (known gap — may cause English responses on some hosts).

---

## 2. TOOLS — DETAILED

Five tools registered. Two are widget-linked (`search_appointments`, `list_other_places`); three are LLM-only (`lookup_benefit`, `lookup_locality`, `lookup_provider`). All tools are read-only and idempotent.

### Tool: `search_appointments`

- **Title**: "Search NFZ Appointments"
- **Description (verbatim)**:
  > Searches the public Polish healthcare appointment-queue system for the first available treatment date for a given benefit, optionally filtered by voivodeship, locality, urgency, and paediatric scope. Returns up to 25 ranked queue entries with provider, place, address, phone, first-available date, wait-time statistics (people in queue, average wait), accessibility flags (toilet, ramp, car-park, elevator), geographic coordinates, and a flag indicating whether the same provider offers the benefit at other locations — rendered as an interactive map + list widget. Use whenever the patient asks where or when they can get a specific healthcare benefit (examples: 'najszybszy rezonans kolana w Mazowieckiem', 'kardiolog dla dziecka w Krakowie pilnie'). INTERACTIVE BEHAVIOR (let the server elicit): (a) If both benefit and province are missing, the server elicits voivodeship via a form — DO NOT pre-fill defaults. (b) If the freeform benefit does not match the NFZ dictionary, the response carries did_you_mean[] with close matches — re-call with one of those names. (c) If results mix paediatric and adult departments AND benefit_for_children was not set, the server elicits scope via a form — DO NOT pre-fill benefit_for_children. URGENCY: default to case=1 (stable); use case=2 only when the patient explicitly says 'pilny' / 'urgent'. LOCALITY: only set when the patient names a specific city. Max 25 results per call. The `elicited` field in the response tells you which filters were applied via form.

- **Input parameters**:

  | Parameter | Type | Required | Default | Constraints | Description |
  |-----------|------|----------|---------|-------------|-------------|
  | `benefit` | `string` | No (required if `province` absent) | — | min 3, max 250 chars | Freeform Polish benefit term or exact NFZ dictionary name. Prefers literal procedure terms over department labels. Returns `did_you_mean[]` on 0 results. |
  | `province` | `enum` | No (required if `benefit` absent) | — | One of "01"–"16" (16 voivodeship codes) | Voivodeship code: 01=dolnośląskie … 16=zachodniopomorskie |
  | `case` | `1 \| 2` | No | `1` | Literal union `1` or `2` | 1=stable (default), 2=urgent (only when patient says "pilny"/"urgent") |
  | `locality` | `string` | No | — | max 250 chars | Exact NFZ uppercase locality name. Use `lookup_locality` to disambiguate city vs district. |
  | `benefit_for_children` | `boolean` | No | — | — | Restrict to paediatric providers |
  | `limit` | `integer` | No | `10` | min 1, max 25 | NFZ hard cap at 25 |

- **Output structure**:
  - `kind`: `"search" | "error"`
  - `query`: echoed params (benefit, province, case, locality, benefit_for_children, limit)
  - `count`: renderable queue count (after null-date filtering)
  - `count_raw_nfz`: NFZ's reported total (for diagnostics)
  - `count_skipped_invalid`: records dropped due to `dates: null`
  - `page`, `total_pages`
  - `results[]`: geo-tagged NormalizedQueueResult entries (latitude, longitude not null)
  - `results_no_geo[]`: entries without lat/lng
  - `data_freshness`: NFZ `meta.date-modified`
  - `newest_snapshot`: date of most recent queue snapshot in result set
  - `banner`: optional NFZ API message
  - `did_you_mean[]`: close-match benefit names (when `count=0` and `benefit` was set)
  - `elicited`: `{province?, scope?}` — filters applied via interactive elicitation form
  - `disambiguation_needed`: `{province?, scope?}` — widget renders inline filter buttons when set
  - Error path: `is_info`, `code`, `message`

- **Annotations**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`
- **Widget linked**: yes — `ui://terminy-leczenia/widget`
- **Example invocations**:
  - "Najszybszy rezonans kolana w Mazowieckiem" → `search_appointments(benefit="REZONANS MAGNETYCZNY", province="07")`
  - "Kardiolog dla dziecka w Krakowie pilnie" → `search_appointments(benefit="KARDIOLOGICZNA", province="06", case=2, benefit_for_children=true)`

---

### Tool: `list_other_places`

- **Title**: "List Other Locations of Same Provider"
- **Description (verbatim)**:
  > Lists every other location where the same healthcare provider offers the same benefit, with each location's distinct first-available date. Returns a list of places (address, locality, phone, geo, wait date, statistics, accessibility) — wait times can differ dramatically across locations of one provider (live probe data showed a 67-day spread within one provider). Rendered as an inline drawer in the parent map widget. Use when the patient asks 'are there other locations of this same place' OR after a search_appointments result with has_other_places=true to surface a faster alternative at the same provider. Input is the queue_id (UUID) from a search_appointments result. Only meaningful when the original result had has_other_places=true (NFZ flag many-places='Y').

- **Input parameters**:

  | Parameter | Type | Required | Default | Constraints | Description |
  |-----------|------|----------|---------|-------------|-------------|
  | `queue_id` | `string` | Yes | — | min 1 (UUID format) | Queue UUID from `search_appointments` result where `has_other_places=true` |

- **Output structure**:
  - `kind`: `"other-places" | "error"`
  - `benefit`: benefit name from parent queue
  - `provider`: provider name from parent queue
  - `origin_queue_id`: the input UUID
  - `places[]`: NormalizedQueueResult array for each provider location
  - `data_freshness`: NFZ `meta.date-modified`

- **Annotations**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`
- **Widget linked**: yes — `ui://terminy-leczenia/widget` (renders as inline drawer)
- **Example invocation**: "Czy ten szpital ma inne lokalizacje?" → `list_other_places(queue_id="51fce308-2de6-0c37-e063-b4200a0a4cb3")`

---

### Tool: `lookup_benefit`

- **Title**: "Lookup NFZ Benefit Name"
- **Description (verbatim)**:
  > Returns the official Polish healthcare benefit names matching a substring query — required precondition for search_appointments because the queue API only matches dictionary entries, not freeform terms. Returns up to 25 official benefit names (uppercase Polish) as a plain text list, one per line, ranked by NFZ. The dictionary mixes DEPARTMENT/CLINIC entries ('ODDZIAŁ KARDIOLOGICZNY', 'PORADNIA OKULISTYCZNA') with PROCEDURE entries ('ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)', 'REZONANS MAGNETYCZNY') — they are DIFFERENT NFZ queues with different waits. Use whenever you do NOT already have an exact dictionary name. Pick the most specific match from the result list and pass it verbatim to search_appointments. Query must be at least 3 characters. CRITICAL: try the patient's LITERAL term first ('ZAĆMA', 'SOCZEWKI', 'PRZEGRODA', 'KOLANO') — NFZ exposes procedure-level benefits with realistic queue data. Only widen to department/specialty names ('OKULISTYCZNY', 'OTOLARYNGOLOG') if the literal term returns 0 results. NEVER substitute a department for a procedure when both exist — 'ODDZIAŁ OKULISTYCZNY' (oddział, kilka osób w kolejce) is a different queue than 'ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)' (procedura, kolejka miesiące) even though both treat eyes. Mapping (literal → fallback if 0 results): 'zaćma' → ['ZAĆMA' or 'SOCZEWKI', else 'OKULISTYCZNY']; 'septoplastyka' / 'przegroda nosa' → ['PRZEGRODA' or 'SEPTOPLASTYKA', else 'OTOLARYNGOLOG']; 'kolano' (rezonans) → ['REZONANS']; 'kardiolog' → ['KARDIOLOG']. Avoid over-specific phrases ('PORADNIA KARDIOLOGICZNA' = 0 results — shorter substring wins). If results=0, the response carries `did_you_mean[]` with NFZ-verified close matches — pick one and pass it verbatim to search_appointments, do NOT guess a new specialty term.

- **Input parameters**:

  | Parameter | Type | Required | Default | Constraints | Description |
  |-----------|------|----------|---------|-------------|-------------|
  | `query` | `string` | Yes | — | min 3, max 250 | Substring (case-insensitive) of an NFZ benefit name |
  | `limit` | `integer` | No | `10` | min 1, max 25 | NFZ hard cap at 25 |

- **Output structure**:
  - `kind`: `"lookup" | "error"`
  - `entity`: `"benefit"`
  - `results[]`: up to 25 official benefit names (uppercase Polish strings)
  - `did_you_mean[]`: NFZ-verified close matches when `results` is empty (via keyword split + BENEFIT_SYNONYMS map)

- **Annotations**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`
- **Widget linked**: no — LLM-only tool
- **Example invocations**:
  - "Jakie są dostępne świadczenia okulistyczne?" → `lookup_benefit(query="ZAĆMA")`
  - `lookup_benefit(query="KARDIOLOG")` → returns 12 official names

---

### Tool: `lookup_locality`

- **Title**: "Lookup NFZ Locality Name"
- **Description (verbatim)**:
  > Returns Polish locality names from the NFZ dictionary matching a substring within a specified voivodeship — needed to disambiguate city vs district before passing to search_appointments. Returns up to 25 locality names (uppercase Polish) as a plain text list. City districts are separate entries — example: query='Warszawa' in voivodeship 07 returns WARSZAWA, WARSZAWA BEMOWO, WARSZAWA BIAŁOŁĘKA, WARSZAWA BIELANY, WARSZAWA MOKOTÓW, ... (19 total). Use when the patient mentions a city to find both the city itself and its districts. Pass the chosen exact name to search_appointments(locality=...). Query must be at least 3 characters. Voivodeship code (01-16) is required.

- **Input parameters**:

  | Parameter | Type | Required | Default | Constraints | Description |
  |-----------|------|----------|---------|-------------|-------------|
  | `query` | `string` | Yes | — | min 3, max 250 | Substring of a locality name (Polish diacritics OK) |
  | `province` | `enum` | Yes | — | "01"–"16" | Voivodeship code |
  | `limit` | `integer` | No | `10` | min 1, max 25 | NFZ hard cap at 25 |

- **Output structure**:
  - `kind`: `"lookup" | "error"`
  - `entity`: `"locality"`
  - `results[]`: up to 25 uppercase Polish locality names

- **Annotations**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`
- **Widget linked**: no — LLM-only tool
- **Example invocation**: "Szukam terminu w Warszawie (Mokotów)" → `lookup_locality(query="Warszawa", province="07")` → user picks "WARSZAWA MOKOTÓW"

---

### Tool: `lookup_provider`

- **Title**: "Lookup NFZ Healthcare Provider"
- **Description (verbatim)**:
  > Returns Polish healthcare-provider names from the NFZ dictionary matching a substring within a specified voivodeship. Returns up to 25 official provider names (uppercase Polish, often long official forms like '5 WOJSKOWY SZPITAL KLINICZNY Z POLIKLINIKĄ - SAMODZIELNY PUBLICZNY ZAKŁAD OPIEKI ZDROWOTNEJ W KRAKOWIE') as a plain text list. Use when the patient names a specific hospital or clinic ('chcę termin w CMKP', 'w Szpitalu Wolskim') rather than a benefit type. Query must be at least 3 characters. Voivodeship code (01-16) is required. NFZ does not expose direct provider→queues lookup; for that, take a provider name from this list and feed it as a future provider parameter (not implemented in MVP) or filter results returned by search_appointments.

- **Input parameters**:

  | Parameter | Type | Required | Default | Constraints | Description |
  |-----------|------|----------|---------|-------------|-------------|
  | `query` | `string` | Yes | — | min 3, max 250 | Substring of healthcare provider's official name |
  | `province` | `enum` | Yes | — | "01"–"16" | Voivodeship code |
  | `limit` | `integer` | No | `10` | min 1, max 25 | NFZ hard cap at 25 |

- **Output structure**:
  - `kind`: `"lookup" | "error"`
  - `entity`: `"provider"`
  - `results[]`: up to 25 uppercase Polish provider names

- **Annotations**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`
- **Widget linked**: no — LLM-only tool
- **Example invocation**: "Chcę termin w Szpitalu Wolskim" → `lookup_provider(query="WOLSKIM", province="07")`

---

## 3. PROMPTS / SLASH COMMANDS

Two prompts registered. UI text is Polish (argsSchema descriptions, titles); message bodies are English for token savings.

### Prompt: `znajdz-termin`

- **Name**: `znajdz-termin`
- **Title (Polish)**: "Znajdź termin NFZ"
- **Description (Polish)**: "Wyszukaj najwcześniejszy publiczny termin NFZ dla wskazanego świadczenia. Jeśli specjalność nie jest oficjalną nazwą NFZ (UPPERCASE), promp najpierw uruchomi lookup_benefit, a następnie search_appointments z dopasowanym hasłem."
- **Parameters**:

  | Name | Type | Required | Description (Polish) |
  |------|------|----------|---------------------|
  | `specialty` | `string` (min 2) | Yes | "Specjalność lub świadczenie (np. 'kardiolog', 'rezonans kolana', 'OTOLARYNGOLOGIA')" |
  | `province` | `enum("01"–"16")` | No | Voivodeship code |
  | `locality` | `string` | No | "Konkretna miejscowość" |
  | `urgent` | `boolean (coerce)` | No | "true = przypadek pilny (case=2)" |
  | `children` | `boolean (coerce)` | No | "true = ogranicz do oddziałów dziecięcych" |

- **Behavior**: Detects whether `specialty` looks like an NFZ dictionary name (all-caps heuristic via `looksLikeNfzDictionaryName()`). If yes → calls `search_appointments` directly. If no → calls `lookup_benefit` first, then `search_appointments`. Instructs LLM to surface has_other_places entries and offer `list_other_places`.
- **Example**: User types `/znajdz-termin` → fills form with specialty="kardiolog", province="07" → prompt drives full tool chain

---

### Prompt: `sprawdz-objaw`

- **Name**: `sprawdz-objaw`
- **Title (Polish)**: "Sprawdź objaw → świadczenie NFZ"
- **Description (Polish)**: "Z opisu objawu zaproponuj 1-3 oddziały/poradnie NFZ, a potem znajdź najszybszy termin dla wskazanej specjalności (chain: objaw → lookup_benefit → search_appointments)."
- **Parameters**:

  | Name | Type | Required | Description (Polish) |
  |------|------|----------|---------------------|
  | `objaw` | `string` (min 3) | Yes | "Krótki opis objawu lub problemu pacjenta po polsku, np. 'boli mnie krzyż od miesiąca'" |
  | `province` | `enum("01"–"16")` | No | Voivodeship code |

- **Behavior**: Instructs LLM to (1) map symptom to 1-3 NFZ specialties without diagnosing, (2) call `lookup_benefit` for the most likely specialty, (3) call `search_appointments`, (4) add a disclaimer that this is not medical advice.
- **Example**: User types `/sprawdz-objaw` → fills "boli mnie krzyż" → LLM maps to ORTOPEDIA/NEUROCHIRURGIA → drives lookup_benefit + search_appointments chain

---

## 4. INTERACTIVE WIDGET

- **Widget type**: Map + list dashboard (Leaflet interactive map with result list panel)
- **What it displays**:
  - **FilterBar** (sticky, ~44px): toggle buttons for stable/urgent case filter, accessibility filter (wheelchair/toilet/ramp), paediatric filter; count of shown vs. total results
  - **MapView** (~60% width, Leaflet): interactive map with colored circle markers per queue result; marker color encodes wait time (green ≤30 days, yellow ≤90 days, red >90 days); clicking a marker focuses the list entry
  - **ResultList** (right panel, scrollable): cards per queue entry with provider name, locality, first-available date, wait-time label (e.g. "za 14 dni"), accessibility icon row, phone number, and "Inne lokalizacje" button when `has_other_places=true`
  - **UnlocatedPanel** (collapsible): queue entries without GPS coordinates
  - **FreshnessBanner** (bottom): data freshness date + staleness warning if snapshot >60 days old
  - **InlineDrawer**: when `list_other_places` is called, renders alternative locations of the same provider as an overlay drawer
  - **DisambiguationBanner**: renders when `disambiguation_needed.scope` is set — inline adult/paediatric filter buttons (👤/👶) for hosts that do not support elicitation (e.g. AWS Bedrock)

- **User interactions**:
  - Toggle stable/urgent/all case filter (client-side filter on already-loaded results)
  - Toggle accessibility-only filter
  - Toggle paediatric-only filter (when `disambiguation_needed.scope` is set, renders explicit buttons)
  - Click map marker → highlights corresponding list entry
  - Click "Inne lokalizacje" button → triggers `list_other_places` tool call via `app.callServerTool()`
  - Scroll result list

- **Data flow**: Tool result → `ontoolresult` postMessage → widget reads `structuredContent` → renders Leaflet markers + result list. `list_other_places` called via `app.callServerTool()` from within the widget (widget-initiated server call).
- **Real-time updates**: Yes — widget calls `list_other_places` via `app.callServerTool()` on user button click.
- **Dark mode**: Supported via `onhostcontextchanged` + `applyDocumentTheme`, `applyHostStyleVariables`, `applyHostFonts`. CSP includes `assets.claude.ai` for Anthropic font delivery.
- **Widget dimensions**: Fixed `h-[500px]` (Claude inline card max). `autoResize: false` with manual `sendSizeChanged({ height: 500 })`.

---

## 5. HOW IT WORKS

- **Data flow**:
  ```
  User prompt → LLM → [optional: lookup_benefit → lookup_locality] → search_appointments
  → NfzClient → KV cache (check) → [miss] → NFZ ITL API → KV write (fire-and-forget)
  → NormalizeQueueAttributes → structuredContent + text summary
  → Widget: ontoolresult → Leaflet map + result list
  → [optional] User clicks "Inne lokalizacje" → widget.callServerTool → list_other_places → NFZ many-places/{id}
  ```

- **External APIs used**:

  | API | Base URL | Authentication | Endpoints used |
  |-----|----------|---------------|----------------|
  | NFZ ITL (Informator o Terminach Leczenia) | `https://api.nfz.gov.pl/app-itl-api` | None (public, anonymous) | `/queues`, `/many-places/{id}`, `/benefits`, `/localities`, `/providers`, `/version` |
  | OSM Tiles (Leaflet map) | `https://{a,b,c,tile}.openstreetmap.org` | None (public) | Map tile images (CDN, browser-direct) |

- **Business logic**:
  - **Elicitation**: When `benefit` and `province` are both absent, server calls `server.server.elicitInput()` with a voivodeship enum form before returning a result. On mixed adult/paediatric results without `benefit_for_children`, server elicits scope (adult/child/all). Both fall back gracefully to `disambiguation_needed` widget signals on unsupported hosts.
  - **Did-You-Mean**: When `search_appointments` returns 0 results for a benefit, `findDidYouMean()` probes NFZ `/benefits` with the original term + extracted keywords (≥4 chars), unioning up to 10 candidates. `lookup_benefit` has a parallel `lookupBenefitDidYouMean()` combining keyword decomposition + `BENEFIT_SYNONYMS` map (patient lay terms → NFZ specialty substrings).
  - **Null-date filtering**: Records with `dates: null` in NFZ response are silently dropped; `count_skipped_invalid` tracks the count; `count_raw_nfz` preserves NFZ's view.
  - **Wait color**: Widget encodes wait days as green (≤30), yellow (≤90), red (>90) circle markers on the Leaflet map.
  - **Staleness signal**: If `newest_snapshot` age >60 days → text summary appends a phone-check warning ⚠.

- **Caching**: Cache-first via KV. Cache keys: `nfz:<prefix>:<sorted param=value pairs>`. TTLs: queue results = 1h, dictionaries (benefits/localities/providers) = 24h, version = 24h. KV write is fire-and-forget (never blocks tool response).

- **Practical use case scenarios**:
  1. **Cardiologist consultation**: Patient asks "Gdzie najszybciej do kardiologa w Mazowieckiem?" → LLM calls `search_appointments(benefit="KARDIOLOGICZNA", province="07")` → widget shows map of clinics with wait times.
  2. **Specialist with city disambiguation**: Patient asks "Chcę termin u okulisty w Krakowie" → LLM calls `lookup_benefit(query="OKULISTYCZNY")`, then `search_appointments(benefit="PORADNIA OKULISTYCZNA", province="06", locality="KRAKÓW")` → map filtered to Kraków.
  3. **Multi-site provider**: Search result shows has_other_places=true for a provider → user clicks "Inne lokalizacje" in widget → `list_other_places` fetches all locations → widget renders inline drawer with up to 67-day spread in wait times across locations.

---

## 6. INSTALLATION INFO

- **Server URL**: `https://terminy-leczenia.wtyczki.ai`
- **Transports available**:
  - Streamable HTTP: `https://terminy-leczenia.wtyczki.ai/mcp`
- **Auth flow on first connect**: OAuth 2.1 (WorkOS AuthKit). On first connection, the MCP client receives a `401 Unauthorized` with `WWW-Authenticate` header pointing to `/.well-known/oauth-protected-resource` (RFC 9728). The client redirects to `https://exciting-domain-65.authkit.app` for login, obtains a JWT, and re-connects with `Authorization: Bearer <jwt>`. Centralized login via `panel.wtyczki.ai`.
- **Requirements**: wtyczki.ai account required (free registration). No external API key needed — NFZ ITL API is public and anonymous.

---

## 7. LIMITATIONS & CONSTRAINTS

- **Input value ranges**: `benefit` 3–250 chars; `locality` max 250 chars; `query` (lookup tools) 3–250 chars; `limit` 1–25 (NFZ hard cap at 25); `province` must be "01"–"16"; `case` must be 1 or 2.
- **NFZ API rate limits**: No explicit rate limit documented; KV caching reduces blast radius (1h queue, 24h dict). External timeout: 10s; one retry on 5xx (500ms backoff).
- **Data freshness**: Queue snapshots are provided by NFZ providers; `newest_snapshot` field shows the most recent date. Snapshots >60 days old trigger a staleness warning in results. Dictionary caches refresh every 24h.
- **Geographic restrictions**: Poland-only. NFZ ITL API covers only Polish public healthcare (voivodeships 01-16).
- **What it CANNOT do**:
  - Book appointments — patients must call the provider directly (phone number is in results).
  - Sanatorium queries (leczenie uzdrowiskowe) — NFZ returns info code 1200038 with redirect to `skierowania.nfz.gov.pl`.
  - Symptom-to-benefit translation beyond the `sprawdz-objaw` prompt chain (no AI; LLM-driven only).
  - Provider-filtered queue search — `lookup_provider` returns provider names, but `search_appointments` does not currently accept a provider filter (MVP gap documented in tool description).
  - Cross-province locality search — `lookup_locality` requires a specific voivodeship code.
  - Benefits delivered by the referring doctor (NFZ code 1200055) — returned as `is_info=true` non-error.
  - Wait dates are often 6–12+ months; this is real NFZ data, not a bug.

---

## 8. TECH STACK

- **Runtime**: Cloudflare Workers (compatibility_date: 2025-03-10, nodejs_compat flag)
- **State management**: Stateless per-request (fresh McpServer via `createMcpHandler`). No Durable Objects. KV for API response caching only (not user session state). D1 for read-only user lookup (centralized auth).
- **Frontend**:
  - React 19 + TypeScript (widget)
  - Leaflet 1.9.4 (map, loaded from unpkg CDN at runtime)
  - Tailwind CSS 3.4.17 + tailwind-merge + clsx
  - Vite 6 + vite-plugin-singlefile (single-file widget HTML bundle, 164 lines built)
  - `@modelcontextprotocol/ext-apps` (App class, theme helpers, postMessage transport)
- **External services**:
  - NFZ ITL Open Data API (`api.nfz.gov.pl/app-itl-api`) — public, anonymous, no API key
  - OpenStreetMap tile servers (Leaflet map tiles, browser-direct, declared in CSP)
  - WorkOS AuthKit JWKS (`exciting-domain-65.authkit.app`) — JWT verification
  - Cloudflare D1 `mcp-oauth` — centralized user lookup (shared with panel.wtyczki.ai)
  - Cloudflare KV `CACHE_KV` — NFZ response caching
- **MCP SDK version**: `@modelcontextprotocol/sdk ^1.29.0`
- **Key dependencies**:

  | Package | Version | Purpose |
  |---------|---------|---------|
  | `@modelcontextprotocol/sdk` | `^1.29.0` | MCP server + tool/prompt/resource registration |
  | `@modelcontextprotocol/ext-apps` | `^1.7.0` | Widget App class, MIME type, CSP helpers |
  | `agents` (Cloudflare) | `^0.11.5` | `createMcpHandler` canonical transport |
  | `zod` | `^4.1.13` | Input schema validation (zod/v4 subpath) |
  | `jose` | `^6.1.0` | JWT/JWKS verification (WorkOS AuthKit) |
  | `leaflet` | `^1.9.4` | Interactive map (widget) |
  | `react` / `react-dom` | `^19.2.0` | Widget UI framework |
  | `tailwindcss` | `^3.4.17` | Widget styling |
  | `vite` | `^6.0.6` | Widget build (single-file HTML) |
  | `wrangler` | `^4.45.3` | Cloudflare Workers CLI |
  | `typescript` | `^5.9.3` | Strict type-checking (clean `tsc --noEmit` verified 2026-05-25) |
