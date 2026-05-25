---
generator: /snapshot-server
generated: 2026-05-20
source_commit: dbfdd4d
depends_on: []
---

# Terminy Leczenia NFZ MCP App - Infrastructure Snapshot

**Generated**: 2026-05-20
**Repository**: terminy-leczenia
**Status**: Production
**Architecture**: MCP Apps (SEP-1865) - External-API Map Server with Elicitation

---

## 1. Project Identity

- **Name**: Terminy Leczenia NFZ MCP · **Slug**: `terminy-leczenia`
- **Description**: NFZ ITL Open Data appointment-queue search with Leaflet map + list widget.
- **Primary Domain**: https://terminy-leczenia.wtyczki.ai
- **Server Icon / Tool Icons**: ❌ Not configured
- **Display-Name Resolution**: ✅ All 5 tools provide `title` (`src/tools/descriptions.ts:23-135`)
- **Assets Binding**: ✅ `ASSETS` → `./web/dist/widgets` (`wrangler.jsonc:19-22`); Vite + viteSingleFile + `cross-env`
- **UI Resource URI**: `ui://terminy-leczenia/widget`
- **Two-Part Registration**: ✅ `src/server.ts:369-392` (Resource) + `src/server.ts:397-410` (Tool with `_meta.ui.resourceUri`)

---

## 2. Required Functionalities

### 2.1 Dual Authentication
- **OAuth/JWT Path**: ✅ AuthKit JWKS via `jose` (`src/auth/jwt-verify.ts:23-36`); D1 lookup `users WHERE workos_user_id = ? AND is_deleted = 0` (`src/auth/auth-utils.ts:15-18`).
- **API Key Path**: ❌ Not implemented — platform-wide JWT-only since 2026-05-18.
- **Props Extraction**: ✅ `getMcpAuthContext()` → `auth?.props?.{ userId, email }` via `getAuth()` helper (`src/server.ts:57-63`).
- **D1 (mcp-oauth)**: ✅ binding `DB`, ID `eac93639-d58e-4777-82e9-f1e28113d5b2` (`wrangler.jsonc:24-30`).
- **OAUTH_KV / USER_SESSIONS**: ❌ Not bound — centralized at `panel.wtyczki.ai`.

### 2.2 Transport (canonical `createMcpHandler`)
- **`/mcp` Endpoint**: ✅ Streamable HTTP via `createMcpHandler` from `agents/mcp` (`src/index.ts:18`, `src/index.ts:88-91`).
- **Durable Object**: ❌ None — stateless server.
- **Agents SDK**: `agents@^0.11.5`.
- **Fresh-McpServer-per-request**: ✅ `createServer(env)` invoked inside `handleAuthenticatedMcp` (`src/index.ts:88`); GHSA-345p-7cg4-v4c7 safe.

### 2.3 Tool Implementation (SDK 1.25+)
- **MCP SDK**: `@modelcontextprotocol/sdk@^1.29.0`.
- **`registerTool()`**: ✅ 5 tools (`src/server.ts:397, 579, 666, 704, 748`).
- **inputSchema**: ✅ ZodRawShapeCompat (`src/schemas/inputs.ts:29-55, 70-77, 87-97, 108-116, 128-138`).
- **outputSchema**: ❌ Not declared on any tool — TS interfaces (`src/schemas/outputs.ts`) used internally but no machine-readable JSON Schema exposed to the client. See §18.2.
- **structuredContent**: ✅ Returned by all tools (`src/server.ts:557, 645, 689, 733, 777`).
- **isError flag**: ✅ Used on hard errors via `asTextResult(..., true)` (`src/server.ts:213, 453, 571, 658, 696, 740, 783`).
- **Tool Naming**: ✅ snake_case (`search_appointments`, `list_other_places`, `lookup_benefit`, `lookup_locality`, `lookup_provider`).

### 2.4 Tool Descriptions (4-Part Pattern)
- **`getToolDescription()`** concatenates all 4 parts (`src/tools/descriptions.ts:140-144`) — see §18.2 for drift vs ads-roi (Part1+Part4 only).
- **Vendor Hiding**: ✅ Only "NFZ" (public Polish gov data source) — no commercial vendor names.
- **Dual-Path Consistency**: N/A — single JWT path.

### 2.5 Centralized Login (panel.wtyczki.ai)
- **USER_SESSIONS KV**: ❌ Not bound (stateless JWT bearer).
- **`is_deleted = 0`**: ✅ enforced in D1 lookup (`src/auth/auth-utils.ts:16`).
- **401 Redirect**: ✅ RFC 9728 `WWW-Authenticate` with `resource_metadata` (`src/well-known.ts:33-39`, `src/index.ts:94-102`).
- **Discovery**: `/.well-known/oauth-protected-resource` (RFC 9728) + `/.well-known/oauth-authorization-server` (RFC 8414).

