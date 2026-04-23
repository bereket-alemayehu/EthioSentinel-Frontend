export type AlertItem = {
  id: number;
  disease: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  advisory: string;
  status: "Draft" | "Approved";
};
