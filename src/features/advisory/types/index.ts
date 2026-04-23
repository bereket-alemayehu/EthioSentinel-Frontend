import type { RiskLevel } from "@/types";

export interface District {
  id: number;
  name: string;
  latitude?: string | number;
  longitude?: string | number;
}

export interface Region {
  id: number;
  name: string;
  districts?: District[];
}

export interface Advisory {
  id: number;
  title: string;
  content: string;
  riskLevel: RiskLevel;
  status: string;
  regionId: number;
  districtId: number | null;
  disease?: {
    name: string;
  };
  region?: {
    name: string;
  };
  district?: {
    name: string;
  };
}

export interface SymptomResult {
  selectedSymptoms: string[];
  probableDisease: string;
  riskLevel: RiskLevel;
  advice: string;
  disclaimer: string;
  language: "ENGLISH" | "AMHARIC";
}
