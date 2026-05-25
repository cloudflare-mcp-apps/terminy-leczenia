---
generator: /snapshot-server
generated: 2026-05-25
source_commit: 3d73f86
depends_on: []
---

# Terminy Leczenia NFZ MCP App - Infrastructure Snapshot

**Generated**: 2026-05-25
**Repository**: terminy-leczenia
**Status**: Production
**Architecture**: MCP Apps (SEP-1865) - Stateless External API Server with KV Caching

---

## 1. Project Identity Metrics

**Name**: Terminy Leczenia NFZ
**Slug**: `terminy-leczenia`
**Wrangler name**: `terminy-leczenia`
**Package name**: `terminy-leczenia-mcp`
**Server description**: Polish public-healthcare appointment-queue search via NFZ ITL Open Data API — interactive Leaflet map + list widget.
**Primary domain**: `terminy-leczenia.wtyczki.ai`
**Server version**: `1.0.0` (SERVER_CONFIG in `src/shared/constants.ts`)
**McpServer name**: `"terminy-leczenia"` (`src/server.ts:409`)

**Visual Identity**
- Server icon: ❌ N/A — not declared in wrangler.jsonc or resources
- Tool icons: ❌ Not declared
- Display name resolution: McpServer `name` = `"terminy-leczenia"` → hosts may display slug

**MCP Apps (SEP-1865) Configuration**
- Assets binding: `ASSETS` (Fetcher), directory `./web/dist/widgets`
- Build system: Vite 6 + `vite-plugin-singlefile` + `@vitejs/plugin-react`
- UI URI: `ui://terminy-leczenia/widget` (single widget)
- Two-part registration: ✅ `registerResource("widget", ...)` + `registerTool(..., _meta.ui.resourceUri)` for widget-linked tools
- MIME type: `text/html;profile=mcp-app`
- Claude sandbox domain: `a86a09e17bb3ccb76f7f0e6892e0ed3f.claudemcpcontent.com`

---

## 2. Required Functionalities Status

### 2.1 Dual Authentication (WorkOS + API Keys)

- **JWT (WorkOS AuthKit)**: ✅ Implemented
  - JWKS verification via `jose` (`src/auth/jwt-verify.ts:34-56`)
  - Issuer: `https://exciting-domain-65.authkit.app`
  - `payload.sub` → `getUserByWorkosId(env.DB, workosUserId)` → `userId`, `email`
  - Auth context injected via `createMcpHandler(server, { authContext: { props: { userId, email } } })`
  - D1 binding: `DB` → `mcp-oauth` database
  - `is_deleted = 0` check in user query (`src/auth/auth-utils.ts:13`)

- **API Keys**: ❌ Not implemented — no `src/api-key-handler.ts`. JWT-only auth.
  - Note: `new_oauth/system.md` documents that `wtyk_` API key path was removed 2026-05-18; JWT-only is canonical now.

- **OAUTH_KV**: ❌ Not declared (not needed — JWT is stateless, no token caching)
- **USER_SESSIONS**: ❌ Not declared (centralized auth — panel.wtyczki.ai owns session cookies)
- **Shared D1**: ✅ `DB` → `eac93639-d58e-4777-82e9-f1e28113d5b2` (mcp-oauth, same as panel.wtyczki.ai)

### 2.2 Transport Protocol (McpAgent)

- **Transport**: ✅ `createMcpHandler` from `agents/mcp` (Cloudflare canonical, Apr-2025+)
- **Endpoint**: `POST /mcp` (`src/index.ts:41`)
- **DO class**: ❌ Not used — stateless server; `createMcpHandler` wraps `WorkerTransport` directly
- **WebSocket hibernation**: N/A — stateless, HTTP Streamable per March 2025 spec
- **agents SDK version**: `^0.11.5`
- **GHSA-345p-7cg4-v4c7**: ✅ Safe — fresh `McpServer` per request via `createServer(env)` called inside handler

### 2.3 Tool Implementation (SDK 1.25+)

- **registerTool**: ✅ 5 tools registered in `src/server.ts`
- **inputSchema**: ✅ ZodRawShapeCompat plain objects (no `.shape`, no `z.object()` wrapper)
- **outputSchema**: ✅ Declared for all 5 tools (`SEARCH_APPOINTMENTS_OUTPUT_SCHEMA`, `LIST_OTHER_PLACES_OUTPUT_SCHEMA`, `LOOKUP_OUTPUT_SCHEMA`)
- **structuredContent**: ✅ All tools return both `content[].text` + `structuredContent`
- **isError**: ✅ Used in error/info paths; `asTextResult(..., isError=true)` (`src/server.ts:72-78`)
- **descriptions**: ✅ 4-part pattern, loaded from `src/tools/descriptions.ts` via `getToolDescription()`
- **naming**: ✅ snake_case: `search_appointments`, `list_other_places`, `lookup_benefit`, `lookup_locality`, `lookup_provider`

### 2.4 Tool Descriptions (4-Part Pattern)

All 5 tools follow the canonical 4-part pattern (Purpose → Returns → Use Case → Constraints).
Descriptions are assembled by `getToolDescription()` which concatenates parts with spaces (`src/tools/descriptions.ts:146-150`). Vendor name "NFZ" is retained (open public brand, not a hidden commercial vendor). Each description explicitly chains cross-tool calls (e.g., `search_appointments` references `lookup_benefit` and `list_other_places`).

### 2.5 Centralized Login (panel.wtyczki.ai)

- **USER_SESSIONS**: ❌ Not used — server does not read session cookies; relies entirely on JWT Bearer header
- **Session cookie**: N/A
- **is_deleted check**: ✅ `AND is_deleted = 0` in D1 query (`src/auth/auth-utils.ts:13`)
- **Redirect flow**: ✅ RFC 9728 well-known endpoints at `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` (`src/well-known.ts`)
- **WWW-Authenticate header**: ✅ Returned with 401 responses (`src/index.ts:94-100`)

### 2.6 Prompts (SDK 1.20+)

- **Capability declaration**: ✅ `capabilities: { prompts: {} }` in McpServer options (`src/server.ts:415`)
- **Count**: 2 prompts
- **registerPrompt**: ✅ Two individual registrations (`src/server.ts:871-872`)
- **Zod validation**: ✅ `argsSchema` uses `zod/v4` with `.meta({description})` (Polish — correct for prompt UI)
- **Naming**: ✅ kebab-case: `znajdz-termin`, `sprawdz-objaw`
- **Full prompt list**:
  1. `znajdz-termin` — "Znajdź termin NFZ" — guided NFZ appointment search; translates lay term → NFZ dict name via `lookup_benefit`, then `search_appointments`
  2. `sprawdz-objaw` — "Sprawdź objaw → świadczenie NFZ" — symptom-to-benefit chain (objaw → `lookup_benefit` → `search_appointments`)

