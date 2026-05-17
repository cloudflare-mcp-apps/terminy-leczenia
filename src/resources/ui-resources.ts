/**
 * MCP App UI Resource Definitions — Terminy Leczenia NFZ
 *
 * Single widget: interactive Leaflet map + list + filters for NFZ appointment queues.
 *
 * @see https://github.com/modelcontextprotocol/specification/blob/main/docs/specification/extensions/sep-1865-mcp-apps.md
 */

export const UI_MIME_TYPE = "text/html;profile=mcp-app" as const;

/**
 * Claude sandbox domain — SHA-256(MCP_PUBLIC_URL)[:32] + ".claudemcpcontent.com".
 * Computed once with:
 *   printf 'https://terminy-leczenia.wtyczki.ai/mcp' | shasum -a 256 | awk '{print substr($1,1,32)}'
 *
 * For ChatGPT directory submission this must be replaced by the registered
 * `<app>.web-sandbox.oaiusercontent.com` value (per-build).
 */
export const CLAUDE_SANDBOX_DOMAIN = "a86a09e17bb3ccb76f7f0e6892e0ed3f.claudemcpcontent.com";

export interface UIResourceMeta {
  ui?: {
    csp?: {
      connectDomains?: string[];
      resourceDomains?: string[];
      frameDomains?: string[];
      baseUriDomains?: string[];
    };
    domain?: string;
    permissions?: {
      camera?: Record<string, never>;
      microphone?: Record<string, never>;
      geolocation?: Record<string, never>;
      clipboardWrite?: Record<string, never>;
    };
    prefersBorder?: boolean;
  };
}

export interface UIResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: typeof UI_MIME_TYPE;
  _meta: UIResourceMeta;
}

export const UI_RESOURCES = {
  /**
   * Main widget — map + list of NFZ appointment queues.
   *
   * Data delivery: `search_appointments` / `list_other_places` results via
   * ontoolresult postMessage; widget renders structuredContent.
   */
  widget: {
    uri: "ui://terminy-leczenia/widget",
    name: "terminy_leczenia_widget",
    description:
      "Interactive map + list of NFZ appointment queues. Shows first-available dates, " +
      "wait-time statistics, accessibility flags (toilet/ramp/car-park/elevator), and " +
      "alternative locations of the same provider. Filters by voivodeship, locality, case " +
      "urgency, and paediatric scope.",
    mimeType: UI_MIME_TYPE,
    _meta: {
      ui: {
        csp: {
          // No direct browser→NFZ calls — all NFZ traffic goes through the Worker.
          connectDomains: [] as string[],
          resourceDomains: [
            // OSM map tiles (Leaflet) — load via 4 tile-server subdomains
            "https://a.tile.openstreetmap.org",
            "https://b.tile.openstreetmap.org",
            "https://c.tile.openstreetmap.org",
            "https://tile.openstreetmap.org",
            // Leaflet CSS + JS from unpkg CDN
            "https://unpkg.com",
            // Cross-host font/asset CDNs for theme support
            "https://assets.claude.ai",
            "https://persistent.oaistatic.com",
            "https://*.oaistatic.com",
          ] as string[],
          frameDomains: [] as string[],
          baseUriDomains: [] as string[],
        },
        domain: CLAUDE_SANDBOX_DOMAIN,
        // No clipboard/camera/microphone/geolocation needed in MVP.
        prefersBorder: false,
      },
    },
  },
} as const;

export type UiResourceUri = (typeof UI_RESOURCES)[keyof typeof UI_RESOURCES]["uri"];

export const UI_EXTENSION_ID = "io.modelcontextprotocol/ui";

export function hasUISupport(clientCapabilities: unknown): boolean {
  if (!clientCapabilities || typeof clientCapabilities !== "object") return false;
  const caps = clientCapabilities as Record<string, unknown>;
  const extensions = caps.extensions as Record<string, unknown> | undefined;
  if (!extensions) return false;
  const uiExtension = extensions[UI_EXTENSION_ID] as Record<string, unknown> | undefined;
  if (!uiExtension) return false;
  const mimeTypes = uiExtension.mimeTypes as string[] | undefined;
  return Array.isArray(mimeTypes) && mimeTypes.includes(UI_MIME_TYPE);
}
