/**
 * MCP Server Factory for Terminy Leczenia NFZ — Cloudflare canonical pattern.
 *
 * createServer(env) returns a fresh McpServer per request. Transport layer
 * (createMcpHandler in src/index.ts) handles JSON-RPC dispatch via
 * WorkerTransport (Streamable HTTP, March 2025 spec). GHSA-345p-7cg4-v4c7 safe.
 *
 * Auth context (userId, email) populated by createMcpHandler from authContext
 * option in src/index.ts; tools access it via getMcpAuthContext().
 *
 * Five tools — 2 with widget, 3 LLM-only (canonical map-server chain pattern).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { getMcpAuthContext } from "agents/mcp";

import type { Env } from "./types";
import { SERVER_CONFIG, PROVINCE_NAMES } from "./shared/constants";
import { UI_RESOURCES } from "./resources/ui-resources";
import { loadHtml } from "./helpers/assets";
import { SERVER_INSTRUCTIONS } from "./server-instructions";
import { logger } from "./shared/logger";
import { TOOL_METADATA, getToolDescription } from "./tools/descriptions";

import {
  SearchAppointmentsInput,
  ListOtherPlacesInput,
  LookupBenefitInput,
  LookupLocalityInput,
  LookupProviderInput,
  type SearchAppointmentsParams,
  type ListOtherPlacesParams,
  type LookupBenefitParams,
  type LookupLocalityParams,
  type LookupProviderParams,
} from "./schemas/inputs";

import type {
  SearchAppointmentsOutput,
  ListOtherPlacesOutput,
  ErrorOutput,
  NormalizedQueueResult,
} from "./schemas/outputs";

import {
  NfzClient,
  normalizeQueueAttributes,
  normalizeManyPlacesQueue,
} from "./api-client";
import { NfzApiError } from "./schemas/nfz";

// ============================================================================
// Helpers
// ============================================================================

function getAuth(): { userId: string; email: string } {
  const auth = getMcpAuthContext();
  return {
    userId: (auth?.props?.userId as string | undefined) ?? "anonymous",
    email: (auth?.props?.email as string | undefined) ?? "",
  };
}

function asTextResult(text: string, structured: Record<string, unknown>, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: structured,
    isError,
  };
}

/**
 * Map NfzApiError → user-facing tool result. Info codes (e.g., sanatorium redirect)
 * are returned as non-error responses with kind="error", is_info=true so the LLM
 * can relay them to the user.
 */
function nfzErrorResult(err: NfzApiError, toolName: string): ReturnType<typeof asTextResult> {
  const output: ErrorOutput = {
    kind: "error",
    is_info: err.isInfo,
    code: err.code,
    message: err.userMessage,
  };
  logger.warn({
    event: "tool_failed",
    tool: toolName,
    error: `NFZ ${err.code}: ${err.userMessage}`,
  });
  return asTextResult(err.userMessage, output as unknown as Record<string, unknown>, !err.isInfo);
}

function summarizeResults(out: SearchAppointmentsOutput): string {
  if (out.count === 0) {
    const filters = [
      out.query.benefit ? `świadczenie: "${out.query.benefit}"` : null,
      out.query.province ? `woj.: ${PROVINCE_NAMES[out.query.province] ?? out.query.province}` : null,
      out.query.locality ? `miejscowość: ${out.query.locality}` : null,
      out.query.case === 2 ? "case: pilny" : null,
      out.query.benefit_for_children ? "dla dzieci" : null,
    ].filter(Boolean).join(", ");
    return `Brak wyników dla podanych filtrów (${filters || "—"}). ` +
      `Spróbuj złagodzić filtry lub użyć lookup_benefit aby znaleźć poprawną nazwę świadczenia.`;
  }

  const top = [...out.results, ...out.results_no_geo].slice(0, 3);
  const lines = top.map((r, i) => {
    const days = r.wait_days_from_today;
    const when =
      days <= 0 ? "dziś" : days === 1 ? "za 1 dzień" : `za ${days} dni`;
    const provider = r.provider.length > 60 ? r.provider.slice(0, 57) + "..." : r.provider;
    return `${i + 1}. ${r.wait_date} (${when}) — ${provider}, ${r.place}, ${r.locality}` +
      (r.has_other_places ? " [⊕ inne miejsca dostępne]" : "");
  });

  const total = out.count;
  const shown = out.results.length + out.results_no_geo.length;
  const footer =
    `\nZnaleziono ${total} kolejek, pokazano ${shown}. ` +
    `Pełne wyniki + mapa dostępne w interaktywnym widgecie. Dane aktualne na: ${out.data_freshness}.`;

  return lines.join("\n") + footer;
}