---

## 3. Optional Functionalities Status

### 3.1 Stateful Session
❌ Not implemented. Stateless server; no DO-backed session storage.

### 3.2 Completions
⚠️ Skeleton stub present (`src/optional/completions/dynamic-enums.ts` — empty file). Not wired.

### 3.3 Workers AI
❌ Not implemented. AI binding not declared in wrangler.jsonc.

### 3.4 Workflows & Async
❌ Not implemented. Skeleton stubs `src/optional/prompts/workflows.ts` and `src/optional/tasks/async-executor.ts` + `task-store.ts` are empty placeholders. All requests are synchronous.

### 3.5 Rate Limiting
❌ Not implemented. NFZ API has its own server-side limits; KV caching reduces blast radius but no explicit Cloudflare rate-limit binding.

### 3.6 KV Caching
✅ **Implemented** (`src/api-client.ts`)
- Binding: `CACHE_KV` (id: `fa6ff790f146478e85ea77ae4a5caa4b`)
- Strategy: cache-first via `cacheFirst()` wrapper
- Keys: `nfz:<prefix>:<sorted-params>` human-readable format
- TTL: **24h** dictionaries (benefits/localities/providers), **1h** queue results, **24h** version
- Fire-and-forget KV write (never blocks tool response)
- Cache miss/hit logged via `logger.info({ event: 'cache_operation', ... })`

### 3.7 R2 Storage
❌ Not implemented.

### 3.8 ResourceLinks
❌ Not implemented. Tools include `queue_id` UUIDs in text to enable follow-up calls but do not return MCP ResourceLinks.

### 3.9 Elicitation
✅ **Implemented** — `src/server.ts:110-175`
- Two elicitation forms:
  1. `tryElicitProvince()` — voivodeship picker (enum 01-16) when both `benefit` and `province` are missing
  2. `tryElicitScope()` — adult/child/all scope picker when results mix paediatric and adult departments
- Graceful degradation: returns `null` on `catch` (host unsupported / user cancelled) → widget renders inline disambiguation buttons via `disambiguation_needed` field
- Host status: Claude Code ✅, Claude.ai ⏳ planned, AWS Bedrock ❌ (widget fallback)

### 3.10 Dynamic Tools
❌ Not implemented.

### 3.11 Tasks Protocol (Experimental)
❌ Not adopted (per `lesson_tasks_extension.md` and SEP-2663 — not yet in `agents/mcp`).

### 3.12 Resources (MCP Apps - SEP-1865)
✅ **Implemented** — one UI resource.

```typescript
// src/server.ts:427-449
server.registerResource(
  "widget",
  "ui://terminy-leczenia/widget",
  {
    mimeType: RESOURCE_MIME_TYPE,
    description: "Interactive map + list of NFZ appointment queues...",
    _meta: { ui: widgetResource._meta.ui! },
  },
  async () => {
    const html = await loadHtml(env.ASSETS, "/widget.html");
    return {
      contents: [{
        uri: "ui://terminy-leczenia/widget",
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: widgetResource._meta as Record<string, unknown>,
      }],
    };
  },
);
```

Note: CSP (`_meta.ui.csp`) is correctly placed on the `contents[]` entry returned by the handler (not on the config object).

### 3.13 Sampling
❌ Not implemented (deprecated per SEP-2577; replaced by Prompts).

---

## 4. Detailed Tool Audit (Tool Inventory)

### Tool 1: `search_appointments`

**Technical name**: `search_appointments`
**Display title**: "Search NFZ Appointments"

**Description (verbatim)**:
> Searches the public Polish healthcare appointment-queue system for the first available treatment date for a given benefit, optionally filtered by voivodeship, locality, urgency, and paediatric scope. Returns up to 25 ranked queue entries with provider, place, address, phone, first-available date, wait-time statistics (people in queue, average wait), accessibility flags (toilet, ramp, car-park, elevator), geographic coordinates, and a flag indicating whether the same provider offers the benefit at other locations — rendered as an interactive map + list widget. Use whenever the patient asks where or when they can get a specific healthcare benefit (examples: 'najszybszy rezonans kolana w Mazowieckiem', 'kardiolog dla dziecka w Krakowie pilnie'). INTERACTIVE BEHAVIOR (let the server elicit): (a) If both benefit and province are missing, the server elicits voivodeship via a form — DO NOT pre-fill defaults. (b) If the freeform benefit does not match the NFZ dictionary, the response carries did_you_mean[] with close matches — re-call with one of those names. (c) If results mix paediatric and adult departments AND benefit_for_children was not set, the server elicits scope via a form — DO NOT pre-fill benefit_for_children. URGENCY: default to case=1 (stable); use case=2 only when the patient explicitly says 'pilny' / 'urgent'. LOCALITY: only set when the patient names a specific city. Max 25 results per call. The `elicited` field in the response tells you which filters were applied via form.

**Input Schema**:
| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `benefit` | `string` | No | min 3, max 250 | Freeform Polish benefit term or exact NFZ dictionary name; required if `province` absent |
| `province` | `enum("01"–"16")` | No | 16 voivodeship codes | Required if `benefit` absent |
| `case` | `1 \| 2` | No | literal union | 1=stable (default), 2=urgent |
| `locality` | `string` | No | max 250 | Exact NFZ uppercase locality name |
| `benefit_for_children` | `boolean` | No | — | Restrict to paediatric providers |
| `limit` | `integer` | No | min 1, max 25 | Result cap (default 10) |

**Output Schema**: `SEARCH_APPOINTMENTS_OUTPUT_SCHEMA`
- `kind`: `"search" | "error"`
- `query`: echoed params
- `count`, `count_raw_nfz`, `count_skipped_invalid`, `page`, `total_pages`
- `results[]`: geo-tagged NormalizedQueueResult entries
- `results_no_geo[]`: entries without lat/lng
- `data_freshness`, `newest_snapshot`
- `banner`, `did_you_mean[]`, `elicited`, `disambiguation_needed`
- Error fields: `is_info`, `code`, `message`, `redirect_url`

**Dual Auth Parity**: `src/server.ts:456-633` — `getAuth()` called inside handler; works for any authenticated request. No API-key path (JWT-only architecture).

**Implementation Details**:
- Calls `nfz.searchQueues()` → NFZ `/queues` endpoint (KV-cached 1h)
- Pre-elicitation: runs `tryElicitProvince()` if both benefit+province missing
- Post-normalization: runs `tryElicitScope()` if mixed adult/paediatric results
- Null-date filtering: drops records with `dates: null` (defensive fix 2026-05-17 production crash)
- Did-You-Mean: calls `findDidYouMean()` (up to 4 keyword probes via `/benefits`) when `count=0` and benefit was specified
- External API timeout: 10s (`NFZ_API.TIMEOUT_MS`)
- One retry on 5xx (500ms backoff)

