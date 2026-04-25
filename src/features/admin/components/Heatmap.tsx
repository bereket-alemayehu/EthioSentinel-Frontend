import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapContainer, TileLayer, useMap, Popup, CircleMarker } from "react-leaflet";
import type { GeoStat } from "../api";
import { Info, Map as MapIcon, Database } from "lucide-react";

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
        div.style.cssText =
          "background:white;padding:10px 14px;border-radius:10px;" +
          "box-shadow:0 2px 12px rgba(0,0,0,0.15);font-size:12px;line-height:1.6;";
        div.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px;color:#1e293b;">Case Severity</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#dc2626;"></span>
            <span style="color:#374151;">Critical (≥ 200 cases)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ea580c;"></span>
            <span style="color:#374151;">High (100–199)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#d97706;"></span>
            <span style="color:#374151;">Medium (50–99)</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#16a34a;"></span>
            <span style="color:#374151;">Low (&lt; 50)</span>
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
                    { icon: "💀", label: "Deaths",  val: totalDeaths,  color: "#374151" },
                    { icon: "📋", label: "Reports", val: totalReports, color: "#0f6b7c" },
                  ].map(({ icon, label, val, color: c }) => (
                    <div key={label} style={{
                      flex: 1,
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: "6px 4px",
                      textAlign: "center",
                      border: "1px solid #e2e8f0",
                    }}>
                      <div style={{ fontSize: 14 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{val}</div>
                      <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Disease breakdown */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  🧬 Diseases Reported
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {rows.map((r, i) => (
                    <div key={i} style={{
                      background: "#f1f5f9",
                      borderRadius: 8,
                      padding: "6px 8px",
                      borderLeft: `3px solid ${getSeverityColor(r.totalCases)}`,
                    }}>
                      {/* Disease name */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                        🦠 {r.diseaseType}
                      </div>
                      {/* Stats row: cases + deaths */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{
                          flex: 1,
                          background: "#fff",
                          borderRadius: 6,
                          padding: "3px 6px",
                          textAlign: "center",
                          border: "1px solid #e2e8f0",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: getSeverityColor(r.totalCases) }}>
                            {r.totalCases}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Cases</div>
                        </div>
                        <div style={{
                          flex: 1,
                          background: "#fff",
                          borderRadius: 6,
                          padding: "3px 6px",
                          textAlign: "center",
                          border: "1px solid #e2e8f0",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: r.totalDeaths > 0 ? "#dc2626" : "#94a3b8" }}>
                            {r.totalDeaths}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Deaths</div>
                        </div>
                        <div style={{
                          flex: 1,
                          background: "#fff",
                          borderRadius: 6,
                          padding: "3px 6px",
                          textAlign: "center",
                          border: "1px solid #e2e8f0",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f6b7c" }}>
                            {r.reportCount}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Reports</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ── Public Heatmap export ────────────────────────────────────────────────────
export function Heatmap({ data }: HeatmapLayerProps) {
  const center: [number, number] = [9.145, 40.4896];

  if (!data?.length) {
    return (
      <div className="h-[600px] w-full rounded-xl border bg-linear-to-br from-slate-50 to-teal-50/30 flex flex-col items-center justify-center gap-3">
        <div className="text-5xl">🗺️</div>
        <div className="font-semibold text-slate-500 text-sm">No geo-spatial data available yet</div>
        <div className="text-slate-400 text-xs">Reports with district coordinates will appear here</div>
      </div>
    );
  }

  // Get unique diseases for the legend
  const uniqueDiseases = Array.from(new Set(data.map(d => d.diseaseType)));

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-inner bg-slate-50 relative z-0">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={data} />
        <MapLegend />
      </MapContainer>
    </div>
  );
}
