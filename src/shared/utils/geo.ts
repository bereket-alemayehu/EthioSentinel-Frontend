import type { Region } from "@/features/advisory/types";

export function parseCoordinate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeRegionName(raw: string): string {
  const name = raw.trim();
  if (!name) return name;
  const lowered = name.toLowerCase();
  if (lowered === "amahara") return "Amhara";
  if (lowered === "addis ababa" || lowered === "addis abeba") return "Addis Ababa";
  return name;
}

export function regionsMatch(a: string, b: string): boolean {
  return normalizeRegionName(a).toLowerCase() === normalizeRegionName(b).toLowerCase();
}

export function districtsMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y || x.includes(y) || y.includes(x)) return true;

  const addisAliases: Record<string, string> = {
    "akaki kality": "akaki kaliti",
    gulele: "gulelle",
    "kolfe keraniyo": "kolfe keranio",
    "kolfe keraneyo": "kolfe keranio",
    "nifas silk lafto": "nifas silk-lafto",
    "nefas silk lafto": "nifas silk-lafto",
  };
  const norm = (value: string) => addisAliases[value] ?? value;
  const nx = norm(x);
  const ny = norm(y);
  return nx === ny || nx.includes(ny) || ny.includes(nx);
}

/** Rough bounding box for Ethiopia (WGS84). */
export function isPlausibleEthiopiaCoordinate(lat: number, lon: number): boolean {
  return lat >= 3 && lat <= 15.5 && lon >= 33 && lon <= 48.5;
}

export type DistrictGeoCandidate = {
  regionId: number;
  region: string;
  districtId: number;
  district: string;
  latitude: number;
  longitude: number;
};

export function buildDistrictCandidatesFromRegions(
  regionList: Region[],
): DistrictGeoCandidate[] {
  const candidates: DistrictGeoCandidate[] = [];
  for (const region of regionList) {
    for (const district of region.districts ?? []) {
      const latitude = parseCoordinate(district.latitude);
      const longitude = parseCoordinate(district.longitude);
      if (latitude === null || longitude === null) continue;
      candidates.push({
        regionId: region.id,
        region: region.name,
        districtId: district.id,
        district: district.name,
        latitude,
        longitude,
      });
    }
  }
  return candidates;
}

export function findNearestDistrict(
  latitude: number,
  longitude: number,
  candidates: DistrictGeoCandidate[],
): (DistrictGeoCandidate & { distanceKm: number }) | null {
  if (!isPlausibleEthiopiaCoordinate(latitude, longitude) || candidates.length === 0) {
    return null;
  }

  let nearest: (DistrictGeoCandidate & { distanceKm: number }) | null = null;
  for (const row of candidates) {
    const distanceKm = haversineKm(latitude, longitude, row.latitude, row.longitude);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { ...row, distanceKm };
    }
  }
  return nearest;
}

export function resolveSelectionFromProfile(
  regionList: Region[],
  regionName?: string | null,
  districtName?: string | null,
): { regionId: string; districtId: string; region: string; district: string } | null {
  if (!regionName?.trim()) return null;
  const region =
    regionList.find((r) => regionsMatch(r.name, regionName)) ?? null;
  if (!region) return null;

  const district =
    districtName?.trim() &&
    region.districts?.find((d) => districtsMatch(d.name, districtName));

  return {
    regionId: String(region.id),
    districtId: district ? String(district.id) : "",
    region: region.name,
    district: district?.name ?? "",
  };
}

/** Browser/Wi‑Fi positions worse than this are flagged as approximate (match still applied). */
export const GPS_UNRELIABLE_ACCURACY_M = 50_000;