**Output Format**: Human-readable Polish text summary (top 3 results + footer) + `structuredContent` with full result set. Widget renders Leaflet map + list.

**Tool Behavior Hints**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

**MCP Prompt Integration**: `_meta: { ui: { resourceUri: "ui://terminy-leczenia/widget" } }`; `_meta: { viewUUID: crypto.randomUUID() }` in tool result.

---

### Tool 2: `list_other_places`

**Technical name**: `list_other_places`
**Display title**: "List Other Locations of Same Provider"

**Description (verbatim)**:
> Lists every other location where the same healthcare provider offers the same benefit, with each location's distinct first-available date. Returns a list of places (address, locality, phone, geo, wait date, statistics, accessibility) — wait times can differ dramatically across locations of one provider (live probe data showed a 67-day spread within one provider). Rendered as an inline drawer in the parent map widget. Use when the patient asks 'are there other locations of this same place' OR after a search_appointments result with has_other_places=true to surface a faster alternative at the same provider. Input is the queue_id (UUID) from a search_appointments result. Only meaningful when the original result had has_other_places=true (NFZ flag many-places='Y').

**Input Schema**:
| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `queue_id` | `string` | Yes | min 1 — UUID from `search_appointments` result |

**Output Schema**: `LIST_OTHER_PLACES_OUTPUT_SCHEMA`
- `kind`: `"other-places" | "error"`
- `benefit`, `provider`, `origin_queue_id`
- `places[]`: NormalizedQueueResult array
- `data_freshness`

**Dual Auth Parity**: `src/server.ts:638-720` — same `getAuth()` pattern; JWT-only.

**Implementation Details**:
- Calls `nfz.getManyPlaces(params.queue_id)` → NFZ `/many-places/{id}` (KV-cached 1h)
- `normalizeManyPlacesQueue()` injects parent `benefit`/`provider` (child records lack these in NFZ response)
- Summary: count of places + earliest date in Polish

**Output Format**: Polish text summary + full `structuredContent` with places array. Widget renders inline drawer.

**Tool Behavior Hints**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

**MCP Prompt Integration**: `_meta: { ui: { resourceUri: "ui://terminy-leczenia/widget" } }` — renders in same widget as parent `search_appointments`.

---

### Tool 3: `lookup_benefit`

**Technical name**: `lookup_benefit`
**Display title**: "Lookup NFZ Benefit Name"

**Description (verbatim)**:
> Returns the official Polish healthcare benefit names matching a substring query — required precondition for search_appointments because the queue API only matches dictionary entries, not freeform terms. Returns up to 25 official benefit names (uppercase Polish) as a plain text list, one per line, ranked by NFZ. The dictionary mixes DEPARTMENT/CLINIC entries ('ODDZIAŁ KARDIOLOGICZNY', 'PORADNIA OKULISTYCZNA') with PROCEDURE entries ('ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)', 'REZONANS MAGNETYCZNY') — they are DIFFERENT NFZ queues with different waits. Use whenever you do NOT already have an exact dictionary name. Pick the most specific match from the result list and pass it verbatim to search_appointments. Query must be at least 3 characters. CRITICAL: try the patient's LITERAL term first ('ZAĆMA', 'SOCZEWKI', 'PRZEGRODA', 'KOLANO') — NFZ exposes procedure-level benefits with realistic queue data. Only widen to department/specialty names ('OKULISTYCZNY', 'OTOLARYNGOLOG') if the literal term returns 0 results. NEVER substitute a department for a procedure when both exist — 'ODDZIAŁ OKULISTYCZNY' (oddział, kilka osób w kolejce) is a different queue than 'ZABIEGI W ZAKRESIE SOCZEWKI (ZAĆMA)' (procedura, kolejka miesiące) even though both treat eyes. Mapping (literal → fallback if 0 results): 'zaćma' → ['ZAĆMA' or 'SOCZEWKI', else 'OKULISTYCZNY']; 'septoplastyka' / 'przegroda nosa' → ['PRZEGRODA' or 'SEPTOPLASTYKA', else 'OTOLARYNGOLOG']; 'kolano' (rezonans) → ['REZONANS']; 'kardiolog' → ['KARDIOLOG']. Avoid over-specific phrases ('PORADNIA KARDIOLOGICZNA' = 0 results — shorter substring wins). If results=0, the response carries `did_you_mean[]` with NFZ-verified close matches — pick one and pass it verbatim to search_appointments, do NOT guess a new specialty term.

**Input Schema**:
| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | min 3, max 250 |
| `limit` | `integer` | No | min 1, max 25 (default 10) |

**Output Schema**: `LOOKUP_OUTPUT_SCHEMA`
- `kind`: `"lookup" | "error"`
- `entity`: `"benefit"`
- `results[]`: up to 25 official benefit names (strings)
- `did_you_mean[]`: NFZ-verified close matches when `results` is empty

**Dual Auth Parity**: `src/server.ts:726-774` — LLM-only tool (no `_meta.ui`); same JWT-only auth path.

**Implementation Details**:
- Calls `nfz.listBenefits()` → NFZ `/benefits` (KV-cached 24h)
- Zero-results path: calls `lookupBenefitDidYouMean()` — (A) keyword split on multi-word query, (B) `BENEFIT_SYNONYMS` map (patient lay terms → NFZ specialty substrings); probes NFZ up to 6 candidates
- No widget (`_meta.ui` absent — LLM-only tool)

**Output Format**: Polish text list of benefit names. Did-you-mean suggestions in Polish.

**Tool Behavior Hints**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

---

### Tool 4: `lookup_locality`

**Technical name**: `lookup_locality`
**Display title**: "Lookup NFZ Locality Name"

**Description (verbatim)**:
> Returns Polish locality names from the NFZ dictionary matching a substring within a specified voivodeship — needed to disambiguate city vs district before passing to search_appointments. Returns up to 25 locality names (uppercase Polish) as a plain text list. City districts are separate entries — example: query='Warszawa' in voivodeship 07 returns WARSZAWA, WARSZAWA BEMOWO, WARSZAWA BIAŁOŁĘKA, WARSZAWA BIELANY, WARSZAWA MOKOTÓW, ... (19 total). Use when the patient mentions a city to find both the city itself and its districts. Pass the chosen exact name to search_appointments(locality=...). Query must be at least 3 characters. Voivodeship code (01-16) is required.

**Input Schema**:
| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | min 3, max 250 |
| `province` | `enum("01"–"16")` | Yes | required |
| `limit` | `integer` | No | min 1, max 25 (default 10) |

**Output Schema**: `LOOKUP_OUTPUT_SCHEMA` (entity: `"locality"`)

**Dual Auth Parity**: `src/server.ts:778-819` — LLM-only, JWT-only.

