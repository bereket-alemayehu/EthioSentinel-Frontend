import { useEffect, useMemo, useState } from "react";
import { useRegions, useAdvisories } from "@/features/advisory/hooks/useAdvisory";
import { AdvisoryArticles } from "@/features/advisory/components/AdvisoryArticles";
import { SymptomChecker } from "@/features/advisory/components/SymptomChecker";
import { useEthiopiaRegionalStatus } from "../hooks/usePublicHealth";
import type { District } from "@/features/advisory/types";
import type { RegionHealthStatus } from "../api/publicHealth";
import type { RiskLevel } from "@/shared/types";
import { useTranslation } from "react-i18next";
import { RegionDistrictMap } from "../components/RegionDistrictMap";

type LocationStatus = "idle" | "detecting" | "detected" | "denied" | "unsupported" | "unavailable";

type DetectedArea = {
  regionId: number;
  region: string;
  districtId: number;
  district: string;
  distanceKm: number;
};

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

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function distanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestDistrict(
  latitude: number,
  longitude: number,
  statuses: RegionHealthStatus[],
): DetectedArea | null {
  let nearest: DetectedArea | null = null;

  for (const region of statuses) {
    for (const district of region.districts) {
      const districtLat = parseCoordinate(district.latitude);
      const districtLng = parseCoordinate(district.longitude);
      if (districtLat === null || districtLng === null) continue;

      const distanceKm = distanceInKm(
        { latitude, longitude },
        { latitude: districtLat, longitude: districtLng },
      );

      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          regionId: region.regionId,
          region: region.region,
          districtId: district.districtId,
          district: district.district,
          distanceKm,
        };
      }
    }
  }

  return nearest;
}