### 2.6 Prompts (SDK 1.20+)
- **Capability**: ❌ Not declared (`src/server.ts:358` capabilities = `{ tools: {}, resources: { listChanged: true } }`).
- **Count**: 0 (registered) — file `src/optional/prompts/index.ts` is 0 bytes.
- **`registerPrompt()`**: ❌ Not used.
- See §18.2 — prompts are the SEP-2577 sampling replacement; missing here.

---

## 3. Optional Functionalities

### 3.1 Stateful Session
❌ Not Implemented — pure stateless lookups against NFZ API.

### 3.2 Completions
❌ Not Implemented — stub `src/optional/completions/dynamic-enums.ts` is 0 bytes.

### 3.3 Workers AI
❌ Not Implemented.

### 3.4 Workflows & Async
❌ Not Needed — sub-2s external API calls with KV cache.

### 3.5 Rate Limiting
❌ Not Implemented — NFZ ITL API is public, no documented quota.

### 3.6 KV Caching
✅ `CACHE_KV` binding (`wrangler.jsonc:36-42`, ID `fa6ff790f146478e85ea77ae4a5caa4b`); `cacheFirst()` (`src/api-client.ts:142-183`); TTL 24h dictionaries / 1h queues (`src/shared/constants.ts:26-30`); fire-and-forget write (`src/api-client.ts:181`).

### 3.7 R2 Storage
❌ Not Implemented.

### 3.8 ResourceLinks
❌ Not Implemented.

### 3.9 Elicitation
✅ Form mode in `search_appointments`: province picker when both `benefit`+`province` missing (`src/server.ts:103-130, 435-455`); paediatric/adult scope when results mix (`src/server.ts:137-168, 477-497`). Try/catch fallback → `disambiguation_needed` flag for Bedrock-style hosts (`src/server.ts:444, 494`).

### 3.10 Dynamic Tools
❌ Not Implemented.

### 3.11 Tasks (Experimental)
❌ Not Implemented — stubs at `src/optional/tasks/*` unwired (SEP-2663 deferred per `OVERRIDES-spec.md`).

### 3.12 Resources (SEP-1865)
✅ `registerResource()` (`src/server.ts:369-392`); URI `ui://terminy-leczenia/widget`; MIME `text/html;profile=mcp-app`; `_meta.ui.csp.resourceDomains` covers OSM tile subdomains + unpkg + Claude/OpenAI font CDNs (`src/resources/ui-resources.ts:69-81`); `_meta.ui.domain` = stable Claude sandbox SHA-256 (`src/resources/ui-resources.ts:19`); capability `resources: { listChanged: true }` declared (`src/server.ts:358`).

### 3.13 Sampling
❌ Not Implemented (SEP-2577 deprecated).

---

## 4. Tool Inventory

**Total Tools**: 5 (2 widget-linked, 3 LLM-only).

### Tool 1: `search_appointments` (widget)

- **Title**: Search NFZ Appointments
- **Description (verbatim Part 1)**:
> "Searches the public Polish healthcare appointment-queue system for the first available treatment date for a given benefit, optionally filtered by voivodeship, locality, urgency, and paediatric scope."
- **Description (Part 4 constraints, summarised)**: server elicits voivodeship when both `benefit`+`province` missing; returns `did_you_mean[]` on 0-hit benefit; elicits paediatric/adult scope on mixed results when `benefit_for_children` unset; default `case=1` (stable); `case=2` only on explicit "pilny"; max 25 results.

**Input Schema** (`src/schemas/inputs.ts:29-55`):

| Param | Type | Required | Constraints | Example |
|---|---|---|---|---|
| `benefit` | string | optional¹ | 3–250 chars | `KARDIOLOG` |
| `province` | enum `01`-`16` | optional¹ | tuple of 16 codes | `07` |
| `case` | 1 \| 2 | optional | 1=stable, 2=urgent | `1` |
| `locality` | string | optional | ≤250 chars | `WARSZAWA` |
| `benefit_for_children` | boolean | optional | — | `true` |
| `limit` | number | optional | int 1–25, default 10 | `10` |

¹ At least one of `{benefit, province}` required by NFZ API (1200005); server elicits when both missing.