**Implementation Details**:
- Calls `nfz.listLocalities()` → NFZ `/localities` (KV-cached 24h)
- Surfaced province name (human-readable) in output via `PROVINCE_NAMES[params.province]`

**Tool Behavior Hints**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

---

### Tool 5: `lookup_provider`

**Technical name**: `lookup_provider`
**Display title**: "Lookup NFZ Healthcare Provider"

**Description (verbatim)**:
> Returns Polish healthcare-provider names from the NFZ dictionary matching a substring within a specified voivodeship. Returns up to 25 official provider names (uppercase Polish, often long official forms like '5 WOJSKOWY SZPITAL KLINICZNY Z POLIKLINIKĄ - SAMODZIELNY PUBLICZNY ZAKŁAD OPIEKI ZDROWOTNEJ W KRAKOWIE') as a plain text list. Use when the patient names a specific hospital or clinic ('chcę termin w CMKP', 'w Szpitalu Wolskim') rather than a benefit type. Query must be at least 3 characters. Voivodeship code (01-16) is required. NFZ does not expose direct provider→queues lookup; for that, take a provider name from this list and feed it as a future provider parameter (not implemented in MVP) or filter results returned by search_appointments.

**Input Schema**:
| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | min 3, max 250 |
| `province` | `enum("01"–"16")` | Yes | required |
| `limit` | `integer` | No | min 1, max 25 (default 10) |

**Output Schema**: `LOOKUP_OUTPUT_SCHEMA` (entity: `"provider"`)

**Dual Auth Parity**: `src/server.ts:822-862` — LLM-only, JWT-only.

**Implementation Details**:
- Calls `nfz.listProviders()` → NFZ `/providers` (KV-cached 24h)
- No direct provider→queue chaining in current MVP

**Tool Behavior Hints**: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

---

## 5. UX & Frontend Quality Assessment (6 Pillars)

### Pillar I: Identity & First Impression

- **Server name**: `terminy-leczenia` — clear, descriptive slug
- **Server instructions**: ✅ Present and comprehensive; covers purpose, usage patterns, disambiguation rules, response format, interaction boundaries, performance limits, and out-of-scope topics
- **Widget description**: ✅ Declared on resource registration — "Interactive map + list of NFZ appointment queues. Shows first-available dates, wait-time statistics, accessibility flags (toilet/ramp/car-park/elevator), and alternative locations of the same provider. Filters by voivodeship, locality, case urgency, and paediatric scope."
- **Server icon**: ❌ Not declared

### Pillar II: Model Control & Quality

- **server-instructions word count**: ~450 words (content of `SERVER_INSTRUCTIONS` string in `src/server-instructions.ts`)
- **Coverage checklist**:
  - Entry point / tool sequence: ✅ (`search_appointments` is entry point, elicitation chain documented)
  - Out-of-scope topics: ✅ (sanatorium, symptom translation, booking — all listed)
  - Response format reference: ✅ (`structuredContent` fields listed)
  - Interaction boundary note (MCP Apps philosophy): ✅ (disambiguation widget territory vs. chat)
  - Polish response directive: ⚠️ Not present — LLM may default to English on some hosts
  - Performance limits: ✅ (cold/warm latency, cache TTL, max results)

### Pillar III: Interactivity & Agency

- **Elicitation**: ✅ Two interactive forms (province picker, adult/child scope)
- **Disambiguation widget fallback**: ✅ `disambiguation_needed` signals widget to render inline buttons
- **Did-You-Mean**: ✅ Both in `search_appointments` (tool-level) and `lookup_benefit` (dictionary-level)
- **Cross-tool prompting**: ✅ Tool descriptions and `server-instructions` chain `lookup_benefit` → `search_appointments` → `list_other_places`
- **Prompts**: ✅ 2 slash-command prompts with multi-step guidance

### Pillar IV: Context & Data Management

- **KV caching**: ✅ `CACHE_KV` (1h queues, 24h dicts)
- **Staleness signal**: ✅ `newest_snapshot` field + ⚠️ warning if >60 days old in text summary
- **Freshness metadata**: ✅ `data_freshness` = NFZ `meta.date-modified`
- **viewUUID**: ✅ Returned in `search_appointments` result for widget state keying
- **State persistence**: N/A — results self-contained; no cross-session state

### Pillar V: Media & Content Handling

- **Widget**: ✅ Leaflet map + list; single-file HTML built by Vite
- **Map tiles**: OSM tiles via 4 subdomains (a/b/c/tile.openstreetmap.org) — declared in CSP `resourceDomains`
- **Accessibility data**: ✅ toilet, ramp, car-park, elevator flags per queue entry
- **No PHI**: ✅ All NFZ data is anonymous (no patient data processed)

### Pillar VI: Operations & Transparency

- **Observability**: ✅ Cloudflare Observability enabled (`"observability": { "enabled": true }`)
- **Structured logging**: ✅ `logger` emits JSON events via `console.log` → Cloudflare Workers Logs
- **Log event types**: `tool_started`, `tool_completed`, `tool_failed`, `auth_attempt`, `api_call`, `cache_operation`, `server_error`, `transport_request`
- **Action IDs**: ✅ `crypto.randomUUID()` per tool invocation for correlation
- **Error transparency**: ✅ NFZ error codes mapped to user-facing Polish messages; info codes returned as non-error `is_info=true` with redirect hint

---

## 6. Deployment Status

### 6.1 Consistency Tests

`scripts/verify-consistency.sh` — ❌ Script not found at `../../scripts/verify-consistency.sh` relative to project root. No consistency script present in `scripts/lifecycle/`. N/A for this project.

### 6.2 TypeScript Compilation

**Command**: `cd projects/terminy-leczenia && npx tsc --noEmit`
**Result**: ✅ **Exit code 0 — no errors or warnings**
**Verified**: 2026-05-25

### 6.3 Production URL

- **Primary domain**: `https://terminy-leczenia.wtyczki.ai` (custom domain, `wrangler.jsonc:49-52`)
- **workers.dev**: ✅ Disabled (`"workers_dev": false`)
- **Custom domain config**: `{ "pattern": "terminy-leczenia.wtyczki.ai", "custom_domain": true }`
- **MCP endpoint**: `https://terminy-leczenia.wtyczki.ai/mcp`

---

## 7. Infrastructure Components

### Cloudflare Assets (MCP Apps)

- **Binding**: `ASSETS` (type: Fetcher)
- **Directory**: `./web/dist/widgets`
- **Build command**: `npm install && npm run build:widgets && npx tsc --noEmit`
- **Widget files**: `web/widgets/widget.html` (source), `web/dist/widgets/widget.html` (built — 164 lines, single-file bundle)

### Durable Objects

❌ Not declared. `createMcpHandler` uses WorkerTransport (no DO needed for stateless server).

### KV Namespaces

