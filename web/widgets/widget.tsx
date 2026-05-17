/**
 * Terminy Leczenia NFZ — main widget.
 *
 * Layout (h-[500px]):
 *   ┌──────────────────────────────────────────────────────┐
 *   │ FilterBar (sticky, ~44px)                           │
 *   ├──────────────────────────┬───────────────────────────┤
 *   │                          │ ResultList (scroll)       │
 *   │ MapView (Leaflet, ~60%) │                           │
 *   │                          ├───────────────────────────┤
 *   │                          │ UnlocatedPanel (collap.)  │
 *   ├──────────────────────────┴───────────────────────────┤
 *   │ FreshnessBanner                                      │
 *   └──────────────────────────────────────────────────────┘
 *
 * Leaflet loaded from unpkg at runtime (declared in CSP resourceDomains).
 * Widget-side tools registered via app.registerTool for in-widget actions
 * (focus-pin, get-selected-queue) — invisible to LLM.
 *
 * Reference: mcp-apps/examples/map-server/src/mcp-app.ts (CesiumJS pattern,
 * adapted to Leaflet). Same handlers-before-connect order, same
 * autoResize:false, same widget.registerTool host integration.
 */

import { StrictMode, useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { z } from "zod";
import type {
  NormalizedQueueResult,
  SearchAppointmentsOutput,
  ListOtherPlacesOutput,
  WidgetStatus,
} from "../lib/types";
import "../styles/globals.css";

// ============================================================================
// Leaflet types (loaded from CDN)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

const LEAFLET_VERSION = "1.9.4";

async function loadLeaflet(): Promise<void> {
  if (typeof L !== "undefined") return;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  document.head.appendChild(css);
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet from CDN"));
    document.head.appendChild(script);
  });
}

const log = {
  info: console.log.bind(console, "[terminy-leczenia]"),
  warn: console.warn.bind(console, "[terminy-leczenia]"),
  error: console.error.bind(console, "[terminy-leczenia]"),
};

// ============================================================================
// Helpers
// ============================================================================

function waitColor(days: number): string {
  if (days <= 30) return "#16a34a"; // green-600
  if (days <= 90) return "#eab308"; // yellow-500
  return "#dc2626"; // red-600
}

function daysLabel(days: number): string {
  if (days <= 0) return "dziś";
  if (days === 1) return "1 dzień";
  return `${days} dni`;
}

function shortProvider(name: string, max = 50): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1).trimEnd() + "…";
}

// ============================================================================
// FilterBar
// ============================================================================

interface FilterState {
  showOnlyAccessible: boolean;
  showOnlyChildren: boolean;
  caseFilter: 0 | 1 | 2; // 0 = both
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  totalCount: number;
  shownCount: number;
}

function FilterBar({ filters, onChange, totalCount, shownCount }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-background text-sm">
      <button
        type="button"
        className={`h-8 px-2 rounded border ${filters.caseFilter === 0 ? "bg-secondary" : ""}`}
        onClick={() => onChange({ ...filters, caseFilter: 0 })}
      >
        Wszystko
      </button>
      <button
        type="button"
        className={`h-8 px-2 rounded border ${filters.caseFilter === 1 ? "bg-secondary" : ""}`}
        onClick={() => onChange({ ...filters, caseFilter: 1 })}
      >
        Stabilny
      </button>
      <button
        type="button"
        className={`h-8 px-2 rounded border ${filters.caseFilter === 2 ? "bg-secondary" : ""}`}
        onClick={() => onChange({ ...filters, caseFilter: 2 })}
      >
        Pilny
      </button>
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showOnlyAccessible}
          onChange={(e) => onChange({ ...filters, showOnlyAccessible: e.target.checked })}
        />
        <span>♿ Dostępne</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showOnlyChildren}
          onChange={(e) => onChange({ ...filters, showOnlyChildren: e.target.checked })}
        />
        <span>👶 Dla dzieci</span>
      </label>
      <div className="ml-auto text-xs text-muted-foreground">
        Pokazano {shownCount} z {totalCount}
      </div>
    </div>
  );
}

