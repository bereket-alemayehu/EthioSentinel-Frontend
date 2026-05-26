import { api } from "@/shared/lib/axios";

export type SuperAdminOverview = {
  totalUsers: number;
  activeUsers: number;
  totalReports: number;
  mortalityReports: number;
  pendingAlerts: number;
  totalAdvisories: number;
  draftAdvisories: number;
  totalAlerts: number;
  deliveredAlerts: number;
  anomalySignals: number;
  logins24h: number;
  failedLogins7d: number;
};

export type GovernanceUser = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  region: string;
  assignedDistrict: string | null;
  clearanceLevel: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogRow = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  /** Resolved from User when actorUserId is set (any user’s activity). */
  actorUsername?: string | null;
  actorDisplayEmail?: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
};

type Envelope<T> = { status: string; message: string; data: T };

export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const res = await api.get<Envelope<SuperAdminOverview>>("/super-admin/overview");
  return res.data.data;
}

export async function getSuperAdminUsers(): Promise<GovernanceUser[]> {
  const res = await api.get<Envelope<GovernanceUser[]>>("/super-admin/users");
  return res.data.data;
}

export async function getSuperAdminAuditLogs(params: {
  page?: number;
  limit?: number;
  action?: string;
  /** Comma-separated action codes (backend `actions` query). */
  actions?: string;
}): Promise<{
  data: AuditLogRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const res = await api.get<
    Envelope<{
      data: AuditLogRow[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  >("/super-admin/audit-logs", { params });
  return res.data.data;
}

export async function patchSuperAdminUser(
  id: string,
  body: Partial<{
    isActive: boolean;
    role: string;
    region: string;
    assignedDistrict: string | null;
    clearanceLevel: number | null;
    username: string;
    email: string;
  }>,
): Promise<GovernanceUser> {
  const res = await api.patch<Envelope<GovernanceUser>>(
    `/super-admin/users/${id}`,
    body,
  );
  return res.data.data;
}

export async function createSuperAdminUser(body: {
  email: string;
  password: string;
  username: string;
  role: string;
  region: string;
  assignedDistrict?: string | null;
  healthFacilityId?: number | null;
  phoneNumber?: string | null;
  isActive?: boolean;
}): Promise<GovernanceUser> {
  const res = await api.post<Envelope<GovernanceUser>>("/super-admin/users", body);
  return res.data.data;
}

export async function revokeSuperAdminUser(id: string): Promise<void> {
  await api.delete(`/super-admin/users/${id}`);
}

export async function resetSuperAdminUserPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await api.post(`/super-admin/users/${id}/reset-password`, { newPassword });
}

export async function downloadSuperAdminAuditLogsCsv(): Promise<void> {
  const response = await api.get("/super-admin/audit-logs", {
    params: { format: "csv" },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}