| Binding | ID | Purpose | TTL |
|---------|----|---------|-----|
| `CACHE_KV` | `fa6ff790f146478e85ea77ae4a5caa4b` | NFZ API response caching | Queues: 1h, Dicts: 24h |
| Preview ID | `4b37112559f2429191633d98781645ca` | Dev environment | — |

No `OAUTH_KV` or `USER_SESSIONS` (centralized auth — not needed on resource servers).

### D1 Database

| Binding | Database Name | ID | Tables |
|---------|---------------|-----|--------|
| `DB` | `mcp-oauth` | `eac93639-d58e-4777-82e9-f1e28113d5b2` | `users` (`user_id`, `email`, `is_deleted`, `workos_user_id`) |

Shared with `panel.wtyczki.ai` — centralized auth; this server only reads `users` table.

### R2 Storage

❌ Not declared.

### Workers AI

❌ Not declared. `AI` binding commented out in `src/types.ts`.

### AI Gateway

❌ `AI_GATEWAY_ID` declared as optional string in `src/types.ts` but not used in code or wrangler.jsonc bindings.

### Workflows

❌ Not implemented. Skeleton stubs present but empty.

### Secrets (Wrangler)

**Shared (required)**:
- `AUTHKIT_DOMAIN` — declared as `var` in wrangler.jsonc (not a secret; public domain): `"exciting-domain-65.authkit.app"`

**Server-specific secrets**: None required. NFZ ITL API is public and anonymous — no API key needed.

No `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, or per-server secrets (centralized auth pattern confirmed).

---

## 8. Architecture Patterns

### Authentication Architecture (JWT-only transport)

```
Request → POST /mcp
  ↓ Authorization: Bearer <jwt>
  ↓ verifyJwt(token, AUTHKIT_DOMAIN)   ← jose jwtVerify + JWKS (cached in isolate)
  ↓ getUserByWorkosId(DB, sub)          ← D1 lookup by workos_user_id (is_deleted=0)
  ↓ createMcpHandler(server, { authContext: { props: { userId, email } } })
  ↓ tools: getMcpAuthContext().props.userId / .email
```

Auth failures return `401 Unauthorized` with `WWW-Authenticate` header pointing to the protected-resource metadata endpoint (RFC 9728).

### Caching Strategy

Pattern: **Cache-First with fire-and-forget write**

```
Tool call → NfzClient method
  ↓ cacheFirst(CACHE_KV, key, ttl, fetcher)
    ↓ kv.get(cacheKey) → HIT → return cached
    ↓               → MISS → fetchNfz() → [fire-and-forget] kv.put(…)
```

Cache key format: `nfz:<prefix>:<sorted param=value pairs>` (deterministic, human-readable, <250 chars).

### Concurrency Control

None needed — stateless server. Each request is isolated in `createMcpHandler`'s fresh McpServer + WorkerTransport instance. Cloudflare Workers handle concurrency at platform level.

### Storage Architecture

- **No server-side state**: all results computed per-request from NFZ API + KV cache
- **KV** is read-heavy, write once per cache miss (no read-modify-write race condition risk)
- **D1** is read-only from this server's perspective (user lookup only; writes happen in panel.wtyczki.ai)

---

## 9. Code Quality

### Type Safety

- **Strict mode**: TypeScript 5.9.3; `tsconfig.json` in project root
- **Zod v4**: All input schemas use `zod/v4` import + plain ZodRawShapeCompat objects + `.meta({description})`
- **Interface-driven outputs**: `SearchAppointmentsOutput`, `ListOtherPlacesOutput`, `ErrorOutput`, `NormalizedQueueResult` all typed; cast to `Record<string, unknown>` only at tool return boundary
- **No `any`**: No suppressed TypeScript errors found; compilation clean

### Error Handling

| Scenario | Handling |
|----------|---------|
| Account deleted | `is_deleted = 0` in D1 query → 401 |
| JWT expired/invalid | `classifyJoseError()` → typed reason → `logger.warn` → 401 |
| User not in D1 | `getUserByWorkosId` returns null → 401 |
| NFZ 400 error | `mapNfzError()` → `NfzApiError` → `nfzErrorResult()` → `isError=true` tool result |
| NFZ 5xx | 1 retry at 500ms → `NfzApiError` fallback |
| NFZ info codes (1200038, 1200055) | `isInfo=true` → non-error response with redirect hint |
| `dates: null` in NFZ response | Defensive null filter; `count_skipped_invalid` reported |
| `benefit + province` both missing | Elicit voivodeship → on failure return typed error (code 1200005) |
| ASSETS binding missing | `loadHtml()` throws descriptive Error |

### Observability

- **Cloudflare Observability**: ✅ `"enabled": true` in wrangler.jsonc
- **Console logging**: All events via `logger` → `console.log(JSON.stringify(entry))` → Cloudflare Workers Logs (auto-indexed)
- **Monitoring points**: auth_attempt, tool_started, tool_completed, tool_failed, cache_operation (hit/miss), api_call (service=nfz-itl, duration_ms), server_error
- **Correlation**: `action_id` (UUID) per tool invocation links started/completed/failed events

---

## 10. Technical Specifications

### Performance

| Metric | Value |
|--------|-------|
| Cold call latency | < 2s |
| Warm (KV cache hit) | < 500ms |
| External timeout | 10s (`NFZ_API.TIMEOUT_MS`) |
| 5xx retry | 1 retry, 500ms backoff |
| Max results per call | 25 (NFZ hard cap) |
| Queue cache TTL | 1h |
| Dictionary cache TTL | 24h |
| Widget build size | 164 lines (single-file HTML) |

### Dependencies

**Common Across MCP Apps**:
```json
{
  "@modelcontextprotocol/ext-apps": "^1.7.0",
  "@modelcontextprotocol/sdk": "^1.29.0",
  "agents": "^0.11.5",
  "jose": "^6.1.0",
  "zod": "^4.1.13"
}
```

**Widget-Specific**:
```json
{
  "clsx": "^2.1.1",
  "leaflet": "^1.9.4",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "tailwind-merge": "^3.4.0"
}
```

**Development**:
```json
{
  "@cloudflare/workers-types": "^4.20250101.0",
  "@types/leaflet": "^1.9.12",
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2",
  "@vitejs/plugin-react": "^4.3.4",
  "autoprefixer": "^10.4.20",
  "concurrently": "^9.2.1",
  "cross-env": "^7.0.3",
  "postcss": "^8.4.49",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.9.3",
  "vite": "^6.0.6",
  "vite-plugin-singlefile": "^2.3.0",
  "wrangler": "^4.45.3"
}
```

### SDK Versions

| SDK | Version |
|-----|---------|
| `@modelcontextprotocol/sdk` | `^1.29.0` |
| `@modelcontextprotocol/ext-apps` | `^1.7.0` |
| `agents` (Cloudflare) | `^0.11.5` |
| `zod` | `^4.1.13` |
| `wrangler` | `^4.45.3` |
| `typescript` | `^5.9.3` |

---

## 11. Compliance Summary

| Check | Status | Notes |
|-------|--------|-------|
| Vendor Hiding | ✅ | NFZ is a public open-data API brand — referenced openly |
| Dual Auth Parity | ⚠️ | JWT-only — API key path removed 2026-05-18 (per `lesson_workos_secrets.md`); single auth path is the correct current architecture |
| 4-Part Descriptions | ✅ | All 5 tools follow Purpose→Returns→Use Case→Constraints in `src/tools/descriptions.ts` |
| Custom Domain | ✅ | `terminy-leczenia.wtyczki.ai` |
| workers.dev Disabled | ✅ | `"workers_dev": false` |
| Consistency Tests | N/A | `verify-consistency.sh` not found at expected path |
| TypeScript Compilation | ✅ | `npx tsc --noEmit` exits 0 (verified 2026-05-25) |
| Prompts Implemented | ✅ | 2 prompts: `znajdz-termin`, `sprawdz-objaw` |
| Zod Schema Shape | ✅ | Plain ZodRawShapeCompat objects, `zod/v4` import, `.meta({description})` |
| Tool Naming (snake_case) | ✅ | All 5 tool names use underscore separation |
| Error Handling | ✅ | NFZ error codes mapped; info codes as non-error; null-dates defensive filter |
| Color-scheme Meta | ⚠️ | Not verified — widget HTML not inspected for `color-scheme` meta tag |
| Cross-env Build | ✅ | `cross-env INPUT=...` in all npm build scripts |
| Polish response directive in instructions | ⚠️ | Missing from `SERVER_INSTRUCTIONS` — may cause English responses on some hosts |
| `outputSchema` declared | ✅ | All 5 tools |
| Elicitation | ✅ | Two elicitation forms with graceful fallback |
| `viewUUID` | ✅ | `search_appointments` returns `_meta.viewUUID` |
| Tool annotations | ✅ | All 5 tools declare readOnly/destructive/idempotent/openWorld hints |
| CSP on contents[] (not config) | ✅ | `_meta` placed on `contents[]` entry in resource handler |
| `serve:stdio` script | ❌ | Missing from package.json — only `wrangler dev` for local testing |

---

## 12. Unique Architectural Features

### 1. Inline Elicitation with Widget Fallback (Dual-Host UX)

This server implements a two-path disambiguation strategy that gracefully handles both elicitation-capable hosts (Claude Code) and non-capable hosts (AWS Bedrock, Claude.ai web):

```typescript
// Path A: elicitation-capable host
const chosen = await tryElicitProvince(server);
if (chosen) { params.province = chosen; elicited.province = chosen; }