// ============================================================================
// MapView (Leaflet)
// ============================================================================

interface MapViewProps {
  results: NormalizedQueueResult[];
  selectedQueueId: string | null;
  onSelect: (queueId: string) => void;
  ready: boolean;
}

function MapView({ results, selectedQueueId, onSelect, ready }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  // Initialise map once
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    // Default: Poland bounds
    map.fitBounds([
      [49.0, 14.0],
      [54.9, 24.2],
    ]);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [ready]);

  // Update markers when results change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    for (const m of markersRef.current.values()) m.remove();
    markersRef.current.clear();

    const latlngs: [number, number][] = [];
    for (const r of results) {
      if (r.latitude === null || r.longitude === null) continue;
      const color = waitColor(r.wait_days_from_today);
      const marker = L.circleMarker([r.latitude, r.longitude], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(map);
      marker.bindTooltip(
        `<b>${shortProvider(r.provider, 40)}</b><br/>` +
          `${r.place}<br/>` +
          `Termin: ${r.wait_date} (${daysLabel(r.wait_days_from_today)})`,
        { direction: "top" },
      );
      marker.on("click", () => onSelect(r.queue_id));
      markersRef.current.set(r.queue_id, marker);
      latlngs.push([r.latitude, r.longitude]);
    }

    if (latlngs.length > 0) {
      map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 11 });
    }
  }, [results, onSelect]);

  // Highlight selected pin
  useEffect(() => {
    if (!selectedQueueId) return;
    const marker = markersRef.current.get(selectedQueueId);
    if (marker) {
      marker.setStyle({ radius: 12, weight: 3 });
      const map = mapRef.current;
      if (map) map.panTo(marker.getLatLng());
    }
    return () => {
      const m = markersRef.current.get(selectedQueueId);
      if (m) m.setStyle({ radius: 8, weight: 2 });
    };
  }, [selectedQueueId]);

  return (
    <div className="relative flex-1 min-h-0 bg-muted">
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Ładowanie mapy…
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ResultCard
// ============================================================================

interface ResultCardProps {
  result: NormalizedQueueResult;
  isSelected: boolean;
  onSelect: () => void;
  onShowOtherPlaces: () => void;
  onAskClaude: () => void;
}

function ResultCard({ result, isSelected, onSelect, onShowOtherPlaces, onAskClaude }: ResultCardProps) {
  const a = result.accessibility;
  return (
    <div
      className={`p-2 border rounded cursor-pointer text-xs ${
        isSelected ? "border-primary bg-secondary/60" : "border-border bg-card"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold leading-tight">
          {shortProvider(result.provider, 60)}
        </div>
        <div
          className="text-[10px] font-mono px-1 rounded text-white shrink-0"
          style={{ background: waitColor(result.wait_days_from_today) }}
          title={`Pierwszy wolny termin: ${result.wait_date}`}
        >
          {daysLabel(result.wait_days_from_today)}
        </div>
      </div>
      <div className="text-muted-foreground leading-tight mt-0.5">
        {result.place} · {result.locality}
      </div>
      <div className="leading-tight mt-0.5">
        {result.wait_date}
        <span className="text-muted-foreground"> · stan na {result.snapshot_date}</span>
      </div>
      {result.awaiting !== null && (
        <div className="text-muted-foreground">
          W kolejce: {result.awaiting} osób
          {result.average_period_days !== null && ` · śr. ${result.average_period_days} dni`}
        </div>
      )}
      <div className="flex gap-1 items-center mt-1">
        {a.toilet && <span title="Toaleta dla niepełnosprawnych">🚻</span>}
        {a.ramp && <span title="Podjazd">♿</span>}
        {a.carPark && <span title="Parking">🅿️</span>}
        {a.elevator && <span title="Winda">🛗</span>}
        {result.benefits_for_children && <span title="Dla dzieci">👶</span>}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {result.has_other_places && (
          <button
            type="button"
            className="h-7 px-2 text-xs rounded border bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onShowOtherPlaces();
            }}
          >
            ⊕ inne miejsca
          </button>
        )}
        {result.phone && (
          <a
            className="h-7 px-2 text-xs rounded border bg-background flex items-center"
            href={`tel:${result.phone.replace(/\s/g, "")}`}
            onClick={(e) => e.stopPropagation()}
          >
            📞 {result.phone}
          </a>
        )}
        <button
          type="button"
          className="h-7 px-2 text-xs rounded border bg-background ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            onAskClaude();
          }}
        >
          💬 Powiedz Claude
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// OtherPlacesDrawer
// ============================================================================

interface OtherPlacesDrawerProps {
  data: ListOtherPlacesOutput;
  onClose: () => void;
}

function OtherPlacesDrawer({ data, onClose }: OtherPlacesDrawerProps) {
  return (
    <div className="absolute inset-0 z-20 bg-background/95 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-semibold">
          Inne lokalizacje: {shortProvider(data.provider, 50)}
        </div>
        <button type="button" className="h-7 w-7 rounded border" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        <div className="text-xs text-muted-foreground">
          Świadczenie: <strong>{data.benefit}</strong>
        </div>
        {data.places.length === 0 ? (
          <div className="text-sm text-muted-foreground">Brak innych miejsc.</div>
        ) : (
          data.places.map((p) => (
            <div key={p.queue_id} className="p-2 border rounded text-xs">
              <div className="font-medium">{p.place}</div>
              <div className="text-muted-foreground">{p.address}, {p.locality}</div>
              <div className="mt-1">
                <span className="font-mono">{p.wait_date}</span>
                <span
                  className="ml-2 px-1 rounded text-white text-[10px]"
                  style={{ background: waitColor(p.wait_days_from_today) }}
                >
                  {daysLabel(p.wait_days_from_today)}
                </span>
              </div>
              {p.phone && (
                <a className="text-blue-600 underline" href={`tel:${p.phone.replace(/\s/g, "")}`}>
                  📞 {p.phone}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Widget
// ============================================================================

function applyFilters(
  results: NormalizedQueueResult[],
  filters: FilterState,
): NormalizedQueueResult[] {
  return results.filter((r) => {
    if (filters.showOnlyAccessible) {
      const a = r.accessibility;
      if (!(a.toilet && a.ramp)) return false;
    }
    if (filters.showOnlyChildren && !r.benefits_for_children) return false;
    return true;
  });
}

function Widget() {
  const [status, setStatus] = useState<WidgetStatus>({ kind: "idle" });
  const [drawer, setDrawer] = useState<ListOtherPlacesOutput | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    showOnlyAccessible: false,
    showOnlyChildren: false,
    caseFilter: 0,
  });
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [app, setApp] = useState<App | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletReady(true))
      .catch((e) => {
        log.error("Leaflet load failed:", e);
        setStatus({ kind: "error", message: "Nie udało się załadować mapy." });
      });
  }, []);

  // Connect to MCP host
  useEffect(() => {
    const appInstance = new App(
      { name: "terminy-leczenia-mcp", version: "1.0.0" },
      {},
      { autoResize: false },
    );

    appInstance.ontoolinput = () => setStatus({ kind: "loading" });

    appInstance.ontoolresult = (result) => {
      try {
        const data = result.structuredContent as { kind: string } | undefined;
        if (!data) {
          setStatus({ kind: "error", message: "Brak danych w odpowiedzi." });
          return;
        }
        if (data.kind === "search") {
          setStatus({ kind: "search", data: data as unknown as SearchAppointmentsOutput });
          setDrawer(null);
          setSelectedQueueId(null);
        } else if (data.kind === "other-places") {
          setDrawer(data as unknown as ListOtherPlacesOutput);
        } else if (data.kind === "error") {
          const err = data as unknown as { is_info: boolean; message: string };
          setStatus({ kind: "error", message: err.message });
        }
      } catch (e) {
        log.error("ontoolresult parse failed:", e);
        setStatus({ kind: "error", message: "Błąd parsowania odpowiedzi." });
      }
    };

    appInstance.onhostcontextchanged = (ctx) => {
      setHostContext((prev) => ({ ...prev, ...ctx }));
      if (ctx.theme) applyDocumentTheme(ctx.theme);
      if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
      if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
    };

    appInstance.ontoolcancelled = () => setStatus({ kind: "idle" });

    appInstance.onerror = (err) => {
      log.error("App error:", err);
      setStatus({ kind: "error", message: String(err) });
    };

    appInstance.onteardown = async () => {
      return {};
    };

    // Widget-side tools — host-facing, NOT visible to LLM
    appInstance.registerTool(
      "focus-pin",
      {
        title: "Focus pin",
        description: "Highlight a specific queue marker on the map.",
        inputSchema: z.object({ queue_id: z.string() }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any) => {
        setSelectedQueueId(String(args.queue_id));
        return { content: [{ type: "text" as const, text: "Focused." }] };
      },
    );

    appInstance.registerTool(
      "get-selected-queue",
      {
        title: "Get selected queue",
        description: "Returns the queue_id currently highlighted in the widget, or null.",
      },
      async () => {
        return {
          content: [{ type: "text" as const, text: selectedQueueId ?? "null" }],
        };
      },
    );

    appInstance
      .connect()
      .then(() => {
        setApp(appInstance);
        setHostContext(appInstance.getHostContext());
        appInstance.sendSizeChanged({ height: 500 });
      })
      .catch((e) => {
        log.error("connect failed:", e);
        setStatus({ kind: "error", message: "Połączenie z hostem nie powiodło się." });
      });

    return () => {
      appInstance.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe-area insets
  const safeAreaStyle: React.CSSProperties = {
    paddingTop: hostContext?.safeAreaInsets?.top,
    paddingRight: hostContext?.safeAreaInsets?.right,
    paddingBottom: hostContext?.safeAreaInsets?.bottom,
    paddingLeft: hostContext?.safeAreaInsets?.left,
  };

  // Callbacks
  const handleShowOtherPlaces = useCallback(
    async (queueId: string) => {
      if (!app) return;
      try {
        await app.callServerTool({
          name: "list_other_places",
          arguments: { queue_id: queueId },
        });
        // Result arrives via ontoolresult handler above and populates drawer state
      } catch (e) {
        log.error("list_other_places failed:", e);
      }
    },
    [app],
  );

  const handleAskClaude = useCallback(
    async (r: NormalizedQueueResult) => {
      if (!app) return;
      const text =
        `Chcę termin "${r.benefit}" u świadczeniodawcy "${r.provider}" ` +
        `w "${r.place}, ${r.address}, ${r.locality}" w dniu ${r.wait_date}.`;
      try {
        await app.message({
          role: "user",
          content: [{ type: "text", text }],
        });
      } catch (e) {
        log.error("sendMessage failed:", e);
      }
    },
    [app],
  );

  // Render
  if (status.kind === "idle") {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-sm text-muted-foreground" style={safeAreaStyle}>
        <div className="text-center p-4">
          <div className="font-semibold mb-1">Terminy Leczenia NFZ</div>
          <div>Oczekuję na wynik wyszukiwania…</div>
        </div>
      </div>
    );
  }

  if (status.kind === "loading") {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-sm text-muted-foreground" style={safeAreaStyle}>
        Wyszukiwanie terminów…
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="h-[500px] w-full flex items-center justify-center text-sm" style={safeAreaStyle}>
        <div className="max-w-md p-4 border rounded bg-card">
          <div className="font-semibold text-red-600 mb-1">Błąd</div>
          <div className="text-muted-foreground">{status.message}</div>
        </div>
      </div>
    );
  }

  const { data } = status;

  // Did-You-Mean state — server returned 0 results plus close-match suggestions.
  // Render a focused disambiguation panel instead of the full map+list shell.
  if (data.count === 0 && data.did_you_mean && data.did_you_mean.length > 0) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center p-4" style={safeAreaStyle}>
        <div className="max-w-md w-full p-4 border rounded bg-card">
          <div className="font-semibold mb-1">Brak dokładnego dopasowania</div>
          <div className="text-xs text-muted-foreground mb-3">
            Brak wyników dla{" "}
            <strong className="font-mono">{data.query.benefit ?? "(brak)"}</strong>.
            Czy chodziło o jedno z poniższych świadczeń?
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {data.did_you_mean.map((name) => (
              <button
                key={name}
                type="button"
                className="w-full text-left text-xs p-2 border rounded hover:bg-secondary cursor-pointer min-h-11"
                onClick={async () => {
                  if (!app) return;
                  await app.callServerTool({
                    name: "search_appointments",
                    arguments: { ...data.query, benefit: name },
                  });
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredGeo = applyFilters(data.results, filters);
  const filteredNoGeo = applyFilters(data.results_no_geo, filters);
  const totalFiltered = filteredGeo.length + filteredNoGeo.length;

  return (
    <div className="h-[500px] w-full flex flex-col overflow-hidden bg-background text-foreground" style={safeAreaStyle}>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        totalCount={data.count}
        shownCount={totalFiltered}
      />
      <div className="flex-1 min-h-0 flex relative">
        <div className="hidden sm:flex flex-col flex-1 min-h-0 relative">
          <MapView
            results={filteredGeo}
            selectedQueueId={selectedQueueId}
            onSelect={setSelectedQueueId}
            ready={leafletReady}
          />
          {data.banner && (
            <div className="absolute top-2 left-2 right-2 z-10 px-2 py-1 text-xs rounded bg-yellow-100 border border-yellow-300 text-yellow-900">
              {data.banner.content}
            </div>
          )}
        </div>
        <div className="flex flex-col w-full sm:w-[42%] sm:min-w-[300px] sm:border-l min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
            {filteredGeo.length === 0 && filteredNoGeo.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground p-4">
                Brak wyników po filtrach.
              </div>
            ) : (
              filteredGeo.map((r) => (
                <ResultCard
                  key={r.queue_id}
                  result={r}
                  isSelected={selectedQueueId === r.queue_id}
                  onSelect={() => setSelectedQueueId(r.queue_id)}
                  onShowOtherPlaces={() => handleShowOtherPlaces(r.queue_id)}
                  onAskClaude={() => handleAskClaude(r)}
                />
              ))
            )}
            {filteredNoGeo.length > 0 && (
              <div className="pt-2 border-t mt-2">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Bez lokalizacji ({filteredNoGeo.length})
                </div>
                {filteredNoGeo.map((r) => (
                  <ResultCard
                    key={r.queue_id}
                    result={r}
                    isSelected={selectedQueueId === r.queue_id}
                    onSelect={() => setSelectedQueueId(r.queue_id)}
                    onShowOtherPlaces={() => handleShowOtherPlaces(r.queue_id)}
                    onAskClaude={() => handleAskClaude(r)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {drawer && <OtherPlacesDrawer data={drawer} onClose={() => setDrawer(null)} />}
      </div>
      <div className="px-3 py-1 border-t text-[10px] text-muted-foreground flex justify-between">
        <span>
          Dane aktualne na: <strong>{new Date(data.data_freshness).toLocaleString("pl-PL")}</strong>
        </span>
        {data.newest_snapshot && (
          <span>
            Stan kolejek: <strong>{data.newest_snapshot}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Widget />
    </StrictMode>,
  );
}
