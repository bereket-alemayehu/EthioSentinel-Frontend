import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SymptomChecker } from "@/components/Chat/SymptomChecker";

type District = {
  id: number;
  name: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

type Region = {
  id: number;
  name: string;
  districts: District[];
};

type Advisory = {
  id: number;
  diseaseId: number;
  regionId: number;
  districtId: number | null;
  title: string;
  content: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "APPROVED" | "REJECTED" | "ARCHIVED";
  disease?: {
    id: number;
    name: string;
  };
  district?: {
    id: number;
    name: string;
  } | null;
};

type RiskLevel = Advisory["riskLevel"];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";
const ETHIOPIA_CENTER: [number, number] = [9.145, 40.4897];

function riskBadgeClass(level: RiskLevel) {
  if (level === "CRITICAL") return "bg-red-100 text-red-700";
  if (level === "HIGH") return "bg-orange-100 text-orange-700";
  if (level === "MODERATE") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function riskRank(level: RiskLevel): number {
  if (level === "CRITICAL") return 4;
  if (level === "HIGH") return 3;
  if (level === "MODERATE") return 2;
  return 1;
}

function riskColor(level: RiskLevel): string {
  if (level === "CRITICAL" || level === "HIGH") return "#dc2626";
  if (level === "MODERATE") return "#f59e0b";
  return "#16a34a";
}

function parseCoord(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num;
}

export default function CitizenPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [regionsRes, advisoriesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/regions`),
          fetch(`${API_BASE_URL}/api/advisories`),
        ]);

        if (!regionsRes.ok || !advisoriesRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const regionsJson = (await regionsRes.json()) as {
          data?: Region[];
        };
        const advisoriesJson = (await advisoriesRes.json()) as {
          data?: Advisory[];
        };

        if (!active) return;

        const nextRegions = Array.isArray(regionsJson.data)
          ? regionsJson.data
          : [];
        const nextAdvisories = Array.isArray(advisoriesJson.data)
          ? advisoriesJson.data
          : [];

        setRegions(nextRegions);
        setAdvisories(
          nextAdvisories.filter((item) => item.status === "APPROVED"),
        );

        if (nextRegions.length > 0) {
          setSelectedRegionId(String(nextRegions[0].id));
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load citizen dashboard",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const selectedRegion = useMemo(
    () => regions.find((item) => String(item.id) === selectedRegionId) ?? null,
    [regions, selectedRegionId],
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
      if (selectedRegionId && String(region.id) !== selectedRegionId) {
        continue;
      }

      for (const district of region.districts ?? []) {
        if (selectedDistrictId && String(district.id) !== selectedDistrictId) {
          continue;
        }

        const districtAdvisories = advisories.filter(
          (advisory) => advisory.districtId === district.id,
        );
        if (districtAdvisories.length === 0) {
          continue;
        }

        let highest = districtAdvisories[0];
        for (const item of districtAdvisories) {
          if (riskRank(item.riskLevel) > riskRank(highest.riskLevel)) {
            highest = item;
          }
        }

        const lat = parseCoord(district.latitude);
        const lng = parseCoord(district.longitude);
        if (lat === null || lng === null) {
          continue;
        }

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
    if (districtMapData.length === 0) {
      return ETHIOPIA_CENTER;
    }

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Citizen Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Check disease risk and advisories by region and district.
        </p>
      </div>

      <div className="rounded-lg border p-4 bg-card text-card-foreground">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Region</span>
            <select
              value={selectedRegionId}
              onChange={(event) => {
                setSelectedRegionId(event.target.value);
                setSelectedDistrictId("");
              }}
              className="w-full rounded-md border px-3 py-2 bg-background"
            >
              {regions.map((region) => (
                <option key={region.id} value={String(region.id)}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">District</span>
            <select
              value={selectedDistrictId}
              onChange={(event) => setSelectedDistrictId(event.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-background"
            >
              <option value="">All districts</option>
              {districtOptions.map((district) => (
                <option key={district.id} value={String(district.id)}>
                  {district.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <SymptomChecker />

      {loading ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Loading dashboard data...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">District Risk Heatmap</h2>
            <p className="text-sm text-muted-foreground">
              Red = high risk, green = low risk. Click a district for details.
            </p>
          </div>

          <div className="h-80 sm:h-90 md:h-105 w-full overflow-hidden rounded-md border">
            <MapContainer
              key={`${selectedRegionId}-${selectedDistrictId}-${districtMapData.length}`}
              center={mapCenter}
              zoom={selectedDistrictId ? 10 : 7}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {districtMapData.map((row) => (
                <CircleMarker
                  key={row.districtId}
                  center={[row.lat, row.lng]}
                  radius={riskRank(row.riskLevel) >= 3 ? 14 : 10}
                  pathOptions={{
                    color: riskColor(row.riskLevel),
                    fillColor: riskColor(row.riskLevel),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 min-w-45">
                      <p className="font-semibold">{row.districtName}</p>
                      <p className="text-sm">Disease: {row.diseaseName}</p>
                      <p className="text-sm">Risk: {row.riskLevel}</p>
                      <p className="text-sm font-medium">{row.advisoryTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.advisoryContent.slice(0, 180)}
                        {row.advisoryContent.length > 180 ? "..." : ""}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {districtMapData.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No district coordinates or approved district advisories found for
              the selected filters.
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredAdvisories.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border p-4 bg-card text-card-foreground"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  {item.disease?.name ?? "Unknown disease"}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${riskBadgeClass(item.riskLevel)}`}
                >
                  {item.riskLevel}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground/90">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-6">
                {item.content}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {item.district?.name
                  ? `District: ${item.district.name}`
                  : "Region-wide advisory"}
              </p>
            </article>
          ))}

          {filteredAdvisories.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground sm:col-span-1 md:col-span-2 xl:col-span-3">
              No approved advisories available for the selected location.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