**Output Schema** (`src/schemas/outputs.ts:44-96`, TS-only — see §18.2): `kind`, `query`, `count`, `count_raw_nfz`, `count_skipped_invalid?`, `page`, `total_pages`, `results[]`+`results_no_geo[]`, `data_freshness`, `newest_snapshot`, `banner`, `did_you_mean?[]`, `elicited?{province,scope}`, `disambiguation_needed?{province,scope}`.

**Dual Auth Parity**: N/A (single JWT path). JWT path: `src/index.ts:61-92` → `src/server.ts:397-573`.

**Implementation Notes**: NFZ `/queues` (10s timeout + 1× retry on 5xx, `src/api-client.ts:93-109`); KV cache 1h; skip `dates=null` records (production crash fix 2026-05-17, `src/api-client.ts:312-314`); per-call `_meta.viewUUID` (`src/server.ts:558`); Did-You-Mean 1–4 fallback queries on 0 hits (`src/server.ts:176-199`).
**Behavior Hints**: readOnly=✅, destructive=❌, idempotent=✅, openWorld=✅ (`src/server.ts:403-408`). **Prompt Integration**: ❌ None.

---

### Tool 2: `list_other_places` (widget)

- **Title**: List Other Locations of Same Provider
- **Description (verbatim Part 1)**:
> "Lists every other location where the same healthcare provider offers the same benefit, with each location's distinct first-available date."
- **Part 4**: input is `queue_id` from a `search_appointments` result; only meaningful when `has_other_places=true` (NFZ `many-places='Y'`).

**Input Schema** (`src/schemas/inputs.ts:70-77`):

| Param | Type | Required | Constraints | Example |
|---|---|---|---|---|
| `queue_id` | string | ✅ | min 1 (UUID) | `51fce308-2de6-0c37-…` |

**Output Schema** (`src/schemas/outputs.ts:101-109`): `kind: "other-places"`, `benefit`, `provider`, `origin_queue_id`, `places[]`, `data_freshness`.

**Dual Auth Parity**: N/A. JWT path: `src/server.ts:579-661`.

**Implementation Notes**: NFZ `/many-places/{id}` (`src/api-client.ts:236-241`); KV cache 1h; inherits `benefit`/`provider` from parent; ❌ no `_meta.viewUUID` (§18.1).
**Behavior Hints**: readOnly=✅, destructive=❌, idempotent=✅, openWorld=✅ (`src/server.ts:585-590`). **Prompt Integration**: ❌ None.

---

### Tool 3: `lookup_benefit` (LLM-only)

- **Title**: Lookup NFZ Benefit Name
- **Description (verbatim Part 1)**:
> "Returns the official Polish healthcare benefit names matching a substring query — required precondition for search_appointments because the queue API only matches dictionary entries, not freeform terms."
- **Part 4**: query ≥3 chars; NFZ dictionary uses DEPARTMENT/CLINIC names ("ODDZIAŁ X", "PORADNIA Y"), not procedure names — translate lay terms before querying.

**Input** (`src/schemas/inputs.ts:87-97`): `query` (3–250, req), `limit` (1–25, opt). **Output**: `{kind:"lookup", entity:"benefit", results:string[]}`. **JWT path**: `src/server.ts:666-699`. **Notes**: KV cache 24h; NFZ `/benefits`. **Hints**: readOnly=✅, idempotent=✅, openWorld=✅. **Prompt**: ❌.

---

### Tool 4: `lookup_locality` (LLM-only)

- **Title**: Lookup NFZ Locality Name
- **Description (verbatim Part 1)**:
> "Returns Polish locality names from the NFZ dictionary matching a substring within a specified voivodeship — needed to disambiguate city vs district before passing to search_appointments."
- **Part 4**: city districts are separate entries (e.g. WARSZAWA vs WARSZAWA MOKOTÓW); query ≥3 chars; province required.

**Input** (`src/schemas/inputs.ts:108-116`): `query` (3–250, req), `province` (enum, req), `limit` (1–25, opt). **Output**: `{kind:"lookup", entity:"locality", results:string[]}`. **JWT path**: `src/server.ts:704-743`. **Notes**: KV cache 24h; NFZ `/localities`. **Hints**: readOnly=✅, idempotent=✅, openWorld=✅. **Prompt**: ❌.

---

### Tool 5: `lookup_provider` (LLM-only)

- **Title**: Lookup NFZ Healthcare Provider
- **Description (verbatim Part 1)**:
> "Returns Polish healthcare-provider names from the NFZ dictionary matching a substring within a specified voivodeship."
- **Part 4**: query ≥3 chars; province required; NFZ has no direct provider→queues filter — use the returned name as a filter applied to `search_appointments` output (see §18.6).

