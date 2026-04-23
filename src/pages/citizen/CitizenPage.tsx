import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { useRegions, useAdvisories } from "@/features/advisory/hooks/useAdvisory";
import { SymptomChecker } from "@/features/advisory/components/SymptomChecker";
import type { District } from "@/features/advisory/types";
import type { RiskLevel } from "@/types";
import L from "leaflet";

// Fix Leaflet icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ETHIOPIA_CENTER: [number, number] = [9.145, 40.4897];

function riskRank(level: RiskLevel): number {
  if (level === "CRITICAL") return 4;
  if (level === "HIGH") return 3;
  if (level === "MODERATE") return 2;
  return 1;
}

function riskColor(level: RiskLevel): string {
  if (level === "CRITICAL") return "#dc2626";
  if (level === "HIGH") return "#ea580c";
  if (level === "MODERATE") return "#d97706";
  return "#16a34a";
}

function parseCoord(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num;
}

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; bg: string; text: string; border: string; dot: string; glow: string }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    glow: "shadow-red-100 dark:shadow-red-900/20",
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
    glow: "shadow-orange-100 dark:shadow-orange-900/20",
  },
  MODERATE: {
    label: "Moderate",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    glow: "shadow-amber-100 dark:shadow-amber-900/20",
  },
  LOW: {
    label: "Low",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
  },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  );
}

