import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapContainer, TileLayer, useMap, Popup, CircleMarker } from "react-leaflet";
import { useTheme } from "next-themes";
import type { GeoStat } from "../api";
import { Database } from "lucide-react";

// Fix default marker icon issue in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ── Severity helpers ─────────────────────────────────────────────────────────
function getSeverity(cases: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (cases >= 200) return "CRITICAL";
  if (cases >= 100) return "HIGH";
  if (cases >= 50)  return "MEDIUM";
  return "LOW";
}

function getSeverityColor(cases: number): string {
  const sev = getSeverity(cases);
  if (sev === "CRITICAL") return "#dc2626"; // red-600
  if (sev === "HIGH")     return "#ea580c"; // orange-600
  if (sev === "MEDIUM")   return "#d97706"; // amber-600
  return "#16a34a";                         // green-600
}

function getSeverityBadge(cases: number) {
  const sev = getSeverity(cases);
  const styles: Record<string, string> = {
    CRITICAL: "background:#fee2e2;color:#991b1b;",
    HIGH:     "background:#ffedd5;color:#9a3412;",
    MEDIUM:   "background:#fef3c7;color:#92400e;",
    LOW:      "background:#dcfce7;color:#166534;",
  };
  return { label: sev, style: styles[sev] };
}

function getMarkerRadius(cases: number): number {
  if (cases >= 200) return 16;
  if (cases >= 100) return 13;
  if (cases >= 50)  return 10;
  return 7;
}

