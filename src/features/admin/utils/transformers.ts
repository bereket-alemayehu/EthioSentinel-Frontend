import type { GeoStat } from "@/features/admin/api";

export type DistrictDiseaseStat = {
  disease: string;
  cases: number;
  deaths: number;
  reports: number;
};

export function aggregateByDistrict(geoStats: GeoStat[]) {
  const map = new Map<string, { totalCases: number; totalDeaths: number; reportCount: number; diseaseRows: DistrictDiseaseStat[] }>();
  geoStats.forEach((s) => {
    if (!map.has(s.district)) {
      map.set(s.district, { totalCases: 0, totalDeaths: 0, reportCount: 0, diseaseRows: [] });
    }
    const entry = map.get(s.district)!;
    entry.totalCases  += s.totalCases;
    entry.totalDeaths += s.totalDeaths;
    entry.reportCount += s.reportCount;
    entry.diseaseRows.push({ disease: s.diseaseType, cases: s.totalCases, deaths: s.totalDeaths, reports: s.reportCount });
  });
  return [...map.entries()]
    .map(([district, stats]) => ({ district, ...stats }))
    .sort((a, b) => b.totalCases - a.totalCases);
}