**Input** (`src/schemas/inputs.ts:128-138`): `query` (3–250, req), `province` (enum, req), `limit` (1–25, opt). **Output**: `{kind:"lookup", entity:"provider", results:string[]}`. **JWT path**: `src/server.ts:748-787`. **Notes**: KV cache 24h; NFZ `/providers`; Part4 references unimplemented `provider` param (§18.6). **Hints**: readOnly=✅, idempotent=✅, openWorld=✅. **Prompt**: ❌.

---

## 5. UX & Frontend Quality

### Pillar I: Identity & First Impression
- Unique server name ✅; server/tool icons ❌; all 5 tools provide `title` ✅. Descriptions long (~180 w on `search_appointments`) — verbose vs ads-roi's ≤40-word ceiling.

### Pillar II: Model Control & Quality
- `server-instructions.ts`: 57 lines / ~580 tokens — above 500-token target (§18.4). Covers usage, disambiguation, response format, interaction boundaries, performance, out-of-scope.
- `inputs.ts` fields all use `.meta({ description })` ✅. ❌ No `outputSchema` on any tool.

### Pillar III: Interactivity & Agency
- Completions ❌; Elicitation (Form, 2 fields) ✅ + `disambiguation_needed` fallback; Sampling ❌; Prompts ❌; Multi-modal ❌.

### Pillar IV: Context & Data Management
- Resource URI predeclared ✅; `_meta.ui.csp.resourceDomains` (8 entries incl. wildcard) ✅; `_meta.ui.domain` = stable Claude sandbox SHA-256 ✅; `prefersBorder: false` ✅; `_meta.ui.icon`/`priority`/`permissions` ❌. ResourceLinks/subscriptions ❌.

### Pillar V: Media & Content Handling
- MIME `text/html;profile=mcp-app` ✅; OSM tiles + Leaflet (unpkg) over HTTPS; audio/image/data-URI/audience ❌ N/A.

### Pillar VI: Operations & Transparency
- Structured `tool_started`+`tool_completed` on widget tools (`src/server.ts:422-429, 546-553, 599-606, 634-641`); `tool_failed` via `nfzErrorResult` + catch (`src/server.ts:208-212, 562-566`); `cache_operation`+`api_call` from `cacheFirst()` (`src/api-client.ts:150-179`); `transport_request`+`server_error` (`src/index.ts:49, 74`).
- 3 `lookup_*` tools omit start/completed pairs — §18.6.

---

## 6. Deployment Status

### 6.1 Consistency Tests
- **Command**: `bash scripts/audit/audit-server-patterns.sh terminy-leczenia`
- **Result**: ✅ "All checks passed! Server matches reference patterns."

### 6.2 TypeScript Compilation
- **Command**: `npx tsc --noEmit`
- **Result**: ✅ Exit code 0 — no errors.

### 6.3 Production URL
- **Primary Domain**: https://terminy-leczenia.wtyczki.ai (`wrangler.jsonc:48-53`, `custom_domain: true`).
- **`workers_dev`**: ❌ Disabled (`wrangler.jsonc:55`).

---

## 7. Infrastructure Components

- **Cloudflare Assets**: `ASSETS` → `./web/dist/widgets`; build `npm install && npm run build:widgets && npx tsc --noEmit` (`wrangler.jsonc:15-17`).
- **Durable Objects**: ❌ None.
- **KV Namespaces**: `CACHE_KV` (id `fa6ff790f146478e85ea77ae4a5caa4b`, preview `4b37112559f2429191633d98781645ca`) — NFZ response cache.
- **D1**: binding `DB`, name `mcp-oauth`, ID `eac93639-d58e-4777-82e9-f1e28113d5b2`; tables: `users` (`user_id`, `email`, `workos_user_id`, `is_deleted`).
- **R2 Storage**: ❌ Not configured.
- **Workers AI**: ❌ Not configured.
- **AI Gateway**: ❌ Not configured (binding declared optional `AI_GATEWAY_ID?` in `types.ts:71`, unset).
- **Workflows**: ❌ Not configured.
- **Public Vars**: `AUTHKIT_DOMAIN = "exciting-domain-65.authkit.app"` (`wrangler.jsonc:44-46`).
- **Required Secrets (shared)**: ❌ None — `WORKOS_*` MUST NOT be set on resource servers (per `lesson_workos_secrets.md`).
- **Server-Specific Secrets**: ❌ None — NFZ ITL API is public/anonymous.

---

## 8. Architecture Patterns

