export type AlertItem = {
  id: string;
  disease: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  advisory: string;
  status: "Draft" | "Approved";
  createdAt?: string;
};
