import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heatmap } from "@/features/admin/components/Heatmap";
import type { GeoStat } from "@/features/admin/api";
import type { RegionHealthStatus } from "../api/publicHealth";

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Build map points for districts in a single region only. */
export function regionDistrictsToGeoStats(region: RegionHealthStatus): GeoStat[] {
  const stats: GeoStat[] = [];

  for (const district of region.districts) {
    const latitude = parseCoordinate(district.latitude);
    const longitude = parseCoordinate(district.longitude);
    if (latitude === null || longitude === null) continue;

    const diseases =
      district.topDiseases.length > 0
        ? district.topDiseases
        : [{ diseaseType: "No reported disease", cases: 0 }];

    for (const disease of diseases) {
      stats.push({
        district: district.district,
        diseaseType: disease.diseaseType,
        totalCases: disease.cases > 0 ? disease.cases : district.totalCases,
        totalDeaths: district.totalDeaths,
        reportCount: district.reportCount,
        latitude,
        longitude,
        riskLevel: district.riskLevel,
      });
    }
  }

  return stats;
}

type RegionDistrictMapProps = {
  region: RegionHealthStatus;
};

export function RegionDistrictMap({ region }: RegionDistrictMapProps) {
  const { t } = useTranslation();
  const geoStats = useMemo(() => regionDistrictsToGeoStats(region), [region]);
  const withCoords = region.districts.filter(
    (d) => parseCoordinate(d.latitude) !== null && parseCoordinate(d.longitude) !== null,
  );

  return (
    <div className="mt-6 space-y-3">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#0f6b7c]">
          {t("regionDistrictMapTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("regionDistrictMapDesc", {
            region: region.region,
            count: withCoords.length,
            total: region.districtCount,
          })}
        </p>
      </div>
      <Heatmap data={geoStats} height={420} markerStyle="pulse" />
    </div>
  );
}