### Authentication Architecture
- JWT-only (AuthKit bearer). Flow: `POST /mcp` → `verifyJwt` (issuer-bound, JWKS-cached) → `getUserByWorkosId` (D1, `is_deleted=0`) → `createMcpHandler(server, { authContext: { props } })`. 401 carries RFC 9728 `WWW-Authenticate`.

### Caching Strategy
- KV cache-first wrapper (`src/api-client.ts:142-183`): GET-only, JSON, fire-and-forget write.
- Dictionary lookups: 24h TTL; queue results: 1h TTL; `/version`: 24h.
- JWKS implicitly cached by `jose.createRemoteJWKSet` for isolate lifetime.

### Concurrency Control
- N/A — stateless server; per-call fresh `McpServer`.

### Storage Architecture
- No durable state. Per-call `_meta.viewUUID` on `search_appointments` keys widget localStorage; missing on `list_other_places` (§18.1).

---

## 9. Code Quality

### Type Safety
- TS strict ✅; Zod 4 via `zod/v4` subpath ✅; `.meta({ description })` everywhere (no `.describe()`).
- Output types: TS interfaces (`schemas/outputs.ts`) only — no `outputSchema` registered (§18.2).

### Error Handling
- NFZ HTTP 400 → typed `NfzApiError`, 17 codes mapped (`src/api-client.ts:35-67`); info codes (1200038 sanatorium, 1200055 referring-doctor) flagged `is_info=true`.
- 5xx → 1× 500ms-delayed retry then `tymczasowo niedostępne` (`src/api-client.ts:106-131`).
- `dates=null` records skipped with `count_skipped_invalid` (`src/api-client.ts:312-314`).
- D1 lookup uses ad-hoc `console.error` (§18.3); JWT verify swallows reason via bare catch (§18.3).

### Observability
- Cloudflare Observability enabled (`wrangler.jsonc:57-59`).
- Log events (per `shared/logger.ts`): `transport_request`, `tool_started`, `tool_completed`, `tool_failed`, `cache_operation`, `api_call`, `server_error`.
- 3 lookup tools skip start/completed pair (§18.6).

---

## 10. Technical Specifications

### Performance
- NFZ cold <2 s (10s timeout); warm KV <500 ms; JWT verify ~10–50 ms.
- Cache TTLs: 24h dictionaries / 1h queues / 24h version. Did-You-Mean: up to 4 cached `/benefits` on 0-result.

### Dependencies — Common
```json
{
  "@modelcontextprotocol/ext-apps": "^1.7.0",
  "@modelcontextprotocol/sdk": "^1.29.0",
  "agents": "^0.11.5",
  "jose": "^6.1.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "zod": "^4.1.13"
}
```

### Dependencies — Widget-Specific
```json
{
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.12",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0"
}
```

### Dependencies — Development
```json
{ "@cloudflare/workers-types": "^4.20250101.0", "@types/react": "^19.2.2",
  "@vitejs/plugin-react": "^4.3.4", "autoprefixer": "^10.4.20", "concurrently": "^9.2.1",
  "cross-env": "^7.0.3", "postcss": "^8.4.49", "tailwindcss": "^3.4.17", "typescript": "^5.9.3",
  "vite": "^6.0.6", "vite-plugin-singlefile": "^2.3.0", "wrangler": "^4.45.3" }
```

### SDK Versions
- MCP SDK `^1.29.0` · ext-apps `^1.7.0` · agents `^0.11.5` · jose `^6.1.0` · zod `^4.1.13` (`zod/v4`).
- vite `^6.0.6` (skeleton/ads-roi is on `^7.3.0` — minor drift, not blocking).

---

## 11. Compliance Summary