export default function CitizenPage() {
  const { t } = useTranslation();
  const { data: regions = [], isLoading: regionsLoading, error: regionsError } = useRegions();
  const { data: advisories = [], isLoading: advisoriesLoading, error: advisoriesError } = useAdvisories();
  const { data: regionStatus, isLoading: regionStatusLoading } = useEthiopiaRegionalStatus(30);

  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [expandedRegionId, setExpandedRegionId] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [detectedArea, setDetectedArea] = useState<DetectedArea | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
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

  // Keep expanded region card in sync with header region selector
  useEffect(() => {
    if (selectedRegionId) {
      setExpandedRegionId(Number(selectedRegionId));
    }
  }, [selectedRegionId]);

  useEffect(() => {
    if (!regionStatus?.data.length || locationStatus !== "idle") return;

    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = findNearestDistrict(
          position.coords.latitude,
          position.coords.longitude,
          regionStatus.data,
        );

        if (!match) {
          setLocationStatus("unavailable");
          return;
        }

        setDetectedArea(match);
        setExpandedRegionId(match.regionId);
        setSelectedRegionId(String(match.regionId));
        setSelectedDistrictId(String(match.districtId));
        setShowAllRegions(false);
        setLocationStatus("detected");
      },
      (geoError) => {
        setLocationStatus(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );
  }, [locationStatus, regionStatus?.data]);

  const selectedRegion = useMemo(
    () => regions.find((item) => String(item.id) === selectedRegionId) ?? null,
    [regions, selectedRegionId]
  );

  const districtOptions = selectedRegion?.districts ?? [];

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
  const regionalTotals = regionStatus?.totals;
  const focusRegionId = useMemo(() => {
    if (showAllRegions) return null;
    if (selectedRegionId) return Number(selectedRegionId);
    if (detectedArea) return detectedArea.regionId;
    return null;
  }, [selectedRegionId, detectedArea, showAllRegions]);

  const visibleRegionStatuses = useMemo(() => {
    const statuses = regionStatus?.data ?? [];
    if (focusRegionId == null) return statuses;
    return statuses.filter((region) => region.regionId === focusRegionId);
  }, [regionStatus?.data, focusRegionId]);

  const focusedRegionStatus = focusRegionId != null ? visibleRegionStatuses[0] ?? null : null;
  const dashboardTotals = focusedRegionStatus
    ? {
        cases: focusedRegionStatus.totalCases,
        deaths: focusedRegionStatus.totalDeaths,
        reports: focusedRegionStatus.reportCount,
        spikes: focusedRegionStatus.spikeCount,
      }
    : regionalTotals;

  const handleDetectLocation = () => {
    if (!regionStatus?.data.length) {
      setLocationStatus("unavailable");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = findNearestDistrict(
          position.coords.latitude,
          position.coords.longitude,
          regionStatus.data,
        );

        if (!match) {
          setLocationStatus("unavailable");
          return;
        }

        setDetectedArea(match);
        setExpandedRegionId(match.regionId);
        setSelectedRegionId(String(match.regionId));
        setSelectedDistrictId(String(match.districtId));
        setShowAllRegions(false);
        setLocationStatus("detected");
      },
      (geoError) => {
        setLocationStatus(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );
  };

  return (
    <div className="w-full min-h-screen">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#0f6b7c] via-primary-600 to-[#2e8b57] text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative w-full px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t("liveHealthMonitoring")}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t("citizenDashboardTitle")}
              </h1>
              <p className="mt-1.5 text-white/75 text-sm sm:text-base max-w-xl">
                {t("citizenDashboardDesc")}
              </p>
            </div>
            {/* Region / District Selectors */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  {t("region")}
                </label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => {
                    setSelectedRegionId(e.target.value);
                    setSelectedDistrictId("");
                    setShowAllRegions(false);
                    setExpandedRegionId(Number(e.target.value));
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
                  {t("district")}
                </label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="min-w-[160px] rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition cursor-pointer"
                >
                  <option value="" className="bg-primary-600 text-white">
                    {t("allDistricts")}
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
                label: t("totalAdvisories"),
                value: totalAdvisories,
                icon: "📋",
                sub: t("approvedAndActive"),
              },
              {
                label: t("regionsMonitored"),
                value: totalRegions,
                icon: "🗺️",
                sub: t("acrossEthiopia"),
              },
              {
                label: t("highRiskEvents"),
                value: highCount,
                icon: "⚠️",
                sub: t("requireAttention"),
              },
              {
                label: t("criticalAlerts"),
                value: criticalCount,
                icon: "🚨",
                sub: t("immediateActionNeeded"),
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
      <div className="w-full px-6 sm:px-10 lg:px-16 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-5 py-4 text-red-700 dark:text-red-400">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">{t("unableLoadDashboardData")}</p>
              <p className="text-sm mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl bg-muted/60 p-1 w-fit border border-border">
          {(
            [
              { id: "map", label: t("riskMap"), icon: "🗺️" },
              { id: "advisories", label: t("advisories"), icon: "📋" },
              { id: "symptom", label: t("symptomCheck"), icon: "🩺" },
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

        {/* ── TAB: Region Cards ──────────────────────────────────────── */}
        {!loading && activeTab === "map" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-[#0f6b7c]/20 bg-linear-to-br from-[#0f6b7c] via-[#17869a] to-[#2e8b57] p-6 text-white shadow-xl shadow-[#0f6b7c]/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
                    {t("liveHealthMonitoring")}
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {focusedRegionStatus ? t("localAreaHealthStatus") : t("allEthiopianRegions")}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                    {focusedRegionStatus && detectedArea
                      ? t("showingDetectedRegion", {
                          region: detectedArea.region,
                          district: detectedArea.district,
                        })
                      : t("regionCardsHint")}
                  </p>
                  <p className="mt-2 max-w-2xl text-xs font-semibold uppercase tracking-wider text-white/60">
                    {t("regionalDataSourceNote")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white/80">
                      {locationStatus === "detecting"
                        ? t("detectingLocation")
                        : locationStatus === "detected"
                          ? t("locationDetected")
                          : locationStatus === "denied"
                            ? t("locationPermissionDenied")
                            : locationStatus === "unsupported"
                              ? t("locationUnsupported")
                              : t("locationNotDetected")}
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={locationStatus === "detecting"}
                      className="rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#0f6b7c] shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {locationStatus === "detecting" ? t("detecting") : t("detectMyRegion")}
                    </button>
                    {detectedArea && (
                      <button
                        type="button"
                        onClick={() => setShowAllRegions((value) => !value)}
                        className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                      >
                        {showAllRegions ? t("showMyRegionOnly") : t("showAllRegions")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                  {[
                    { label: t("caseCount"), value: dashboardTotals?.cases ?? 0 },
                    { label: t("deaths"), value: dashboardTotals?.deaths ?? 0 },
                    { label: t("reports"), value: dashboardTotals?.reports ?? 0 },
                    { label: t("spikes"), value: dashboardTotals?.spikes ?? 0 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/65">
                        {item.label}
                      </p>
                      <p className="mt-1 text-2xl font-black tabular-nums">
                        {item.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {regionStatusLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-64 animate-pulse rounded-3xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleRegionStatuses.map((region) => {
                  const expanded = expandedRegionId === region.regionId;
                  const cfg = RISK_CONFIG[region.riskLevel];
                  return (
                    <div
                      key={region.regionId}
                      className={`group overflow-hidden rounded-[2rem] border bg-card shadow-md transition-all ${
                        expanded
                          ? `border-[#0f6b7c]/50 shadow-2xl ${cfg.glow} md:col-span-2 xl:col-span-3`
                          : `border-border hover:-translate-y-1 hover:border-[#0f6b7c]/35 hover:shadow-xl ${cfg.glow}`
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedRegionId(expanded ? null : region.regionId)}
                        className="w-full text-left"
                      >
                        <div className={`h-2 w-full ${cfg.dot}`} />
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-3xl font-black tracking-tight text-foreground">
                                {region.region}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                                {region.districtCount} {t("districts")} • {region.reportCount.toLocaleString()} {t("reports")}
                              </p>
                            </div>
                            <RiskBadge level={region.riskLevel} />
                          </div>

                          <div className="mt-6 rounded-3xl bg-linear-to-br from-[#0f6b7c]/10 to-[#2e8b57]/10 p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-[#0f6b7c]">
                              {t("caseCount")}
                            </p>
                            <div className="mt-1 flex items-end justify-between gap-4">
                              <p className="text-5xl font-black tracking-tight text-foreground tabular-nums">
                                {region.totalCases.toLocaleString()}
                              </p>
                              <p className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-[#0f6b7c] dark:bg-background/70">
                                {region.riskLevel}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("deaths")}</p>
                              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{region.totalDeaths.toLocaleString()}</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("reports")}</p>
                              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{region.reportCount.toLocaleString()}</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("spikes")}</p>
                              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{region.spikeCount.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                              {t("diseaseDistribution")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {region.topDiseases.length === 0 ? (
                                <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground">{t("noData")}</span>
                              ) : (
                                region.topDiseases.slice(0, 4).map((disease) => (
                                  <span key={disease.diseaseType} className="rounded-full bg-[#0f6b7c]/10 px-3 py-1.5 text-sm font-black text-[#0f6b7c]">
                                    {disease.diseaseType}: {disease.cases.toLocaleString()}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                            <span className="text-sm font-black text-[#0f6b7c]">
                              {expanded ? t("hideDistrictDetails") : t("viewDistrictDetails")}
                            </span>
                            <span className={`text-xl transition-transform ${expanded ? "rotate-180" : ""}`}>
                              ↓
                            </span>
                          </div>
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-border bg-muted/20 px-6 pb-6">
                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {region.districts.map((district) => (
                              <div key={district.districtId} className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xl font-black text-foreground">{district.district}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {district.reportCount.toLocaleString()} {t("reports")}
                                    </p>
                                  </div>
                                  <RiskBadge level={district.riskLevel} />
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                  <div className="rounded-2xl bg-muted/50 p-3">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">{t("caseCount")}</p>
                                    <p className="mt-1 text-lg font-black">{district.totalCases.toLocaleString()}</p>
                                  </div>
                                  <div className="rounded-2xl bg-muted/50 p-3">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">{t("deaths")}</p>
                                    <p className="mt-1 text-lg font-black">{district.totalDeaths.toLocaleString()}</p>
                                  </div>
                                  <div className="rounded-2xl bg-muted/50 p-3">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">{t("spikes")}</p>
                                    <p className="mt-1 text-lg font-black">{district.spikeCount.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {district.topDiseases.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">{t("noData")}</span>
                                  ) : (
                                    district.topDiseases.map((disease) => (
                                      <span key={disease.diseaseType} className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                                        {disease.diseaseType}: {disease.cases.toLocaleString()}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <RegionDistrictMap region={region} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Advisories ───────────────────────────────────── */}
        {!loading && !error && activeTab === "advisories" && (
          <AdvisoryArticles items={filteredAdvisories} />
        )}

        {/* ── TAB: Symptom Checker ──────────────────────────────── */}
        {activeTab === "symptom" && (
          <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="bg-linear-to-r from-[#0f6b7c]/5 to-[#2e8b57]/5 px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🩺</span> {t("aiSymptomChecker")}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("symptomCheckerDesc")}
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
