export type Disease = "Malaria" | "Cholera" | "Measles" | "Dengue";

export type CaseReport = {
  id: string;
  location: string;
  disease: Disease;
  cases: number;
  deaths: number;
  notes: string;
  submittedAt: string;
  submittedByRole: "hew" | "admin";
  status: "new" | "reviewed";
};

const REPORTS_KEY = "ethio-case-reports";

export function getCaseReports(): CaseReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(REPORTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CaseReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCaseReports(reports: CaseReport[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent("case-reports-updated"));
}

export function addCaseReport(
  report: Omit<CaseReport, "id" | "submittedAt" | "status">,
) {
  const next: CaseReport = {
    ...report,
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    submittedAt: new Date().toISOString(),
    status: "new",
  };

  const current = getCaseReports();
  saveCaseReports([next, ...current]);
}

export function markReportReviewed(id: string) {
  const updated = getCaseReports().map((item) =>
    item.id === id ? { ...item, status: "reviewed" as const } : item,
  );
  saveCaseReports(updated);
}