export default function CitizenPage() {
  const { data: regions = [], isLoading: regionsLoading, error: regionsError } = useRegions();
  const { data: advisories = [], isLoading: advisoriesLoading, error: advisoriesError } = useAdvisories();

  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"map" | "advisories" | "symptom">(
    "map"
  );

  const loading = regionsLoading || advisoriesLoading;
  const error = (regionsError?.message || advisoriesError?.message) || "";

  // Set initial region once data arrives
  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
  }, [regions, selectedRegionId]);

  const selectedRegion = useMemo(
    () => regions.find((item) => String(item.id) === selectedRegionId) ?? null,
    [regions, selectedRegionId]
  );

  const districtOptions = selectedRegion?.districts ?? [];

  const districtMapData = useMemo(() => {
    const rows: Array<{
      districtId: number;
      districtName: string;
      lat: number;
      lng: number;
      riskLevel: RiskLevel;
      diseaseName: string;
      advisoryTitle: string;
      advisoryContent: string;
    }> = [];
    for (const region of regions) {
      if (selectedRegionId && String(region.id) !== selectedRegionId) continue;
      for (const district of region.districts ?? []) {
        if (selectedDistrictId && String(district.id) !== selectedDistrictId)
          continue;
        const districtAdvisories = advisories.filter(
          (advisory) => advisory.districtId === district.id
        );
        if (districtAdvisories.length === 0) continue;
        let highest = districtAdvisories[0];
        for (const item of districtAdvisories) {
          if (riskRank(item.riskLevel) > riskRank(highest.riskLevel))
            highest = item;
        }
        const lat = parseCoord(district.latitude);
        const lng = parseCoord(district.longitude);
        if (lat === null || lng === null) continue;
        rows.push({
          districtId: district.id,
          districtName: district.name,
          lat,
          lng,
          riskLevel: highest.riskLevel,
          diseaseName: highest.disease?.name ?? "Unknown disease",
          advisoryTitle: highest.title,
          advisoryContent: highest.content,
        });
      }
    }
    return rows;
  }, [regions, advisories, selectedRegionId, selectedDistrictId]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (districtMapData.length === 0) return ETHIOPIA_CENTER;
    const latAvg =
      districtMapData.reduce((sum, row) => sum + row.lat, 0) /
      districtMapData.length;
    const lngAvg =
      districtMapData.reduce((sum, row) => sum + row.lng, 0) /
      districtMapData.length;
    return [latAvg, lngAvg];
  }, [districtMapData]);

  const filteredAdvisories = useMemo(() => {
    if (!selectedRegionId) return advisories;
    return advisories.filter((item) => {
      const regionMatch = String(item.regionId) === selectedRegionId;
      if (!regionMatch) return false;
      if (!selectedDistrictId) return true;
      return (
        item.districtId === null ||
        String(item.districtId) === selectedDistrictId
      );
    });
  }, [advisories, selectedRegionId, selectedDistrictId]);

  // Stats
  const criticalCount = advisories.filter(
    (a) => a.riskLevel === "CRITICAL"
  ).length;
  const highCount = advisories.filter((a) => a.riskLevel === "HIGH").length;
  const totalRegions = regions.length;
  const totalAdvisories = advisories.length;

  return (
    <div className="w-full min-h-screen">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f6b7c] via-[#0a525f] to-[#2e8b57] text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live health monitoring
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Citizen Health Dashboard
              </h1>
              <p className="mt-1.5 text-white/75 text-sm sm:text-base max-w-xl">
                Real-time disease surveillance, regional advisories, and
                AI-powered symptom triage for Ethiopia.
              </p>
            </div>
            {/* Region / District Selectors */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Region
                </label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => {
                    setSelectedRegionId(e.target.value);
                    setSelectedDistrictId("");
                  }}
                  className="min-w-[160px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 transition cursor-pointer"
                >
                  {regions.map((r) => (
                    <option
                      key={r.id}
                      value={String(r.id)}
                      className="bg-primary-600 text-white"
                    >
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  District
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="min-w-[160px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition cursor-pointer"
                >
                  <option value="" className="bg-primary-600 text-white">
                    All Districts
                  </option>
                  {districtOptions.map((d: District) => (
                    <option
                      key={d.id}
                      value={String(d.id)}
                      className="bg-primary-600 text-white"
                    >
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ────────────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Advisories",
                value: totalAdvisories,
                icon: "📋",
                sub: "Approved & active",
              },
              {
                label: "Regions Monitored",
                value: totalRegions,
                icon: "🗺️",
                sub: "Across Ethiopia",
              },
              {
                label: "High Risk Events",
                value: highCount,
                icon: "⚠️",
                sub: "Require attention",
              },
              {
                label: "Critical Alerts",
                value: criticalCount,
                icon: "🚨",
                sub: "Immediate action needed",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-5 py-4 hover:bg-white/15 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-3xl font-extrabold tabular-nums">
                    {loading ? (
                      <span className="opacity-40 text-lg">…</span>
                    ) : (
                      stat.value
                    )}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white/90">
                  {stat.label}
                </p>
                <p className="text-xs text-white/55">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-5 py-4 text-red-700 dark:text-red-400">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Unable to load dashboard data</p>
              <p className="text-sm mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl bg-muted/60 p-1 w-fit border border-border">
          {(
            [
              { id: "map", label: "Risk Map", icon: "🗺️" },
              { id: "advisories", label: "Advisories", icon: "📋" },
              { id: "symptom", label: "Symptom Check", icon: "🩺" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-card shadow-sm text-[#0f6b7c] dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === "advisories" && !loading && filteredAdvisories.length > 0 && (
                <span className="ml-1 rounded-full bg-[#0f6b7c]/10 px-2 py-0.5 text-xs font-bold text-[#0f6b7c] dark:bg-emerald-400/10 dark:text-emerald-400">
                  {filteredAdvisories.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-[480px] rounded-3xl bg-muted" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Risk Map ──────────────────────────────────────── */}
        {!loading && activeTab === "map" && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-border shadow-md">
              {/* Map Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border bg-card px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    District Risk Heatmap
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {error ? "Showing base map (data currently unavailable)" : "Click a dot to view advisory details · radius = risk severity"}
                  </p>
                </div>
                {!error && (
                  <div className="flex items-center gap-3 text-xs font-medium">
                    {(["LOW", "MODERATE", "HIGH", "CRITICAL"] as RiskLevel[]).map(
                      (level) => {
                        const cfg = RISK_CONFIG[level];
                        return (
                          <div key={level} className="flex items-center gap-1.5">
                            <span
                              className={`h-3 w-3 rounded-full ${cfg.dot}`}
                            />
                            <span className="text-muted-foreground">
                              {cfg.label}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Leaflet Map */}
              <div className="h-[520px] w-full bg-slate-50 relative">
                <MapContainer
                  key={`${selectedRegionId}-${selectedDistrictId}-${districtMapData.length}-${error}`}
                  center={mapCenter}
                  zoom={selectedDistrictId ? 10 : 7}
                  scrollWheelZoom
                  className="h-full w-full outline-none"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {!error && districtMapData.map((row) => (
                    <CircleMarker
                      key={row.districtId}
                      center={[row.lat, row.lng]}
                      radius={riskRank(row.riskLevel) >= 3 ? 16 : 11}
                      pathOptions={{
                        color: riskColor(row.riskLevel),
                        fillColor: riskColor(row.riskLevel),
                        fillOpacity: 0.65,
                        weight: 2.5,
                      }}
                    >
                      <Popup>
                        <div className="space-y-2 min-w-[200px] p-1">
                          <p className="font-bold text-base">
                            {row.districtName}
                          </p>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={row.riskLevel} />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            🦠 {row.diseaseName}
                          </p>
                          <p className="text-sm font-semibold">
                            {row.advisoryTitle}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {row.advisoryContent.slice(0, 200)}
                            {row.advisoryContent.length > 200 ? "…" : ""}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
                
                {error && (
                  <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm border border-border rounded-2xl px-6 py-4 shadow-xl text-center max-w-sm pointer-events-auto">
                       <p className="text-sm font-bold text-red-600 mb-1">Data Connection Offline</p>
                       <p className="text-xs text-muted-foreground">The map is functional, but regional risk markers could not be loaded from the server.</p>
                    </div>
                  </div>
                )}
              </div>

              {!error && districtMapData.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 bg-card text-center">
                  <span className="text-4xl opacity-40">📍</span>
                  <p className="text-sm text-muted-foreground">
                    No district risk data available for the current selection.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Advisories ───────────────────────────────────── */}
        {!loading && !error && activeTab === "advisories" && (
          <div>
            {filteredAdvisories.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card py-20 text-center">
                <span className="text-5xl opacity-40">📭</span>
                <p className="text-lg font-semibold text-foreground">
                  No approved advisories
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  There are no active health advisories for the selected region
                  and district at this time.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAdvisories.map((item) => {
                  const cfg = RISK_CONFIG[item.riskLevel];
                  return (
                    <article
                      key={item.id}
                      className={`group relative overflow-hidden rounded-2xl border ${cfg.border} ${cfg.bg} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-default`}
                    >
                      {/* Top accent bar */}
                      <div
                        className={`h-1 w-full ${cfg.dot}`}
                        style={{ background: riskColor(item.riskLevel) }}
                      />

                      <div className="p-5">
                        {/* Disease + Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🦠</span>
                            <h2
                              className={`font-bold text-base ${cfg.text}`}
                            >
                              {item.disease?.name ?? "Unknown Disease"}
                            </h2>
                          </div>
                          <RiskBadge level={item.riskLevel} />
                        </div>

                        {/* Advisory title */}
                        <p className="text-sm font-semibold text-foreground mb-2 leading-snug">
                          {item.title}
                        </p>

                        {/* Content */}
                        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                          {item.content}
                        </p>

                        {/* Footer */}
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>📍</span>
                            <span>
                              {item.district?.name
                                ? item.district.name
                                : "Region-wide advisory"}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}
                          >
                            {item.riskLevel}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Symptom Checker ──────────────────────────────── */}
        {activeTab === "symptom" && (
          <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-[#0f6b7c]/5 to-[#2e8b57]/5 px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🩺</span> AI Symptom Checker
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select your symptoms for an instant AI health assessment. Not a
                substitute for professional medical advice.
              </p>
            </div>
            <div className="p-6 bg-card">
              <SymptomChecker />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
