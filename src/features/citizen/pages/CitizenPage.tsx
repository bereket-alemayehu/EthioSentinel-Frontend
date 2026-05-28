import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import { useRegions, useAdvisories } from "@/features/advisory/hooks/useAdvisory";
import { AdvisoryArticles } from "@/features/advisory/components/AdvisoryArticles";
import { SymptomChecker } from "@/features/advisory/components/SymptomChecker";
import { useEthiopiaRegionalStatus, useHealthFacilitiesWithIndicators, useOutbreakNews } from "../hooks/usePublicHealth";
import type { District } from "@/features/advisory/types";
import type { RegionHealthStatus } from "../api/publicHealth";
import type { RiskLevel } from "@/shared/types";
import { syncGeolocationFromDeviceApi } from "@/features/auth/api/auth";
import { publicAdvisoryTitle } from "@/shared/utils/healthMessaging";

type LocationStatus = "idle" | "detecting" | "detected" | "denied" | "unsupported" | "unavailable";

type DetectedArea = {
  regionId: number;
  region: string;
  districtId: number;
  district: string;
  distanceKm: number;
};

type LiveLocation = {
  latitude: number;
  longitude: number;
};

type HealthFacilityMarker = {
  id: string;
  name: string;
  region: string;
  district: string;
  latitude: number;
  longitude: number;
  type: string;
  distanceKm: number | null;
  riskLevel?: string;
  totalCases?: number;
  totalDeaths?: number;
  topDiseases?: Array<{ name: string; count: number }>;
};

const LIVE_RADIUS_KM = 120;

