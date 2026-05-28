import { api } from "@/shared/lib/axios";
import type { RiskLevel } from "@/shared/types";

export interface RegionHealthStatus {
  regionId: number;
  region: string;
  districtCount: number;
  totalCases: number;
  totalDeaths: number;
  reportCount: number;
  spikeCount: number;
  riskLevel: RiskLevel;
  topDiseases: Array<{ diseaseType: string; cases: number }>;
  districts: Array<{
    districtId: number;
    district: string;
    latitude: string | null;
    longitude: string | null;
    totalCases: number;
    totalDeaths: number;
    reportCount: number;
    spikeCount: number;
    riskLevel: RiskLevel;
    topDiseases: Array<{ diseaseType: string; cases: number }>;
  }>;
}

export interface EthiopiaRegionalStatusResponse {
  windowDays: number;
  source: string;
  data: RegionHealthStatus[];
  totals: {
    cases: number;
    deaths: number;
    reports: number;
    spikes: number;
  };
}

export interface OutbreakNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt: string | null;
  source: "WHO" | "WHO Africa" | "Google News";
  scope: "GLOBAL" | "AFRICA" | "ETHIOPIA";
  diseases: string[];
  countries: string[];
}

export interface HealthFacility {
  id: number;
  HF_Name: string;
  HF_Type: string;
  Region: string;
  Zone: string;
  Woreda: string;
  Y: number | null; // latitude
  X: number | null; // longitude
  regionId: number | null;
  districtId: number | null;
  Status: string | null;
}

export interface HealthFacilityWithIndicators extends HealthFacility {
  totalCases: number;
  totalDeaths: number;
  totalReports: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  topDiseases: Array<{
    diseaseType: string;
    cases: number;
    reports: number;
  }>;
}

export const getEthiopiaRegionalStatus = async (
  days = 30,
): Promise<EthiopiaRegionalStatusResponse> => {
  const response = await api.get<{ data: EthiopiaRegionalStatusResponse }>(
    "/public-health/ethiopia/regions/status",
    { params: { days } },
  );
  return response.data.data;
};

export const getOutbreakNews = async (): Promise<OutbreakNewsItem[]> => {
  const response = await api.get<{ data: OutbreakNewsItem[] }>(
    "/public-health/outbreak-news",
  );
  return response.data.data;
};

export const getHealthFacilities = async (): Promise<HealthFacility[]> => {
  const response = await api.get<{ data: HealthFacility[] }>(
    "/health/facilities",
  );
  return response.data.data;
};

export const getHealthFacilitiesWithIndicators = async (
  days = 30,
): Promise<HealthFacilityWithIndicators[]> => {
  const response = await api.get<{ data: HealthFacilityWithIndicators[] }>(
    "/health/facilities/with-indicators",
    { params: { days } },
  );
  return response.data.data;
};