// ── Map legend (pure DOM via useEffect) ────────────────────────────────────
function MapLegend() {
  const map = useMap();
  useEffect(() => {
    const legend = new (L.Control.extend({
      options: { position: "bottomright" },
      onAdd() {
        const div = L.DomUtil.create("div");
        const isDark = document.documentElement.classList.contains("dark");
        const bg = isDark ? "#1e293b" : "white";
        const text = isDark ? "#f1f5f9" : "#1e293b";
        const shadow = isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)";
        
        div.style.cssText =
          `background:${bg};padding:10px 14px;border-radius:10px;color:${text};` +
          `box-shadow:0 2px 12px ${shadow};font-size:12px;line-height:1.6;border:1px solid ${isDark ? "#334155" : "#e2e8f0"};`;
        div.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px;color:inherit;">Case Severity</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;"></span>
            <span style="color:inherit;">Critical (≥ 200 cases)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ea580c;"></span>
            <span style="color:inherit;">High (100–199)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#d97706;"></span>
            <span style="color:inherit;">Medium (50–99)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;"></span>
            <span style="color:inherit;">Low (&lt; 50)</span>
          </div>
        `;
        return div;
      },
    }))();
    legend.addTo(map);
    return () => { legend.remove(); };
  }, [map]);
  return null;
}

// ── Heatmap layer + circle markers ─────────────────────────────────────────
interface HeatmapLayerProps {
  data: GeoStat[];
}

// Color palette for different diseases
const DISEASE_COLORS: Record<string, string> = {
  malaria: "#0d9488", // Teal
  cholera: "#ea580c", // Orange
  ebola: "#dc2626",   // Red
  typhoid: "#9333ea", // Purple
  measles: "#2563eb", // Blue
  yellow_fever: "#eab308", // Yellow
};

const DEFAULT_COLOR = "#64748b"; // Slate

function getDiseaseColor(disease: string): string {
  const key = disease.toLowerCase().replace(/\s+/g, '_');
  return DISEASE_COLORS[key] || DEFAULT_COLOR;
}

function HeatmapLayer({ data }: { data: GeoStat[] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => { map.invalidateSize(); }, 100);
    if (!map || !data.length) return;

    const valid = data.filter((d) => d.latitude !== null && d.longitude !== null);
    const points = valid.map((d) => [
      d.latitude as number,
      d.longitude as number,
      Math.max(60, d.totalCases * 80),
    ]);

    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);

    if (points.length > 0) {
      // @ts-ignore
      heatLayerRef.current = (L as any).heatLayer(points, {
        radius: 40,
        blur: 20,
        maxZoom: 10,
        max: 400,
        gradient: { 0.1: "#3b82f6", 0.35: "#22c55e", 0.6: "#eab308", 0.8: "#f97316", 1.0: "#ef4444" },
      }).addTo(map);

      const bounds = L.latLngBounds(points.map((p) => [p[0], p[1]] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }

    return () => { 
      clearTimeout(timer);
      if (heatLayerRef.current && map) map.removeLayer(heatLayerRef.current); 
    };
  }, [map, data]);

  // Aggregate by district to show one marker per district (may have multiple disease rows)
  const byDistrict = new Map<string, GeoStat[]>();
  data
    .filter((d) => d.latitude !== null && d.longitude !== null)
    .forEach((d) => {
      const key = `${d.district}||${d.latitude}||${d.longitude}`;
      if (!byDistrict.has(key)) byDistrict.set(key, []);
      byDistrict.get(key)!.push(d);
    });

  return (
    <>
      {[...byDistrict.entries()].map(([key, rows]) => {
        const first = rows[0];
        const totalCases   = rows.reduce((s, r) => s + r.totalCases,   0);
        const totalDeaths  = rows.reduce((s, r) => s + r.totalDeaths,  0);
        const totalReports = rows.reduce((s, r) => s + r.reportCount,  0);
        const color  = getSeverityColor(totalCases);
        const radius = getMarkerRadius(totalCases);
        const badge  = getSeverityBadge(totalCases);

        return (
          <CircleMarker
            key={key}
            center={[first.latitude!, first.longitude!]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: "#fff",
              weight: 2,
            }}
          >
            <Popup minWidth={220}>
              <PopupContent 
                rows={rows} 
                badge={badge} 
                totalCases={totalCases} 
                totalDeaths={totalDeaths} 
                totalReports={totalReports} 
              />
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function PopupContent({ rows, badge, totalCases, totalDeaths, totalReports }: { 
  rows: GeoStat[]; 
  badge: { label: string; style: string };
  totalCases: number;
  totalDeaths: number;
  totalReports: number;
}) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const first = rows[0];

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0f6b7c,#2e8b57)",
        color: "#fff",
        padding: "8px 12px",
        margin: "-8px -12px 10px",
        borderRadius: "6px 6px 0 0",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>📍 {first.district}</div>
        <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>Desa / District Report Summary</div>
      </div>

      {/* Severity badge */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          ...badge.style.split(";").reduce((acc: any, rule) => {
            const [k, v] = rule.split(":").map(s => s.trim());
            if (k) acc[k] = v;
            return acc;
          }, {}),
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          display: "inline-block",
        }}>
          {badge.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { icon: "🦠", label: "Cases",   val: totalCases,   color: "#dc2626" },
          { icon: "💀", label: "Deaths",  val: totalDeaths,  color: isDark ? "#fca5a5" : "#334155" },
          { icon: "📋", label: "Reports", val: totalReports, color: "#0f6b7c" },
        ].map(({ icon, label, val, color: c }) => (
          <div key={label} style={{
            flex: 1,
            background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            borderRadius: 8,
            padding: "6px 4px",
            textAlign: "center",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
          }}>
            <div style={{ fontSize: 14 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{val}</div>
            <div style={{ fontSize: 9, color: isDark ? "#94a3b8" : "#64748b", marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Disease breakdown */}
      <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <Database size={12} className="text-teal-600" />
        Diseases Reported
      </div>
      
      {/* Scrollable container for diseases */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 8, 
        maxHeight: "220px", 
        overflowY: "auto",
        paddingRight: "4px",
        msOverflowStyle: "none",
        scrollbarWidth: "none"
      }} className="hide-scrollbar">
        {rows.map((r, i) => {
          const diseaseColor = getDiseaseColor(r.diseaseType);
          return (
            <div key={i} style={{
              background: isDark ? "rgba(30, 41, 59, 0.7)" : "#fff",
              borderRadius: 10,
              padding: "8px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
              boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Color accent bar */}
              <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: diseaseColor
              }} />

              {/* Title & Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingLeft: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#f1f5f9" : "#1e293b" }}>{r.diseaseType}</span>
                <span style={{ 
                  fontSize: 9, 
                  padding: "1px 6px", 
                  borderRadius: 4, 
                  background: `${diseaseColor}20`, 
                  color: diseaseColor,
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {getSeverity(r.totalCases)}
                </span>
              </div>

              {/* Mini Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, paddingLeft: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#f1f5f9" : "#1e293b" }}>{r.totalCases}</div>
                  <div style={{ fontSize: 8, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.025em" }}>Cases</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: r.totalDeaths > 0 ? "#f87171" : (isDark ? "#94a3b8" : "#64748b") }}>{r.totalDeaths}</div>
                  <div style={{ fontSize: 8, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.025em" }}>Deaths</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2dd4bf" }}>{r.reportCount}</div>
                  <div style={{ fontSize: 8, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.025em" }}>Alerts</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Public Heatmap export ────────────────────────────────────────────────────
export function Heatmap({ data }: HeatmapLayerProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const center: [number, number] = [9.145, 40.4896];

  if (!data?.length) {
    return (
      <div className="h-[600px] w-full rounded-xl border dark:border-slate-800 bg-linear-to-br from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/20 flex flex-col items-center justify-center gap-3 transition-colors">
        <div className="text-5xl">🗺️</div>
        <div className="font-semibold text-slate-500 dark:text-slate-400 text-sm">No geo-spatial data available yet</div>
        <div className="text-slate-400 dark:text-slate-500 text-xs">Reports with district coordinates will appear here</div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border dark:border-slate-800 shadow-inner bg-slate-50 dark:bg-slate-900 relative z-0 transition-colors">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={isDark ? '&copy; <a href="https://carto.com/attributions">CARTO</a>' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={isDark 
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          {...(isDark && {
            eventHandlers: {
              add: (e) => {
                const container = e.target.getContainer();
                container.style.filter = "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)";
              }
            }
          })}
        />
        <HeatmapLayer data={data} />
        <MapLegend />
      </MapContainer>
    </div>
  );
}