const RISK_CONFIG: Record<RiskLevel, { label: string; badge: string; marker: string }> = {
  CRITICAL: { label: "Danger", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900", marker: "#dc2626" },
  HIGH: { label: "Danger", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900", marker: "#dc2626" },
  MODERATE: { label: "Warning", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900", marker: "#eab308" },
  LOW: { label: "Safe", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900", marker: "#16a34a" },
};

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function distanceInKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestDistrict(latitude: number, longitude: number, statuses: RegionHealthStatus[]): DetectedArea | null {
  let nearest: DetectedArea | null = null;

  for (const region of statuses) {
    for (const district of region.districts) {
      const districtLat = parseCoordinate(district.latitude);
      const districtLng = parseCoordinate(district.longitude);
      if (districtLat === null || districtLng === null) continue;

      const distanceKm = distanceInKm({ latitude, longitude }, { latitude: districtLat, longitude: districtLng });
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { regionId: region.regionId, region: region.region, districtId: district.districtId, district: district.district, distanceKm };
      }
    }
  }

  return nearest;
}

// district markers and relative-risk helper removed — map focuses on individual health facilities

// --- Unified Feed (small, in-file helper) ----------------------------------
type SmallNewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  thumbnail?: string | undefined;
  verified: "who" | "moh" | null;
};

function advisoryPreviewText(advisory: any, maxLen = 140): string {
  const raw = String(advisory.publicContent || advisory.content || advisory.summary || "").trim();
  if (!raw) {
    return "Please review and follow this health alert guidance immediately.";
  }
  const clean = raw.replace(/[#*_>\n\r-]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen).trimEnd()}...` : clean;
}

function UnifiedFeed({ advisoriesList }: { advisoriesList: any[] }) {
  const { data: outbreakNews = [], isLoading: loadingNews } = useOutbreakNews();
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  const news: SmallNewsItem[] = useMemo(
    () =>
      outbreakNews.map((item) => ({
        id: item.id,
        title: item.title || "Untitled",
        summary: item.summary || "",
        source: item.source,
        date: item.publishedAt ?? new Date().toISOString(),
        url: item.url || "",
        thumbnail: item.imageUrl,
        verified:
          item.source.toLowerCase().includes("who")
            ? "who"
            : item.source.toLowerCase().includes("ministry")
              ? "moh"
              : null,
      })),
    [outbreakNews],
  );

  const alerts = advisoriesList.filter((a) => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH').slice(0, 4);
  const advisoriesGroup = advisoriesList.filter((a) => a.riskLevel !== 'CRITICAL' && a.riskLevel !== 'HIGH').slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Health Updates Feed</h3>
          <p className="mt-1 text-sm text-muted-foreground">Latest alerts, advisories, and news from global health organizations</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-600">
              <span className="text-xl">🚨</span> Critical Alerts
            </p>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-xl border-l-4 border-l-red-600 border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                  <p className="font-bold text-red-900 dark:text-red-200">{publicAdvisoryTitle(a.title || a.headline || a.summary || 'Alert')}</p>
                  <p className="mt-1 text-xs text-red-700 dark:text-red-300">{a.regionName || a.region?.name || 'Global'}</p>
                  <p className="mt-2 text-xs leading-relaxed text-red-800/90 dark:text-red-200/90">
                    {advisoryPreviewText(a)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisories Section */}
        {advisoriesGroup.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700">
              <span className="text-xl">🏥</span> Health Advisories
            </p>
            <div className="space-y-2">
              {advisoriesGroup.map((a) => (
                <div key={a.id} className="rounded-xl border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <p className="font-bold text-amber-900 dark:text-amber-200">{publicAdvisoryTitle(a.title || a.headline || a.summary || 'Advisory')}</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{a.regionName || a.region?.name || 'Global'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Section */}
        <div>
          <p className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            <span className="text-xl">📰</span> Latest News
          </p>
          {loadingNews ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            </div>
          ) : news.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No news items available.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, 9).map((n) => (
                <div
                  key={n.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/60 to-emerald-50/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80" />

                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        📰 News
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {n.source}
                      </p>
                    </div>
                    {n.verified && (
                      <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        {n.verified === "who" ? "✓ WHO" : "✓ MOH"}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-3 text-[1.02rem] font-extrabold leading-snug text-slate-900 dark:text-slate-100">
                    {n.title}
                  </p>

                  <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {new Date(n.date).toLocaleDateString()}
                  </p>

                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {n.summary || n.title}
                  </p>

                  <button
                    onClick={() => setExpandedNews(expandedNews === n.id ? null : n.id)}
                    className="mt-4 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {expandedNews === n.id ? "← Hide details" : "View details →"}
                  </button>

                  {expandedNews === n.id && (
                    <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                      {n.url ? (
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-primary underline-offset-4 transition hover:underline"
                        >
                          Read full article ↗
                        </a>
                      ) : (
                        <span className="inline-block text-xs font-semibold text-muted-foreground">
                          Full article link unavailable
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function markerIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="width:28px;height:28px;border-radius:9999px;background:${color};border:3px solid rgba(255,255,255,0.95);box-shadow:0 8px 24px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;">${label}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function facilityIcon(riskLevel?: string) {
  // Risk-based color mapping
  const riskColors: Record<string, string> = {
    CRITICAL: "#dc2626",  // Red
    HIGH: "#ea580c",      // Orange-red
    MODERATE: "#eab308",  // Yellow
    LOW: "#16a34a",       // Green
  };

  const color = riskLevel && riskColors[riskLevel] ? riskColors[riskLevel] : "#10b981";
  return markerIcon(color, "⚕️");
}

function MapAutoFit({ userLocation, facilities }: { userLocation: LiveLocation | null; facilities?: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap();

  useEffect(() => {
    // Leaflet can render with an incorrect viewport size after tab/layout changes.
    // Force size recalculation so tiles fill the whole container.
    const raf = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    const points: [number, number][] = [];

    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude]);
    }

    facilities?.forEach((facility) => points.push([facility.latitude, facility.longitude]));

    if (points.length === 0) {
      map.setView([9.145, 40.4897], 6);
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(timeoutId);
      };
    }

    if (points.length === 1) {
      map.setView(points[0], userLocation ? 13 : 8);
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(timeoutId);
      };
    }

    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [facilities, map, userLocation]);

  return null;
}

function MapLegend() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-500 rounded-2xl border border-white/20 bg-white/90 p-4 text-xs shadow-xl backdrop-blur-sm dark:bg-slate-950/80 dark:text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Map legend</p>
      <div className="mt-3 space-y-2.5">
        {[
          { color: RISK_CONFIG.CRITICAL.marker, label: "Danger zones" },
          { color: RISK_CONFIG.MODERATE.marker, label: "Warning zones" },
          { color: RISK_CONFIG.LOW.marker, label: "Safe zones" },
          { color: "#10b981", label: "Health facilities" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// RiskBadge removed — map focuses on facility markers now

export default function CitizenPage() {
  const { t, i18n } = useTranslation();
  const preferredLanguage = i18n.language === "am" ? "AMHARIC" : "ENGLISH";
  const { data: regions = [], isLoading: regionsLoading, error: regionsError } = useRegions();
  const { data: advisories = [], isLoading: advisoriesLoading, error: advisoriesError } =
    useAdvisories(preferredLanguage);
  const { data: regionStatus, isLoading: regionStatusLoading } = useEthiopiaRegionalStatus(30);
  const { data: healthFacilitiesWithIndicators = [], isLoading: facilitiesLoading } = useHealthFacilitiesWithIndicators(30);

  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedFacility, setSelectedFacility] = useState<HealthFacilityMarker | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [detectedArea, setDetectedArea] = useState<DetectedArea | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "advisories" | "symptom">("map");
  const lastSyncedLocationRef = useRef<string>("");

  const loading = regionsLoading || advisoriesLoading || regionStatusLoading || facilitiesLoading;
  const error = (regionsError?.message || advisoriesError?.message) || "";

  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
  }, [regions, selectedRegionId]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus((current) => (current === "idle" ? "detecting" : current));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("detected");
      },
      (geoError) => {
        setLocationStatus(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!liveLocation || !regionStatus?.data?.length) return;

    const match = findNearestDistrict(liveLocation.latitude, liveLocation.longitude, regionStatus.data);
    if (match) {
      setDetectedArea(match);
      setSelectedRegionId(String(match.regionId));
      setSelectedDistrictId(String(match.districtId));
      setShowAllRegions(false);
    }

    const signature = `${liveLocation.latitude.toFixed(5)},${liveLocation.longitude.toFixed(5)}`;
    if (lastSyncedLocationRef.current !== signature) {
      lastSyncedLocationRef.current = signature;
      void syncGeolocationFromDeviceApi(liveLocation.latitude, liveLocation.longitude).catch(() => undefined);
    }
  }, [liveLocation, regionStatus?.data]);

  const selectedRegion = useMemo(() => regions.find((item) => String(item.id) === selectedRegionId) ?? null, [regions, selectedRegionId]);
  const districtOptions = selectedRegion?.districts ?? [];

  const filteredAdvisories = useMemo(() => {
    if (!selectedRegionId) return advisories;
    return advisories.filter((item) => {
      const regionMatch = String(item.regionId) === selectedRegionId;
      if (!regionMatch) return false;
      if (!selectedDistrictId) return true;
      return item.districtId === null || String(item.districtId) === selectedDistrictId;
    });
  }, [advisories, selectedRegionId, selectedDistrictId]);

  // district markers are not rendered on the map; health facility markers are shown instead

  const visibleHealthFacilities = useMemo<Array<HealthFacilityMarker>>(() => {
    const facilities = healthFacilitiesWithIndicators
      .filter((f) => f.Y !== null && f.X !== null)
      .map((facility) => ({
        id: String(facility.id),
        name: facility.HF_Name,
        region: facility.Region,
        district: facility.Woreda,
        latitude: Number(facility.Y),
        longitude: Number(facility.X),
        type: facility.HF_Type,
        riskLevel: facility.riskLevel,
        totalCases: facility.totalCases,
        totalDeaths: facility.totalDeaths,
        topDiseases: facility.topDiseases?.map(d => ({ name: d.diseaseType, count: d.cases })) || [],
        distanceKm: liveLocation
          ? distanceInKm(
              { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
              { latitude: Number(facility.Y), longitude: Number(facility.X) },
            )
          : null,
      }));

    const regionNameFilter = selectedRegion?.name?.toLowerCase().trim();
    const districtNameFilter = districtOptions.find((d: District) => String(d.id) === selectedDistrictId)?.name?.toLowerCase().trim();

    const scopedFacilities = facilities.filter((facility) => {
      if (regionNameFilter && facility.region.toLowerCase().trim() !== regionNameFilter) return false;
      if (districtNameFilter && facility.district.toLowerCase().trim() !== districtNameFilter) return false;
      return true;
    });

    // Show facilities within distance radius if user has location, or all facilities otherwise
    const filtered = liveLocation && !showAllRegions ? scopedFacilities.filter((f) => f.distanceKm !== null && f.distanceKm <= LIVE_RADIUS_KM) : scopedFacilities;
    return [...filtered]
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
      .slice(0, 50);
  }, [districtOptions, healthFacilitiesWithIndicators, liveLocation, selectedDistrictId, selectedRegion?.name, showAllRegions]);

  useEffect(() => {
    if (selectedFacility && !visibleHealthFacilities.some((facility) => facility.id === selectedFacility.id)) {
      setSelectedFacility(null);
    }
  }, [selectedFacility, visibleHealthFacilities]);

  useEffect(() => {
    setSelectedFacility(null);
  }, [selectedRegionId, selectedDistrictId]);

  const activeFacility = selectedFacility ?? visibleHealthFacilities[0] ?? null;

  const criticalCount = advisories.filter((a) => a.riskLevel === "CRITICAL").length;
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
    ? { cases: focusedRegionStatus.totalCases, deaths: focusedRegionStatus.totalDeaths, reports: focusedRegionStatus.reportCount, spikes: focusedRegionStatus.spikeCount }
    : regionalTotals;

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("detected");
      },
      (geoError) => {
        setLocationStatus(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  };

  const nearbyFacilities = useMemo(() => visibleHealthFacilities.slice(0, 6), [visibleHealthFacilities]);

  return (
    <div className="w-full min-h-screen">
      <div className="relative overflow-hidden bg-linear-to-br from-[#0f6b7c] via-primary-600 to-[#2e8b57] text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative w-full px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t("liveHealthMonitoring")}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("citizenDashboardTitle")}</h1>
              <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base">{t("citizenDashboardDesc")}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/65">
                Live location is captured automatically and synced to your profile.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">{t("region")}</label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => {
                    setSelectedRegionId(e.target.value);
                    setSelectedDistrictId("");
                  }}
                  className="min-w-40 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-black backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>
                    {t("selectRegion")}
                  </option>
                  {regions.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">{t("district")}</label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  disabled={!selectedRegionId}
                  className="min-w-40 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-black backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {t("selectDistrict")}
                  </option>
                  {districtOptions.map((d: District) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("totalAdvisories"), value: totalAdvisories, icon: "📋", sub: t("approvedAndActive") },
              { label: t("regionsMonitored"), value: totalRegions, icon: "🗺️", sub: t("acrossEthiopia") },
              { label: t("highRiskEvents"), value: highCount, icon: "⚠️", sub: t("requireAttention") },
              { label: t("criticalAlerts"), value: criticalCount, icon: "🚨", sub: t("immediateActionNeeded") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm transition hover:bg-white/15">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-3xl font-extrabold tabular-nums">{loading ? <span className="text-lg opacity-40">…</span> : stat.value}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white/90">{stat.label}</p>
                <p className="text-xs text-white/55">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-8 sm:px-10 lg:px-16">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">{t("unableLoadDashboardData")}</p>
              <p className="mt-0.5 text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl border border-border bg-muted/60 p-1">
          {([
            { id: "map", label: t("riskMap"), icon: "🗺️" },
            { id: "advisories", label: t("advisories"), icon: "📋" },
            { id: "symptom", label: t("symptomCheck"), icon: "🩺" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? "bg-white text-[#0f6b7c] shadow-sm dark:bg-card dark:text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
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

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-120 rounded-3xl bg-muted" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted" />)}
            </div>
          </div>
        )}

        {!loading && activeTab === "map" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-[#0f6b7c]/20 bg-linear-to-br from-[#0f6b7c] via-[#17869a] to-[#2e8b57] p-6 text-white shadow-xl shadow-[#0f6b7c]/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">{t("liveHealthMonitoring")}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{focusedRegionStatus ? t("localAreaHealthStatus") : t("allEthiopianRegions")}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    {focusedRegionStatus && detectedArea ? t("showingDetectedRegion", { region: detectedArea.region, district: detectedArea.district }) : t("regionCardsHint")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white/80">
                      {locationStatus === "detecting" ? t("detectingLocation") : locationStatus === "detected" ? t("locationDetected") : locationStatus === "denied" ? t("locationPermissionDenied") : locationStatus === "unsupported" ? t("locationUnsupported") : t("locationNotDetected")}
                    </span>
                    <button type="button" onClick={handleDetectLocation} className="rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#0f6b7c] shadow-sm transition hover:bg-white/90">
                      {t("detectMyRegion")}
                    </button>
                    <button type="button" onClick={() => setShowAllRegions((value) => !value)} className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10">
                      {showAllRegions ? t("showMyRegionOnly") : t("showAllRegions")}
                    </button>
                  </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-140">
                  {[
                    { label: t("caseCount"), value: dashboardTotals?.cases ?? 0 },
                    { label: t("deaths"), value: dashboardTotals?.deaths ?? 0 },
                    { label: t("reports"), value: dashboardTotals?.reports ?? 0 },
                    { label: t("spikes"), value: dashboardTotals?.spikes ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/65">{item.label}</p>
                      <p className="mt-1 text-2xl font-black tabular-nums">{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg">
                <MapLegend />
                <div className="h-104 sm:h-128 lg:h-160">
                  <MapContainer center={[9.145, 40.4897]} zoom={6} scrollWheelZoom className="h-full w-full" style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapAutoFit userLocation={liveLocation} facilities={visibleHealthFacilities} />

                    {liveLocation && (
                      <>
                        <CircleMarker center={[liveLocation.latitude, liveLocation.longitude]} radius={10} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.95, weight: 2 }}>
                          <Tooltip direction="top" offset={[0, -10]} permanent>
                            You
                          </Tooltip>
                          <Popup>
                            <div className="space-y-1">
                              <p className="font-bold">Your current location</p>
                              <p className="text-sm text-slate-600">Automatically captured from your device.</p>
                            </div>
                          </Popup>
                        </CircleMarker>
                        <Circle center={[liveLocation.latitude, liveLocation.longitude]} radius={LIVE_RADIUS_KM * 1000} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.08, weight: 1.5 }} />
                      </>
                    )}

                    {/* District markers hidden — showing health facilities instead */}

                    {visibleHealthFacilities.map((facility) => (
                      <Marker
                        key={facility.id}
                        position={[facility.latitude, facility.longitude]}
                        icon={facilityIcon(facility.riskLevel)}
                        eventHandlers={{ click: () => setSelectedFacility(facility) }}
                      >
                        <Tooltip direction="top" offset={[0, -10]}>
                          {facility.name}
                        </Tooltip>
                        <Popup minWidth={220}>
                          <div className="space-y-1">
                            <p className="text-base font-black text-slate-900">{facility.name}</p>
                            <p className="text-sm text-slate-600">{facility.region} • {facility.district}</p>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{facility.type}</p>
                            <p className="text-xs text-slate-500">
                              {facility.distanceKm === null ? "Distance unavailable" : `${facility.distanceKm.toFixed(1)} km away`}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Auto tracking</p>
                      <h3 className="mt-1 text-xl font-black text-foreground">Citizen location summary</h3>
                    </div>
                    <span className="rounded-full bg-[#0f6b7c]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0f6b7c]">{locationStatus}</span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <p>The map captures the browser location automatically and syncs the coordinates to your profile.</p>
                    {detectedArea ? (
                      <div className="rounded-2xl border border-[#0f6b7c]/15 bg-[#0f6b7c]/5 p-4 text-foreground">
                        <p className="text-xs font-black uppercase tracking-widest text-[#0f6b7c]">Nearest district</p>
                        <p className="mt-1 text-lg font-black">{detectedArea.district}</p>
                        <p className="text-sm text-muted-foreground">{detectedArea.region} • {detectedArea.distanceKm.toFixed(1)} km away</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border p-4">No location match yet. Allow location access or tap Detect my region.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Selected health center</p>
                      <h3 className="mt-1 text-xl font-black text-foreground">Facility details</h3>
                    </div>
                    {activeFacility && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">{activeFacility.type}</span>}
                  </div>

                  {!activeFacility ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Click a health center marker or a nearby facility card to see its details here.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-lg font-black text-foreground">{activeFacility.name}</p>
                        <p className="text-sm text-muted-foreground">{activeFacility.region} • {activeFacility.district}</p>
                      </div>

                      {activeFacility.riskLevel && (
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white ${
                              activeFacility.riskLevel === "CRITICAL" ? "bg-red-500" :
                              activeFacility.riskLevel === "HIGH" ? "bg-orange-500" :
                              activeFacility.riskLevel === "MODERATE" ? "bg-yellow-500" :
                              "bg-green-500"
                            }`}>
                              {activeFacility.riskLevel} Risk
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Cases</span>
                              <span className="font-black text-foreground">{activeFacility.totalCases || 0}</span>
                            </div>
                            {activeFacility.totalDeaths !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Deaths</span>
                                <span className="font-black text-foreground">{activeFacility.totalDeaths}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeFacility.topDiseases && activeFacility.topDiseases.length > 0 && (
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Top Diseases</p>
                          <div className="space-y-2">
                            {activeFacility.topDiseases.map((disease, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-foreground">{disease.name}</span>
                                <span className="font-black text-muted-foreground">{disease.count} case{disease.count > 1 ? 's' : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-muted/60 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</p>
                          <p className="mt-1 font-black text-foreground">{activeFacility.type}</p>
                        </div>
                        <div className="rounded-2xl bg-muted/60 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distance</p>
                          <p className="mt-1 font-black text-foreground">{activeFacility.distanceKm === null ? "Unknown" : `${activeFacility.distanceKm.toFixed(1)} km`}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground">Map information</p>
                        <p className="mt-1">The selected facility is highlighted on the map and shown in the nearby list for quick reference.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nearby health areas</p>
                      <h3 className="mt-1 text-xl font-black text-foreground">Around you</h3>
                    </div>
                    <button type="button" onClick={() => setShowAllRegions((value) => !value)} className="rounded-full border border-border px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground transition hover:bg-muted">
                      {showAllRegions ? "Focus nearby" : "Show all"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {nearbyFacilities.length === 0 ? (
                      <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">No health facilities available in the current view.</p>
                    ) : (
                      nearbyFacilities.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFacility(f)}
                          className={`w-full rounded-2xl border bg-background p-4 text-left transition hover:border-emerald-300 hover:shadow-sm ${selectedFacility?.id === f.id ? "border-emerald-400 ring-1 ring-emerald-400" : "border-border"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-foreground">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{f.region} • {f.district} • {f.distanceKm === null ? "distance unknown" : `${f.distanceKm.toFixed(1)} km`}</p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{f.type}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Unified Feed placed under MAP tab per UX recommendation */}
        {!loading && activeTab === "map" && (
          <div className="mt-6 px-0">
            <UnifiedFeed advisoriesList={filteredAdvisories} />
          </div>
        )}

        {!loading && !error && activeTab === "advisories" && <AdvisoryArticles items={filteredAdvisories} />}

        {activeTab === "symptom" && (
          <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
            <div className="border-b border-border bg-linear-to-r from-[#0f6b7c]/5 to-[#2e8b57]/5 px-6 py-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><span>🩺</span> {t("aiSymptomChecker")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("symptomCheckerDesc")}</p>
            </div>
            <div className="bg-card p-6">
              <SymptomChecker />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