| Check | Status | Notes |
|---|---|---|
| Vendor Hiding | ✅ | Only public NFZ data source named |
| Dual Auth Parity | N/A | JWT-only by design |
| 4-Part Descriptions | ⚠️ | All 4 parts concatenated (long); ads-roi uses 1+4 |
| Custom Domain | ✅ | terminy-leczenia.wtyczki.ai |
| Workers.dev Disabled | ✅ | `workers_dev: false` |
| Consistency Tests | ✅ | audit-server-patterns.sh clean |
| TypeScript Compilation | ✅ | `tsc --noEmit` exit 0 |
| Prompts Implemented | ❌ | 0 prompts; `optional/prompts/index.ts` empty |
| Zod Schema Shape | ✅ | Plain object (ZodRawShapeCompat) |
| Tool Naming | ✅ | snake_case |
| Error Handling | ✅ | 17 NFZ codes mapped, info-vs-error split |
| Color-scheme Meta | ✅ | `web/widgets/widget.html:6` |
| Cross-env Build | ✅ | `cross-env INPUT=…` |
| Fresh-McpServer Pattern | ✅ | `createServer(env)` per request |
| `_meta.ui.resourceUri` (v0.4.0+) | ✅ | Both widget tools nested form |
| `outputSchema` on tools | ❌ | Not declared — TS-only output types |
| Widget `h-[500px]` + `sendSizeChanged` | ✅ | `widget.tsx:724`, `widget.tsx:563` |
| Real `duration_ms` | ✅ | `Date.now()` deltas on widget tools |
| `applyHostStyleVariables` + `applyHostFonts` | ✅ | `widget.tsx:515-516` |
| `server-instructions.ts` ≤500 tokens | ⚠️ | ~580 tokens (§18.4) |
| JWT `audience` claim validation | N/A | Intentionally not asserted (`lesson_jwt_audience_impossible`) |
| Structured `auth_attempt` log on failure | ❌ | Bare `catch {}` (§18.3) |

---

## 12. Unique Architectural Features

### Server-Side "Did You Mean" In a Single Tool Call
- `search_appointments` runs `lookup_benefit` up to 4× internally on 0-result + freeform `benefit` (`src/server.ts:176-199, 521-525`); collapses a 2-call LLM round-trip into one response with `did_you_mean[]`. Amortized by 24h KV cache on `/benefits`.

### Dual-Top Result Segregation
- When results mix adult and paediatric and elicit didn't fire, summary pre-splits into "👤 DLA DOROSŁYCH" / "👶 DLA DZIECI" sections (`src/server.ts:269-281`) — LLM avoids re-scanning.

### Graceful Elicitation Fallback (host-capability detection)
- `tryElicitProvince`/`tryElicitScope` return `null` on host-unsupported or decline (`src/server.ts:103-168`); server falls through to `disambiguation_needed` so widget renders inline buttons. Single code path covers Claude (elicit) + Bedrock (widget).

---

## 13. Known Issues & Limitations

1. No tool/server icons.
2. `outputSchema` not declared on any tool — TS-only.
3. NFZ has no provider→queues lookup (`lookup_provider` Part4 references unimplemented param).
4. NFZ `dates=null` queues dropped — surfaced via `count_skipped_invalid` but unreachable.
5. No unit/integration tests; manual checklist only.
6. `verifyJwt` bare `catch {}` — no `auth_attempt` log on failure.
7. `list_other_places` returns no `_meta.viewUUID` (drawer state un-keyable).
8. `resources: { listChanged: true }` advertised but never emitted.
9. CSP `resourceDomains` wildcard `https://*.oaistatic.com` — sandbox support unverified.

---

## 14. Future Roadmap

### Planned Components
- Register at least one prompt (e.g. `/find-appointment`) — closes SEP-2577 gap.
- Add `outputSchema` on all 5 tools; add `_meta.viewUUID` to `list_other_places`.
- Replace `verifyJwt` bare-catch with structured `auth_attempt` log event.

### Planned Use Cases
- Provider-name filter on `search_appointments` once NFZ exposes the param.
- Queue-snapshot "watchlist" (requires DO + workflow; not started).

---

## 15. Testing Status

### Unit Tests / Integration Tests
❌ Not implemented.

### Manual Testing Checklist
- [x] JWT flow (AuthKit-issued bearer)
- [x] `search_appointments` with explicit benefit + province
- [x] Province-elicit form (Claude Code)
- [x] Scope-elicit form (paediatric/adult mix)
- [x] `list_other_places` drawer
- [x] Did-You-Mean path (typo benefit term)
- [ ] Elicitation fallback (`disambiguation_needed`) on Bedrock-style host
- [ ] Account-deleted user (D1 `is_deleted = 1`)

---

## 16. Documentation Status

- README ❌ · Setup ❌ · Troubleshooting ❌ · Improvement Ideas ❌.
- `server-instructions.ts` ⚠️ (~580 tokens, §18.4); Deployment ✅ `docs/DEPLOYMENT_CHECKLIST.md`; Auth ✅ `docs/PANEL_AUTH_CONTRACT.md`; Server docs ✅ `docs/server-docs.md`; Audit ✅ `SERVER_AUDIT_REPORT.md`.

---

## 17. File Structure

