export type District = {
  id: number;
  name: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export type Region = {
  id: number;
  name: string;
  districts: District[];
};

export type Advisory = {
  id: number;
  diseaseId: number;
  regionId: number;
  districtId: number | null;
  title: string;
  content: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  status: "DRAFT" | "APPROVED" | "REJECTED" | "ARCHIVED";
  disease?: { id: number; name: string };
  district?: { id: number; name: string } | null;
};

export type RiskLevel = Advisory["riskLevel"];

export type SymptomResult = {
  selectedSymptoms: string[];
  probableDisease: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  advice: string;
  disclaimer: string;
  language: "ENGLISH" | "AMHARIC";
};
