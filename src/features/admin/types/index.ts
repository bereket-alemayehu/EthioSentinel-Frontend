export type AlertItem = {
  id: string;
  title?: string;
  message?: string;
  disease: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  channel?: string;
  advisory: string;
  advisoryId?: string | null;
  advisoryTitle?: string | null;
  targetZone?: string;
  aiSuggested?: boolean;
  sourceReportId?: string | null;
  status: "Pending" | "Active" | "Rejected";
  createdAt?: string;
};

export type AdminAdvisoryItem = {
  id: string;
  title: string;
  content: string;
  diseaseType: string;
  riskLevel: string;
  status: string;
  language?: string;
  generatedByAI?: boolean;
  createdAt?: string;
  approvedAt?: string | null;
  updatedAt?: string;
  region?: { id: number; name: string } | null;
  district?: { id: number; name: string } | null;
  sourceReport?: {
    id: string;
    diseaseType: string;
    district: string;
    timestamp: string;
  } | null;
  approvedBy?: { id: string; username: string; email: string } | null;
};