// ============================================================================
// Server factory
// ============================================================================

export function createServer(env: Env): McpServer {
  const server = new McpServer(
    { name: SERVER_CONFIG.NAME, version: SERVER_CONFIG.VERSION },
    {
      capabilities: { tools: {}, resources: { listChanged: true } },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  const nfz = new NfzClient(env.CACHE_KV);
  const widgetResource = UI_RESOURCES.widget;

  // ========================================================================
  // UI Resource — widget HTML with CSP on contents[] entry
  // ========================================================================
  server.registerResource(
    "widget",
    widgetResource.uri,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: widgetResource.description,
      // _meta here is informational; CSP/domain placement that actually counts is
      // on the contents[] entry returned by the handler below.
      _meta: { ui: widgetResource._meta.ui! },
    },
    async () => {
      const html = await loadHtml(env.ASSETS, "/widget.html");
      return {
        contents: [
          {
            uri: widgetResource.uri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: widgetResource._meta as Record<string, unknown>,
          },
        ],
      };
    },
  );

  // ========================================================================
  // Tool 1 — search_appointments (widget)
  // ========================================================================
  server.registerTool(
    "search_appointments",
    {
      title: TOOL_METADATA.search_appointments.title,
      description: getToolDescription("search_appointments"),
      inputSchema: SearchAppointmentsInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: { ui: { resourceUri: widgetResource.uri } },
    },
    async (args) => {
      const params = args as SearchAppointmentsParams;
      const auth = getAuth();
      const actionId = crypto.randomUUID();
      const start = Date.now();

      logger.info({
        event: "tool_started",
        tool: "search_appointments",
        user_id: auth.userId,
        user_email: auth.email,
        action_id: actionId,
        args: params as unknown as Record<string, unknown>,
      });

      // Preempt NFZ HTTP 400 (error 1200005) — at least one of {benefit, province} required.
      if (!params.benefit && !params.province) {
        const err: ErrorOutput = {
          kind: "error",
          is_info: false,
          code: 1200005,
          message:
            "Provide 'benefit' or 'province' — at least one is required. " +
            "Use lookup_benefit to find an exact NFZ benefit name.",
        };
        return asTextResult(err.message, err as unknown as Record<string, unknown>, true);
      }

      try {
        const response = await nfz.searchQueues({
          benefit: params.benefit,
          province: params.province,
          case: params.case ?? 1,
          locality: params.locality,
          benefitForChildren: params.benefit_for_children,
          limit: params.limit ?? 10,
          page: 1,
        });

        const normalized = response.data.map((q) => normalizeQueueAttributes(q.id, q.attributes));
        const results = normalized.filter(
          (r): r is NormalizedQueueResult & { latitude: number; longitude: number } =>
            r.latitude !== null && r.longitude !== null,
        );
        const results_no_geo = normalized.filter((r) => r.latitude === null || r.longitude === null);

        const newestSnapshot = normalized
          .map((r) => r.snapshot_date)
          .sort()
          .reverse()[0] ?? null;

        const totalCount = response.meta.count ?? normalized.length;
        const limit = response.meta.limit ?? (params.limit ?? 10);
        const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;

        const output: SearchAppointmentsOutput = {
          kind: "search",
          query: { ...params, case: params.case ?? 1 },
          count: totalCount,
          page: response.meta.page ?? 1,
          total_pages: totalPages,
          results,
          results_no_geo,
          data_freshness: response.meta["date-modified"],
          newest_snapshot: newestSnapshot,
          banner: response.meta.message,
        };

        logger.info({
          event: "tool_completed",
          tool: "search_appointments",
          user_id: auth.userId,
          user_email: auth.email,
          action_id: actionId,
          duration_ms: Date.now() - start,
        });

        return {
          content: [{ type: "text" as const, text: summarizeResults(output) }],
          structuredContent: output as unknown as Record<string, unknown>,
          _meta: { viewUUID: crypto.randomUUID() },
        };
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "search_appointments");
        logger.error({
          event: "tool_failed",
          tool: "search_appointments",
          error: err instanceof Error ? err.message : String(err),
        });
        return asTextResult(
          `Błąd wyszukiwania: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 2 — list_other_places (widget inline)
  // ========================================================================
  server.registerTool(
    "list_other_places",
    {
      title: TOOL_METADATA.list_other_places.title,
      description: getToolDescription("list_other_places"),
      inputSchema: ListOtherPlacesInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: { ui: { resourceUri: widgetResource.uri } },
    },
    async (args) => {
      const params = args as ListOtherPlacesParams;
      const auth = getAuth();
      const actionId = crypto.randomUUID();
      const start = Date.now();

      logger.info({
        event: "tool_started",
        tool: "list_other_places",
        user_id: auth.userId,
        user_email: auth.email,
        action_id: actionId,
        args: params as unknown as Record<string, unknown>,
      });

      try {
        const response = await nfz.getManyPlaces(params.queue_id);
        const parent = {
          benefit: response.data.attributes.benefit,
          provider: response.data.attributes.provider,
        };
        const places = response.data.attributes.places.map((p) =>
          normalizeManyPlacesQueue(p.id, p.attributes, parent),
        );

        const output: ListOtherPlacesOutput = {
          kind: "other-places",
          benefit: parent.benefit,
          provider: parent.provider,
          origin_queue_id: params.queue_id,
          places,
          data_freshness: response.meta["date-modified"],
        };

        const summary =
          `${places.length} miejsc tego samego świadczeniodawcy "${parent.provider.slice(0, 50)}" ` +
          `oferujących "${parent.benefit}". Najbliższy termin: ` +
          (places.length > 0
            ? `${places.reduce((a, b) => (a.wait_date < b.wait_date ? a : b)).wait_date}.`
            : "—.");

        logger.info({
          event: "tool_completed",
          tool: "list_other_places",
          user_id: auth.userId,
          user_email: auth.email,
          action_id: actionId,
          duration_ms: Date.now() - start,
        });

        return {
          content: [{ type: "text" as const, text: summary }],
          structuredContent: output as unknown as Record<string, unknown>,
        };
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "list_other_places");
        logger.error({
          event: "tool_failed",
          tool: "list_other_places",
          error: err instanceof Error ? err.message : String(err),
        });
        return asTextResult(
          `Błąd: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 3 — lookup_benefit (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_benefit",
    {
      title: TOOL_METADATA.lookup_benefit.title,
      description: getToolDescription("lookup_benefit"),
      inputSchema: LookupBenefitInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupBenefitParams;
      try {
        const response = await nfz.listBenefits({ name: params.query, limit: params.limit ?? 10 });
        const names = response.data;
        const text =
          names.length === 0
            ? `Brak świadczeń pasujących do "${params.query}". Spróbuj krótszej frazy lub innego słowa.`
            : `Znaleziono ${response.meta.count ?? names.length} świadczeń (pokazano ${names.length}):\n` +
              names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "benefit", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_benefit");
        return asTextResult(
          `Błąd słownika świadczeń: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 4 — lookup_locality (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_locality",
    {
      title: TOOL_METADATA.lookup_locality.title,
      description: getToolDescription("lookup_locality"),
      inputSchema: LookupLocalityInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupLocalityParams;
      try {
        const response = await nfz.listLocalities({
          name: params.query,
          province: params.province,
          limit: params.limit ?? 10,
        });
        const names = response.data;
        const provinceName = PROVINCE_NAMES[params.province] ?? params.province;
        const text =
          names.length === 0
            ? `Brak miejscowości pasujących do "${params.query}" w woj. ${provinceName}.`
            : `Miejscowości w woj. ${provinceName} pasujące do "${params.query}" ` +
              `(${response.meta.count ?? names.length} total, pokazano ${names.length}):\n` +
              names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "locality", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_locality");
        return asTextResult(
          `Błąd słownika miejscowości: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  // ========================================================================
  // Tool 5 — lookup_provider (LLM-only)
  // ========================================================================
  server.registerTool(
    "lookup_provider",
    {
      title: TOOL_METADATA.lookup_provider.title,
      description: getToolDescription("lookup_provider"),
      inputSchema: LookupProviderInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      const params = args as LookupProviderParams;
      try {
        const response = await nfz.listProviders({
          name: params.query,
          province: params.province,
          limit: params.limit ?? 10,
        });
        const names = response.data;
        const provinceName = PROVINCE_NAMES[params.province] ?? params.province;
        const text =
          names.length === 0
            ? `Brak świadczeniodawców pasujących do "${params.query}" w woj. ${provinceName}.`
            : `Świadczeniodawcy w woj. ${provinceName} pasujący do "${params.query}" ` +
              `(${response.meta.count ?? names.length} total, pokazano ${names.length}):\n` +
              names.map((n, i) => `${i + 1}. ${n}`).join("\n");
        return asTextResult(text, { kind: "lookup", entity: "provider", results: names });
      } catch (err) {
        if (err instanceof NfzApiError) return nfzErrorResult(err, "lookup_provider");
        return asTextResult(
          `Błąd słownika świadczeniodawców: ${err instanceof Error ? err.message : String(err)}`,
          { kind: "error", is_info: false, code: 0, message: String(err) } as Record<string, unknown>,
          true,
        );
      }
    },
  );

  return server;
}