### `src/`
```
src/
├── index.ts                   # JWT pre-handler + createMcpHandler dispatch
├── server.ts                  # createServer; 5 tools, 1 resource; elicit helpers
├── server-instructions.ts     # System prompt (~580 tokens — over target)
├── well-known.ts              # RFC 9728 + RFC 8414 + WWW-Authenticate
├── api-client.ts              # NfzClient (KV cache + retry + error map) + normalizers
├── types.ts                   # Env (ASSETS, DB, AUTHKIT_DOMAIN, CACHE_KV)
├── auth/{jwt-verify,auth-utils}.ts
├── helpers/assets.ts          # loadHtml(env.ASSETS, …)
├── resources/ui-resources.ts  # UI_RESOURCES + CSP + sandbox domain
├── schemas/{inputs,outputs,nfz}.ts
├── shared/{constants,logger}.ts
├── tools/{descriptions,index}.ts
└── optional/                  # all stubs unwired; 3 are 0-byte (see §18.6)
```

### `web/widgets/`
```
web/widgets/
├── widget.html                 # color-scheme meta + viewport meta
└── widget.tsx                  # Leaflet map + list + filter buttons (845 lines)
```

### Configuration Files
- `wrangler.jsonc` — ASSETS, D1, CACHE_KV, AUTHKIT_DOMAIN, terminy-leczenia.wtyczki.ai route.
- `package.json` — SDK ^1.29.0, ext-apps ^1.7.0, agents ^0.11.5, leaflet ^1.9.4.
- `tsconfig.json` — server TS config.
- `vite.config.ts` — root=`web/`, viteSingleFile, `emptyOutDir: false`.
- `tailwind.config.js`, `postcss.config.js`.

### Common Scripts
```json
{ "dev": "wrangler dev",
  "dev:widget": "cross-env INPUT=widgets/widget.html vite build --watch",
  "dev:full": "concurrently \"npm run dev\" \"npm run dev:widget\"",
  "build:widget": "cross-env INPUT=widgets/widget.html vite build",
  "build:widgets": "npm run build:widget", "deploy": "npm run build:widgets && wrangler deploy",
  "type-check": "tsc --noEmit", "pre-commit": "npm run type-check && npm run build:widgets" }
```

---

**End of Snapshot**

---

## Appendix A: Two-Part Registration Snippet

**Part 1 — Register Resource** (`src/server.ts:369-392`, abbreviated):
```typescript
server.registerResource(
  "widget",
  widgetResource.uri,                        // "ui://terminy-leczenia/widget"
  {
    mimeType: RESOURCE_MIME_TYPE,
    description: widgetResource.description,
    _meta: { ui: widgetResource._meta.ui! }, // informational
  },
  async () => {
    const html = await loadHtml(env.ASSETS, "/widget.html");
    return {
      contents: [{
        uri: widgetResource.uri,
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        _meta: widgetResource._meta as Record<string, unknown>, // load-bearing CSP/domain
      }],
    };
  },
);
```

**Part 2 — Register Tool** (`src/server.ts:397-410`, abbreviated):
```typescript
server.registerTool("search_appointments", {
  title: TOOL_METADATA.search_appointments.title,
  description: getToolDescription("search_appointments"),
  inputSchema: SearchAppointmentsInput,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true, destructiveHint: false },
  _meta: { ui: { resourceUri: widgetResource.uri } },  // nested v0.4.0+
}, async (args) => { /* ... abbreviated */ });
```

---

## Appendix B: AnythingLLM Configuration

```json
{
  "mcpServers": {
    "terminy-leczenia": {
      "url": "https://terminy-leczenia.wtyczki.ai/mcp",
      "transport": "http",
      "headers": { "Authorization": "Bearer <AUTHKIT_JWT>" }
    }
  }
}
```
JWT-only since 2026-05-18. Obtain bearer via OAuth 2.1 flow against `https://exciting-domain-65.authkit.app`.

---

## Appendix C: Architecture Pattern Match

**Stateless External API + Widget + Elicitation**: stateless Worker proxies NFZ ITL Open Data through KV cache; widget is a Leaflet map; elicitation collects province/scope when ambiguous; no DO, no sampling. Closest peer is a "map-server" pattern with companion `lookup_*` tools chained via description rules.

---

## Appendix D: Quick Commands

### Development
```bash
cd projects/terminy-leczenia
npm run dev           # wrangler dev (server)
npm run dev:widget    # vite --watch on widget.html
npm run dev:full      # both
npm run type-check    # tsc --noEmit
```

### Build & Deploy
```bash
npm run build:widgets
git push              # Workers Builds deploys (per CLAUDE.md rule #1)
```

### Secrets
❌ None. `AUTHKIT_DOMAIN` is a public var; NFZ API is anonymous. `WORKOS_*` MUST NOT be set here.