// Path B: graceful degradation — widget renders inline buttons
else { disambiguationNeeded.province = true; }
```

The `disambiguation_needed` field in `structuredContent` signals the widget to render inline filter buttons (👤/👶 for scope, province picker for location). This avoids double-asking — the widget handles filtering of already-displayed data; chat narration handles text-only fallback. The server.ts comment (`src/server.ts:379-394`) explicitly references the Claude MCP Apps docs principle that "filtering of already-displayed data is widget territory, not chat."

### 2. Server-side Did-You-Mean (Eliminates Extra Round-Trips)

When `search_appointments` returns 0 results for a benefit term, it automatically runs `findDidYouMean()` — multi-query keyword probes against NFZ `/benefits` — and includes close matches in the same response. This eliminates the need for the LLM to make a separate `lookup_benefit` call, saving one full round-trip.

Similarly, `lookup_benefit` has its own `lookupBenefitDidYouMean()` combining:
- (A) Keyword decomposition: splits multi-word query on `[\s,/-]+`, probes each ≥4-char token
- (B) `BENEFIT_SYNONYMS` map: translates patient lay terms (e.g., "PRZEGRODA" → "OTOLARYNGOLOG") to NFZ specialty substrings

### 3. Null-Date Defensive Filtering (Production Bug Fix 2026-05-17)

A production crash revealed NFZ returns some queue records with `dates: null`. The normalizer defensively returns `null` for such records:

```typescript
// src/api-client.ts:311-313
if (!a.dates || !a.dates.date) return null;
```

`count_skipped_invalid` in the output tracks dropped records, and `count_raw_nfz` preserves NFZ's reported total for diagnostics. The LLM is instructed to use `count` (renderable) for user-facing numbers.

### 4. Map-Server Chain Pattern (3 Lookup Tools as Preconditions)

The server implements a canonical "map-server chain" where 3 LLM-only lookup tools act as preconditions for the 2 widget tools:

```
lookup_benefit  →  search_appointments  (widget: map + list)
lookup_locality →  search_appointments
lookup_provider →  search_appointments (future: provider param)
search_appointments(has_other_places=true) → list_other_places (widget: inline drawer)
```

Tool descriptions encode the chain explicitly, including cross-references. The `znajdz-termin` prompt automates chain detection (uppercase NFZ dict name vs. lay term heuristic via `looksLikeNfzDictionaryName()`).

### 5. BENEFIT_SYNONYMS Domain Expert Map

`src/helpers/benefit-synonyms.ts` encodes a curated map of patient lay terms to NFZ specialty substrings. This bridges the vocabulary gap between how patients describe conditions and how NFZ categorizes benefits, without requiring an external LLM call for translation.

---

## 13. Known Issues & Limitations

1. **NFZ `dates: null` records** — live NFZ data occasionally returns queue entries with no scheduled date. These are filtered out and counted in `count_skipped_invalid`. No upstream fix available.
2. **Sanatorium queries (code 1200038)** — NFZ ITL API does not support leczenie uzdrowiskowe; returns info code with redirect to `skierowania.nfz.gov.pl`. Surfaced as non-error `is_info=true`.
3. **Referring-doctor benefits (code 1200055)** — Some benefits are delivered by the referring doctor and not exposed in the ITL API. Same `is_info` treatment.
4. **No direct provider→queue lookup** — `lookup_provider` returns provider names, but `search_appointments` does not currently accept a provider filter. Noted as "not implemented in MVP" in tool description.
5. **`lookup_locality` requires `province`** — Locality search scoped to one voivodeship; no cross-province locality search.
6. **Wait dates up to 12+ months** — NFZ data accuracy is subject to provider reporting; long waits are real, not stale.
7. **No booking** — Patients must call providers directly; phone numbers are included in results.
8. **Claude.ai elicitation pending** — `tryElicitProvince`/`tryElicitScope` fall through to widget fallback on Claude.ai web until Anthropic ships elicitation support (tracked by Anthropic engineer @ochafik, 2026-04-06).
9. **Polish response directive missing** — `SERVER_INSTRUCTIONS` does not include "Respond in Polish by default"; may cause English responses on some hosts.
10. **types.ts template placeholder** — `src/types.ts:8` still contains `{{SERVER_ID}}` in comment (cosmetic only, no runtime impact).
11. **`serve:stdio` script missing** — Cannot test with Claude Desktop locally without adding the script.

---

## 14. Future Roadmap

### Implemented (Latest)

- ✅ Elicitation (province + scope disambiguation) with widget fallback
- ✅ Did-You-Mean for both `search_appointments` and `lookup_benefit`
- ✅ BENEFIT_SYNONYMS map for patient-vocabulary bridging
- ✅ Null-date defensive filtering (fix 2026-05-17 production crash)
- ✅ Dual-top result layout (adults vs. children sections in text summary)
- ✅ Freshness signal with staleness warning (>60 days snapshot age)
- ✅ 2 slash-command prompts (`znajdz-termin`, `sprawdz-objaw`)
- ✅ `viewUUID` in tool results
- ✅ Full tool annotations on all 5 tools
- ✅ Locality post-filter with diacritics-insensitive matching

### Planned Components

- Provider filter in `search_appointments` (current MVP gap documented in `lookup_provider` description)
- Polish response directive in `SERVER_INSTRUCTIONS`
- `serve:stdio` script for Claude Desktop local testing
- Completions for `benefit` and `locality` params (skeleton stub in `src/optional/completions/`)
- Claude.ai elicitation support (depends on Anthropic shipping the capability)

### Planned Use Cases

- Integration with companion `nfz-benefits` server for symptom→benefit translation (currently handled at LLM level by `sprawdz-objaw` prompt)
- Cross-server link from `nfz-benefits` → `terminy-leczenia` via ResourceLinks

---

## 15. Testing Status

- **Unit Tests**: ❌ No test files found
- **Integration Tests**: ❌ No test runner configured
- **TypeScript Compilation**: ✅ Clean (`npx tsc --noEmit` exits 0, verified 2026-05-25)
- **Manual Testing Checklist**:
  - [ ] `search_appointments` with benefit only (triggers province elicitation)
  - [ ] `search_appointments` with province only
  - [ ] `search_appointments` with both benefit + province
  - [ ] `search_appointments` returns mixed adult/paediatric → scope elicitation
  - [ ] `search_appointments` with nonexistent benefit → `did_you_mean[]`
  - [ ] `list_other_places` with valid `queue_id`
  - [ ] `lookup_benefit` with lay term → synonym map → did_you_mean
  - [ ] `lookup_locality` with city name (Warsaw → 19 districts)
  - [ ] `lookup_provider` with hospital name
  - [ ] NFZ 400 error → typed error response
  - [ ] Sanatorium query → `is_info=true` + redirect URL
  - [ ] Widget renders Leaflet map correctly in Claude MCP App frame
  - [ ] `znajdz-termin` prompt drives correct tool chain
  - [ ] `sprawdz-objaw` prompt drives symptom→benefit→search chain

---

## 16. Documentation Status

| Document | Status | Notes |
|----------|--------|-------|
| README | ❌ Not found | No README.md in project root |
| API docs (NFZ) | ✅ | `docs/` directory with NFZ API samples in `api-samples/` |
| Setup guide | ❌ Not present | |
| Troubleshooting | ❌ Not present | |
| Deployment | ✅ | Documented in wrangler.jsonc comments and `src/server.ts` file header |
| Server instructions | ✅ | `src/server-instructions.ts` — comprehensive cross-cutting guide |
| Tool descriptions | ✅ | `src/tools/descriptions.ts` — 4-part pattern, all 5 tools |

---

## 17. File Structure (MCP Apps Standard)

### Source Files (src/)

```
src/
├── index.ts                          Entry point: JWT auth pre-handler + createMcpHandler dispatch
├── server.ts                         McpServer factory: 5 tools, 2 prompts, 1 resource
├── server-instructions.ts            SERVER_INSTRUCTIONS string (~450 words)
├── types.ts                          Env interface (ASSETS, DB, CACHE_KV, AUTHKIT_DOMAIN)
├── well-known.ts                     RFC 9728 + RFC 8414 discovery endpoints
├── api-client.ts                     NfzClient: 6 methods, KV cache, timeout, retry, normalizers
├── auth/
│   ├── jwt-verify.ts                 verifyJwt() via jose + JWKS (isolate-cached)
│   └── auth-utils.ts                 getUserByWorkosId() via D1
├── helpers/
│   ├── assets.ts                     loadHtml() + createUiMeta() utilities
│   └── benefit-synonyms.ts           BENEFIT_SYNONYMS map (patient terms → NFZ specialty substrings)
├── resources/
│   └── ui-resources.ts               UI_RESOURCES, CLAUDE_SANDBOX_DOMAIN, hasUISupport()
├── schemas/
│   ├── inputs.ts                     ZodRawShapeCompat input schemas for all 5 tools
│   ├── outputs.ts                    Output types + Zod outputSchemas (3 variants)
│   └── nfz.ts                        NFZ API response types + NfzApiError class
├── shared/
│   ├── constants.ts                  SERVER_CONFIG, NFZ_API, KV_TTL, PROVINCE_NAMES/CODES
│   └── logger.ts                     Structured logger (type-safe event union, RFC-5424 levels)
├── tools/
│   ├── descriptions.ts               TOOL_METADATA + getToolDescription() (4-part pattern)
│   └── index.ts                      Re-exports from descriptions
└── optional/
    ├── completions/dynamic-enums.ts  Empty stub
    ├── elicitation/
    │   ├── forms.ts                  Empty stub (elicitation implemented inline in server.ts)
    │   └── url-input.ts              Empty stub
    ├── prompts/
    │   ├── index.ts                  znajdzTerminPrompt + sprawdzObjawPrompt (2 prompts)
    │   └── workflows.ts              Empty stub
    ├── resources/
    │   ├── index.ts                  Stub
    │   └── templates.ts              Stub
    ├── tasks/
    │   ├── async-executor.ts         Empty stub
    │   └── task-store.ts             Empty stub
    └── ui/component-generator.ts     Stub
