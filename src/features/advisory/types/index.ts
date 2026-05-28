import type { RiskLevel } from "@/shared/types";

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
  id: number | string;
  title: string;
  content: string;
  /** Citizen-safe body from API when available */
  publicContent?: string;
  language?: string;
  diseaseType?: string;
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
  createdAt?: string | Date;
}

export interface SymptomResult {
  selectedSymptoms: string[];
  probableDisease: string;
  riskLevel: RiskLevel;
  advice: string;
  disclaimer: string;
  language: "ENGLISH" | "AMHARIC";
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  text: string;
  language: "ENGLISH" | "AMHARIC";
  createdAt: string | Date;
}