### Testing
```bash
bash scripts/audit/audit-server-patterns.sh terminy-leczenia
cd projects/terminy-leczenia && npx tsc --noEmit
npm run probe:protocol -- https://terminy-leczenia.wtyczki.ai/mcp <jwt>
```

---

## 18. Recommendations

### 18.1 Likely Bugs
- **[LOW]** `list_other_places` response omits `_meta: { viewUUID }` (`src/server.ts:643-646`); `search_appointments` includes it (`src/server.ts:558`). Drawer state restore breaks. Add `_meta: { viewUUID: crypto.randomUUID() }`.
- **[LOW]** `count_raw_nfz`/`renderableCount` math (`src/server.ts:513-514`) assumes NFZ `meta.count` is full result-set; if it's per-page, `rawNfzCount - skippedInvalid` double-discounts. Verify against NFZ docs.
- **[LOW]** `findDidYouMean` (`src/server.ts:176-199`) does not dedupe `q === benefit` against the upstream `searchQueues` call already made — first fallback query repeats the failed term.

### 18.2 Spec / Convention Drift
- **[MED]** No `outputSchema` declared on any tool. SDK 1.25+ recommends Zod outputSchema so clients validate `structuredContent`. `src/schemas/outputs.ts` is TS-only.
- **[MED]** 0 prompts (`src/optional/prompts/index.ts` empty). Prompts are the SEP-2577 sampling substitute and the only slash-command surface; ads-roi ships 2 as reference.
- **[LOW]** Tool descriptions concatenate all 4 parts (`src/tools/descriptions.ts:143`) → ~180 w on `search_appointments`. Repo convention is Part1+Part4 only.
- **[LOW]** `resources: { listChanged: true }` declared (`src/server.ts:358`) but no notification ever emitted. Drop unless a dynamic-resource feature lands.
- **[LOW]** `prompts` capability not declared (`src/server.ts:358`) — add `prompts: { listChanged: true }` once any prompt lands.
- **[LOW]** `src/types.ts:7` retains skeleton TODO "Replace {{SERVER_ID}} placeholders" — strip.

### 18.3 Security & Auth Concerns
- **[MED]** `verifyJwt` bare `catch {}` (`src/auth/jwt-verify.ts:33-35`) swallows expiry/signature/unknown-issuer. Per `security-patterns.md §2`, emit `logger.warn({ event:'auth_attempt', success:false, reason })`.
- **[LOW]** `getUserByWorkosId` (`src/auth/auth-utils.ts:21`) uses `console.error('[Auth] …')` instead of typed logger. Switch to `auth_attempt` event.
- **[LOW]** CSP `resourceDomains` wildcard `https://*.oaistatic.com` (`src/resources/ui-resources.ts:80`) — sandbox wildcard support undocumented; enumerate concrete subdomains.

### 18.4 Performance & Cost
- **[LOW]** `server-instructions.ts` ≈580 tokens — over 500-token target. Trim "Interaction Boundaries" + "Out of Scope".
- **[LOW]** `findDidYouMean` (`src/server.ts:176-199`) issues up to 4 cold-cache NFZ calls on every 0-result query. Acceptable; flag if NFZ tightens quotas.
- **[LOW]** `cacheFirst` uses `void kv.put(...)` without `ctx.waitUntil` (`src/api-client.ts:181`); on cold-start the put can be reaped. Plumb `ctx.waitUntil`.

### 18.5 UX / Frontend
- **[LOW]** `disambiguation_needed` hint string in `summarizeResults` (`src/server.ts:331-339`) is English embedded in an otherwise-Polish chat reply — violates `feedback_polish_market`. Translate to PL.

### 18.6 Dead Code / Stale Stubs
- **[LOW]** 3 stub files 0-byte: `src/optional/{completions/dynamic-enums.ts, elicitation/forms.ts, prompts/index.ts}`. Delete.
- **[LOW]** `src/optional/{tasks,resources,ui}/*` unwired (SEP-2663 deferred per `OVERRIDES-spec.md`). Mark or delete.
- **[LOW]** 3 `lookup_*` tools omit `tool_started`/`tool_completed` log pairs (`src/server.ts:679, 717, 761`). Add for observability parity.
- **[LOW]** `lookup_provider` Part4 references a future `provider` param on `search_appointments` that doesn't exist (`src/tools/descriptions.ts:127`). Remove forward reference.
- **[LOW]** `ResponseFormat` enum (`src/types.ts:92-104`) defined, never imported. Dead — delete.
