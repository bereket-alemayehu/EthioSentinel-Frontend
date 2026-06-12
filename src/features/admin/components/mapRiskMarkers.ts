import L from "leaflet";
import type { GeoStat } from "../api";

export type MapRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

const RISK_COLORS: Record<MapRiskLevel, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MODERATE: "#d97706",
  LOW: "#10b981",
};

export function casesToRiskLevel(cases: number): MapRiskLevel {
  if (cases >= 200) return "CRITICAL";
  if (cases >= 100) return "HIGH";
  if (cases >= 50) return "MODERATE";
  return "LOW";
}

export function resolveDistrictRiskLevel(rows: GeoStat[]): MapRiskLevel {
  const fromApi = rows.find((r) => r.riskLevel)?.riskLevel;
  if (fromApi) return fromApi;
  const totalCases = rows.reduce((s, r) => s + r.totalCases, 0);
  return casesToRiskLevel(totalCases);
}

export function createRiskPulseIcon(
  risk: MapRiskLevel,
  options?: { emphasized?: boolean },
): L.DivIcon {
  const color = RISK_COLORS[risk];
  const baseSize = risk === "LOW" ? 40 : risk === "CRITICAL" ? 38 : 36;
  const size = Math.round(baseSize * (options?.emphasized ? 1.3 : 1));
  const selectedAttr = options?.emphasized ? ' data-selected="true"' : "";

  return L.divIcon({
    className: "risk-pulse-marker-leaflet",
    html: `
      <div class="risk-pulse-marker" data-risk="${risk}"${selectedAttr} style="--risk-color:${color};--risk-size:${size}px">
        <span class="risk-pulse-ring"></span>
        <span class="risk-pulse-ring risk-pulse-ring--delay"></span>
        <span class="risk-pulse-core"></span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function aggregateDistricts(data: GeoStat[]): Map<string, GeoStat[]> {
  const byLocation = new Map<string, GeoStat[]>();
  data
    .filter((d) => d.latitude !== null && d.longitude !== null)
    .forEach((d) => {
      // Use facility name as part of the key so each facility gets its own marker
      const facilityKey = d.healthFacilityName || "_no_facility_";
      const key = `${d.district}||${facilityKey}||${d.latitude}||${d.longitude}`;
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key)!.push(d);
    });
  return byLocation;
}