```

### Widget Files (web/widgets/)

```
web/
├── tsconfig.json
├── widgets/
│   ├── widget.html                   Vite entry point HTML
│   └── widget.tsx                    Main React component (Leaflet map + list)
├── components/                       React component library
├── lib/
│   ├── types.ts
│   └── utils.ts
└── styles/                           Tailwind CSS
```

### Build Output (web/dist/widgets/)

```
web/dist/widgets/
└── widget.html                       Single-file bundle (164 lines, JS+CSS inlined by viteSingleFile)
```

### Configuration Files

```
wrangler.jsonc                        Workers config: assets, D1, KV, routes, observability
package.json                          Dependencies + scripts
tsconfig.json                         TypeScript config
vite.config.ts                        Build: root=web/, viteSingleFile, emptyOutDir=false
postcss.config.js                     PostCSS (Tailwind)
tailwind.config.js                    Tailwind config
```

### Common Scripts (package.json)

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "dev:widget": "cross-env INPUT=widgets/widget.html vite build --watch",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:widget\"",
    "build:widget": "cross-env INPUT=widgets/widget.html vite build",
    "build:widgets": "npm run build:widget",
    "deploy": "npm run build:widgets && wrangler deploy",
    "type-check": "tsc --noEmit",
    "pre-commit": "npm run type-check && npm run build:widgets",
    "verify-all": "npm run pre-commit",
    "verify-deploy": "npm ci && npx wrangler deploy --dry-run --outdir /tmp/wrangler-dry-run",
    "cf-typegen": "wrangler types"
  }
}
```

⚠️ `serve:stdio` script missing (Claude Desktop local dev). `serve:http` also absent.

---

**End of Snapshot**

---

## Appendix A: MCP Apps (SEP-1865) Quick Reference

### Two-Part Registration Pattern (actual source)

**Part 1 — Resource** (`src/server.ts:427-449`):
```typescript
server.registerResource(
  "widget",
  "ui://terminy-leczenia/widget",          // must match tool _meta.ui.resourceUri
  {
    mimeType: RESOURCE_MIME_TYPE,           // "text/html;profile=mcp-app"
    description: widgetResource.description,
    _meta: { ui: widgetResource._meta.ui! }, // informational on config only
  },
  async () => {
    const html = await loadHtml(env.ASSETS, "/widget.html");
    return {
      contents: [{
        uri: widgetResource.uri,
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: widgetResource._meta as Record<string, unknown>, // CSP lives HERE
      }],
    };
  },
);
```

**Part 2 — Tool** (`src/server.ts:455-469`, `search_appointments`):
```typescript
server.registerTool(
  "search_appointments",
  {
    title: TOOL_METADATA.search_appointments.title,
    description: getToolDescription("search_appointments"),
    inputSchema: SearchAppointmentsInput,
    outputSchema: SEARCH_APPOINTMENTS_OUTPUT_SCHEMA,
    annotations: {
      readOnlyHint: true, destructiveHint: false,
      idempotentHint: true, openWorldHint: true
    },
    _meta: { ui: { resourceUri: "ui://terminy-leczenia/widget" } },
  },
  handler,
);
```

### Widget Build Configuration (vite.config.ts)

```typescript
export default defineConfig({
  root: "web/",
  plugins: [react(), viteSingleFile()],
  build: {
    rollupOptions: { input: path.resolve(__dirname, "web", INPUT) },
    outDir: "dist",       // relative to root: web/dist/
    emptyOutDir: false,   // CRITICAL for multi-widget projects
  },
});
```

---

## Appendix B: AnythingLLM Configuration Example

```json
{
  "name": "Terminy Leczenia NFZ",
  "transport": {
    "type": "streamable-http",
    "url": "https://terminy-leczenia.wtyczki.ai/mcp",
    "headers": {
      "Authorization": "Bearer <workos_access_token>"
    }
  }
}
```

---

## Appendix C: Common Architecture Patterns

This server matches **Pattern 1: Stateless External API Server** (canonical reference: `nbp-exchange`).

- **No Durable Objects**: `createMcpHandler` + `WorkerTransport` (stateless per-request)
- **External API**: NFZ ITL (`api.nfz.gov.pl/app-itl-api`) — public, anonymous
- **KV caching**: cache-first with TTL (24h/1h) — key differentiator from pure stateless
- **Auth**: JWT-only via WorkOS AuthKit JWKS + D1 user lookup
- **Widget**: Leaflet map + list; React 19 + Tailwind

Hybrid element: the `CACHE_KV` caching layer is a lightweight form of stateful persistence, but it holds API responses (not user session state). Pattern is correctly classified as "Stateless External API Server with KV Caching."

---

## Appendix D: Checklist References

Platform-level checklists (not project-local):
- `production_docs/MCP_APP_CHECKLIST.md` — designing/auditing/upgrading a server
- `production_docs/MCP_DESIGN_BEST_PRACTICES.md` — core 14 rules
- `production_docs/MCP_DESIGN_ADVANCED_PATTERNS.md` — situational patterns

Project-level feature checklists (`features/`) are not present in this project.

---

## Appendix E: Quick Commands

### Development

```bash
npm run dev           # wrangler dev (HTTP, port 8787)
npm run dev:full      # wrangler dev + vite watch in parallel
npm run dev:widget    # vite watch only (widget hot reload)
```

### Building & Deployment

```bash
npm run build:widgets           # build widget.html → web/dist/widgets/
npm run type-check              # npx tsc --noEmit
npm run deploy                  # build:widgets + wrangler deploy
npm run verify-deploy           # npm ci + wrangler deploy --dry-run
```

### Secrets Management

```bash
# No server-specific secrets required.
# AUTHKIT_DOMAIN is a wrangler.jsonc var (public, not a secret).
# No wrangler secret put needed for this server.
```

### Testing

```bash
npm run type-check              # TypeScript compilation check
npm run pre-commit              # type-check + build:widgets
# verify-consistency.sh not available for this project
```

---

## Appendix F: NFZ ITL API Reference

The NFZ "Informator o Terminach Leczenia" (ITL) API is the Polish public healthcare open-data API powering this server:

- **Base URL**: `https://api.nfz.gov.pl/app-itl-api`
- **Authentication**: None (public, anonymous)
- **API Version**: `1.3.0` (probed live 2026-05-17, not deprecated)

**Endpoints used**:

| Endpoint | Method | Cache TTL | Purpose |
|----------|--------|-----------|---------|
| `/queues` | GET | 1h | Main appointment queue search |
| `/many-places/{id}` | GET | 1h | Alternative locations of same provider |
| `/benefits` | GET | 24h | Benefit name dictionary |
| `/localities` | GET | 24h | Locality name dictionary |
| `/providers` | GET | 24h | Provider name dictionary |
| `/version` | GET | 24h | API version probe |

**Error model**: HTTP 400 with `{ errors: [{ "error-code": N, "errorr-reason": "..." }] }` (note double-r in "errorr-reason" — NFZ API typo preserved in code at `src/api-client.ts:76`).

**Key error codes** (20 documented in `src/api-client.ts:NFZ_ERROR_MAP`):
- `1200005`: benefit or province required
- `1200038`: sanatorium → `isInfo=true` + redirect to `skierowania.nfz.gov.pl`
- `1200055`: referring-doctor benefit → `isInfo=true`
- `1200051`: resource not found (invalid queue_id)

**Known data quality issue**: `dates: null` on some queue records (confirmed live 2026-05-17) — defensively filtered in `normalizeQueueAttributes()`.
