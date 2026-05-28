import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuperAdminOverview,
  getSuperAdminUsers,
  getSuperAdminAuditLogs,
  patchSuperAdminUser,
  resetSuperAdminUserPassword,
  createSuperAdminUser,
  revokeSuperAdminUser,
  downloadSuperAdminAuditLogsCsv,
  type GovernanceUser,
  type AuditLogRow,
} from "@/features/super-admin/api/superAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Modal } from "@/shared/components/ui/Modal";
import { PasswordVisibilityToggle } from "@/shared/components/ui/PasswordVisibilityToggle";
import { cn } from "@/shared/utils/cn";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Download,
  Shield,
  KeyRound,
  UserPlus,
  Pencil,
  Ban,
  Microscope,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/shared/utils/formatDate";
import { toast } from "sonner";
import {
  getRegions,
  getDiseaseCatalog,
  createDiseaseApi,
  updateDiseaseApi,
  deleteDiseaseApi,
  type RegionListItem,
  type DiseaseCatalogItem,
} from "@/features/super-admin/api/catalog";
import { getHealthFacilities, type HealthFacility } from "@/features/citizen/api/publicHealth";
import { useAuth } from "@/app/providers/auth/AuthProvider";

const tabs = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "users" as const, label: "Users", icon: Users },
  { id: "diseases" as const, label: "Disease types", icon: Microscope },
  { id: "audit" as const, label: "Audit log", icon: ScrollText },
  { id: "access" as const, label: "Roles & access", icon: Shield },
] as const;

const ROLE_OPTIONS = [
  "CITIZEN",
  "HEW",
  "ADMIN",
  "RESEARCHER",
  "SUPER_ADMIN",
] as const;

type AuditFilter = "all" | "logins" | "reports" | "users" | "security" | "diseases";

const AUDIT_ACTION_GROUPS: Record<Exclude<AuditFilter, "all">, string> = {
  logins: "AUTH_LOGIN_SUCCESS,AUTH_LOGIN_FAILURE",
  reports: "REPORT_SUBMITTED,REPORT_UPDATED,REPORT_DELETED",
  users:
    "USER_CREATED_BY_SUPER_ADMIN,USER_UPDATED_BY_SUPER_ADMIN,USER_REVOKED_BY_SUPER_ADMIN",
  security:
    "AUTH_LOGIN_FAILURE,PASSWORD_CHANGED_SELF,SUPER_ADMIN_PASSWORD_RESET,USER_REVOKED_BY_SUPER_ADMIN",
  diseases: "DISEASE_CREATED,DISEASE_UPDATED,DISEASE_DELETED",
};

function formatActorLabel(row: AuditLogRow): string {
  if (row.actorUsername && (row.actorDisplayEmail || row.actorEmail)) {
    const em = row.actorDisplayEmail || row.actorEmail;
    return `${row.actorUsername} (${em})`;
  }
  if (row.actorUsername) return row.actorUsername;
  if (row.actorDisplayEmail) return row.actorDisplayEmail;
  if (row.actorEmail) return row.actorEmail;
  if (row.actorUserId) return `User ${row.actorUserId.slice(0, 8)}…`;
  return "System / unknown";
}

function auditSummary(row: AuditLogRow): string {
  const meta = row.metadata as { summary?: string } | null;
  if (meta && typeof meta.summary === "string" && meta.summary.trim()) {
    return meta.summary;
  }
  const actor = formatActorLabel(row);
  const res =
    row.resourceType && row.resourceId
      ? `${row.resourceType} ${row.resourceId}`
      : "";
  return [row.action.replace(/_/g, " "), actor, res].filter(Boolean).join(" · ");
}

function mergeRegionsForUser(
  userRegion: string | null | undefined,
  regions: RegionListItem[],
): RegionListItem[] {
  const trimmed = (userRegion ?? "").trim();
  if (!trimmed) return regions;
  const names = new Set(regions.map((r) => r.name));
  if (!names.has(trimmed)) {
    return [{ id: -1, name: trimmed, code: "legacy", districts: [] }, ...regions];
  }
  return regions;
}

export default function SuperAdminPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  const regionsQ = useQuery({
    queryKey: ["regions", "list"],
    queryFn: getRegions,
    staleTime: 5 * 60_000,
    enabled: tab === "users",
  });

  const facilitiesQ = useQuery({
    queryKey: ["health-facilities", "list"],
    queryFn: getHealthFacilities,
    staleTime: 5 * 60_000,
    enabled: tab === "users",
  });

  const overviewQ = useQuery({
    queryKey: ["super-admin", "overview"],
    queryFn: getSuperAdminOverview,
    enabled: tab === "overview",
  });

  const usersQ = useQuery({
    queryKey: ["super-admin", "users"],
    queryFn: getSuperAdminUsers,
    enabled: tab === "users" || tab === "access",
  });

  const auditQ = useQuery({
    queryKey: ["super-admin", "audit", auditFilter],
    queryFn: () =>
      getSuperAdminAuditLogs({
        page: 1,
        limit: 150,
        actions: auditFilter === "all" ? undefined : AUDIT_ACTION_GROUPS[auditFilter],
      }),
    enabled: tab === "audit",
  });

  const patchUser = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchSuperAdminUser>[1];
    }) => patchSuperAdminUser(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPwd = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) =>
      resetSuperAdminUserPassword(id, pwd),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      toast.success("Password reset; user must sign in again");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createUser = useMutation({
    mutationFn: createSuperAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "overview"] });
      toast.success("User registered");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeUser = useMutation({
    mutationFn: revokeSuperAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["super-admin", "overview"] });
      toast.success("User access revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/60 p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-teal-600 p-3 text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Super admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Governance, security, users, disease catalog, and audit
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-2 rounded-full",
                tab === t.id && "bg-teal-600 hover:bg-teal-700",
              )}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overviewQ.isLoading ? (
              <p className="text-sm text-slate-500 col-span-full">Loading…</p>
            ) : overviewQ.data ? (
              <>
                <StatCard title="Total users" value={overviewQ.data.totalUsers} />
                <StatCard title="Active users" value={overviewQ.data.activeUsers} />
                <StatCard title="Reports" value={overviewQ.data.totalReports} />
                <StatCard title="Mortality reports" value={overviewQ.data.mortalityReports} />
                <StatCard title="Pending alerts" value={overviewQ.data.pendingAlerts} />
                <StatCard title="Advisories (all)" value={overviewQ.data.totalAdvisories} />
                <StatCard title="Draft advisories" value={overviewQ.data.draftAdvisories} />
                <StatCard title="Alerts delivered" value={overviewQ.data.deliveredAlerts} />
                <StatCard title="Anomaly signals" value={overviewQ.data.anomalySignals} />
                <StatCard title="Logins (24h)" value={overviewQ.data.logins24h} />
                <StatCard title="Failed logins (7d)" value={overviewQ.data.failedLogins7d} />
              </>
            ) : null}
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Use the tabs above for user lifecycle, disease catalog, and audit trails.
              Regional disease maps, health guidance review, and illness trend tools are
              available on the dedicated admin operations dashboard (separate from this
              governance console).
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "users" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b dark:border-slate-800 flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Users & lifecycle</CardTitle>
            <RegisterUserButton
              busy={createUser.isPending}
              regions={regionsQ.data ?? []}
              regionsLoading={regionsQ.isLoading}
              healthFacilities={facilitiesQ.data ?? []}
              healthFacilitiesLoading={facilitiesQ.isLoading}
              onSubmit={(body) => createUser.mutate(body)}
            />
          </CardHeader>
          <CardContent className="p-0 overflow-auto max-h-[720px]">
            {usersQ.isLoading ? (
              <p className="p-8 text-sm text-slate-500">Loading…</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(usersQ.data ?? []).map((u) => (
                    <UserActionsRow
                      key={u.id}
                      user={u}
                      regions={regionsQ.data ?? []}
                      regionsLoading={regionsQ.isLoading}
                      currentUserId={me?.id}
                      busy={patchUser.isPending || resetPwd.isPending || revokeUser.isPending}
                      onToggleActive={() =>
                        patchUser.mutate({
                          id: u.id,
                          body: { isActive: !u.isActive },
                        })
                      }
                      onResetPassword={(pwd) => resetPwd.mutate({ id: u.id, pwd })}
                      onPatch={(body) => patchUser.mutate({ id: u.id, body })}
                      onRevoke={() => revokeUser.mutate(u.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "diseases" && <DiseasesGovernanceTab />}

      {tab === "audit" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Audit & security log</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Who did what across the platform (all accounts). Rows are enriched with usernames when
                the actor signed in with a user id.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => {
                void downloadSuperAdminAuditLogsCsv().catch((e: Error) =>
                  toast.error(e.message),
                );
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All events"],
                  ["logins", "Logins"],
                  ["reports", "Reports"],
                  ["users", "Users & roles"],
                  ["diseases", "Disease catalog"],
                  ["security", "Security"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={auditFilter === id ? "default" : "outline"}
                  className={cn(
                    "rounded-full text-xs",
                    auditFilter === id && "bg-teal-600 hover:bg-teal-700",
                  )}
                  onClick={() => setAuditFilter(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="overflow-auto max-h-[560px] rounded-xl border border-slate-200 dark:border-slate-800">
              {auditQ.isLoading ? (
                <p className="p-8 text-sm text-slate-500">Loading…</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">Summary</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(auditQ.data?.data ?? []).map((row: AuditLogRow) => (
                      <AuditRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "access" && (
        <RolesAccessTab
          users={usersQ.data ?? []}
          loading={usersQ.isLoading}
          onOpenUsers={() => setTab("users")}
        />
      )}
    </div>
  );
}

const ROLE_DEFINITIONS: Array<{
  role: string;
  summary: string;
  capabilities: string[];
}> = [
  {
    role: "SUPER_ADMIN",
    summary: "Platform governance plus full operational tools.",
    capabilities: [
      "This governance console (users, audit, disease catalog)",
      "Same API access as ADMIN on operations routes",
      "Create, update, revoke users",
    ],
  },
  {
    role: "ADMIN",
    summary: "Regional operations and approvals.",
    capabilities: [
      "Approve health guidance and alerts",
      "Map intelligence and analytics",
      "Trigger illness trend checks",
    ],
  },
  {
    role: "HEW",
    summary: "Field reporting.",
    capabilities: [
      "Submit and sync disease reports",
      "Offline batch upload",
      "District-scoped reporting",
    ],
  },
  {
    role: "RESEARCHER",
    summary: "Read-heavy analytics.",
    capabilities: [
      "View reports and geo analytics",
      "Run trend analysis tools",
    ],
  },
  {
    role: "CITIZEN",
    summary: "Public health information.",
    capabilities: [
      "View approved health guidance",
      "Health assistant chat",
      "Symptom checker",
    ],
  },
];

function RolesAccessTab({
  users,
  loading,
  onOpenUsers,
}: {
  users: GovernanceUser[];
  loading: boolean;
  onOpenUsers: () => void;
}) {
  const roleCounts = useMemo(() => {
    const counts = new Map<string, { total: number; active: number }>();
    for (const def of ROLE_DEFINITIONS) {
      counts.set(def.role, { total: 0, active: 0 });
    }
    for (const u of users) {
      const key = u.role.toUpperCase();
      const entry = counts.get(key) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (u.isActive) entry.active += 1;
      counts.set(key, entry);
    }
    return counts;
  }, [users]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-slate-200 dark:border-slate-800 shadow-lg lg:col-span-2">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Roles & access</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Permissions are enforced by role on each API route. Counts reflect registered users.
            </p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={onOpenUsers}>
            Manage users
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          {loading ? (
            <p className="p-8 text-sm text-slate-500">Loading users…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">What they can do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ROLE_DEFINITIONS.map((def) => {
                  const c = roleCounts.get(def.role) ?? { total: 0, active: 0 };
                  return (
                    <tr key={def.role} className="align-top">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                        {def.role}
                        <p className="mt-1 text-xs font-normal text-slate-500">{def.summary}</p>
                      </td>
                      <td className="px-6 py-4 tabular-nums">{c.active}</td>
                      <td className="px-6 py-4 tabular-nums">{c.total}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <ul className="list-disc pl-4 space-y-1">
                          {def.capabilities.map((cap) => (
                            <li key={cap}>{cap}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">How access is applied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Each HTTP route checks the signed-in user&apos;s role before running.</p>
          <p>
            To change someone&apos;s role, open <strong>Users</strong>, edit the account, and save.
            Revoked users cannot sign in.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Super admin handover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Create or promote another active SUPER_ADMIN under Users.</li>
            <li>Verify they can sign in and open this console.</li>
            <li>Demote or revoke your own account only after the successor is active.</li>
          </ol>
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link to="/settings">Open account security (password)</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DiseasesGovernanceTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DiseaseCatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiseaseCatalogItem | null>(null);

  const listQ = useQuery({
    queryKey: ["disease-catalog"],
    queryFn: getDiseaseCatalog,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["disease-catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["diseases"] });
    void queryClient.invalidateQueries({ queryKey: ["super-admin", "overview"] });
  };

  const createM = useMutation({
    mutationFn: createDiseaseApi,
    onSuccess: () => {
      invalidate();
      toast.success("Disease type created");
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Parameters<typeof updateDiseaseApi>[1];
    }) => updateDiseaseApi(id, body),
    onSuccess: () => {
      invalidate();
      toast.success("Disease updated");
      setEditTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: deleteDiseaseApi,
    onSuccess: () => {
      invalidate();
      toast.success("Disease removed from catalog");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <CardHeader className="border-b dark:border-slate-800 flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Disease types</CardTitle>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Maintain the national disease list: display name, classification code, URL slug, and
            clinical notes. Hiding a type removes it from HEW pickers; deleting removes the row
            (historical reports keep their text disease type).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-2 bg-teal-600 hover:bg-teal-700"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add disease type
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-auto max-h-[640px]">
        {listQ.isLoading ? (
          <p className="p-8 text-sm text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(listQ.data ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {d.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{d.code}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{d.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={d.isActive ? "default" : "secondary"}>
                      {d.isActive ? "Visible" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditTarget(d)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updateM.isPending}
                        onClick={() =>
                          updateM.mutate({ id: d.id, body: { isActive: !d.isActive } })
                        }
                      >
                        {d.isActive ? "Hide" : "Show"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => setDeleteTarget(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>

      <DiseaseFormModal
        title="Add disease type"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={createM.isPending}
        initial={null}
        onSubmit={(body) => createM.mutate(body)}
      />

      <DiseaseFormModal
        title="Edit disease type"
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        busy={updateM.isPending}
        initial={editTarget}
        onSubmit={(body) => {
          if (!editTarget) return;
          updateM.mutate({ id: editTarget.id, body });
        }}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete disease type"
      >
        {deleteTarget ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Permanently remove <strong>{deleteTarget.name}</strong> ({deleteTarget.code}) from the
              catalog? Linked alerts will detach; existing reports keep their disease name text.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteM.isPending}
                onClick={() => {
                  if (deleteTarget) deleteM.mutate(deleteTarget.id);
                }}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </Card>
  );
}

function DiseaseFormModal({
  title,
  open,
  onClose,
  busy,
  initial,
  onSubmit,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  busy: boolean;
  initial: DiseaseCatalogItem | null;
  onSubmit: (body: {
    name: string;
    code: string;
    slug?: string;
    description?: string;
    symptomProfile?: string;
    isActive?: boolean;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [symptomProfile, setSymptomProfile] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setCode(initial.code);
      setSlug(initial.slug);
      setDescription(initial.description ?? "");
      setSymptomProfile(initial.symptomProfile ?? "");
      setIsActive(initial.isActive);
    } else {
      setName("");
      setCode("");
      setSlug("");
      setDescription("");
      setSymptomProfile("");
      setIsActive(true);
    }
  }, [open, initial]);

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !code.trim()) {
            toast.error("Name and code are required");
            return;
          }
          const payload: {
            name: string;
            code: string;
            slug?: string;
            description?: string;
            symptomProfile?: string;
            isActive?: boolean;
          } = {
            name: name.trim(),
            code: code.trim(),
            description: description.trim() || undefined,
            symptomProfile: symptomProfile.trim() || undefined,
          };
          if (slug.trim()) payload.slug = slug.trim();
          if (initial) {
            payload.isActive = isActive;
          }
          onSubmit(payload);
        }}
      >
        <LabeledInput
          label="Disease name"
          value={name}
          onChange={setName}
          required
          placeholder="e.g. Malaria"
        />
        <LabeledInput
          label="Classification code"
          value={code}
          onChange={setCode}
          required
          placeholder="e.g. MAL-12"
        />
        <LabeledInput
          label="URL slug (optional)"
          value={slug}
          onChange={setSlug}
          placeholder="Leave blank to auto-generate from name"
        />
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Description / category</span>
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Clinical summary, surveillance category, or public-facing description"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase">Symptom profile (optional)</span>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            value={symptomProfile}
            onChange={(e) => setSymptomProfile(e.target.value)}
            placeholder="Key signs for triage or AI prompts"
          />
        </div>
        {initial ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Visible in disease pickers (HEW / reporting)
          </label>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-5 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-50 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-md">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="rounded-xl bg-teal-600/10 p-2 text-teal-700 dark:text-teal-400">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {description}
          </p>
          <div className="pt-2">{action}</div>
        </div>
      </CardHeader>
    </Card>
  );
}

function AuditRow({ row }: { row: AuditLogRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
        onClick={() => setOpen(true)}
      >
        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
          {formatDate(row.createdAt)}
        </td>
        <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200 max-w-md">
          {auditSummary(row)}
        </td>
        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{row.action}</td>
        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">
          <span className="line-clamp-2">{formatActorLabel(row)}</span>
        </td>
      </tr>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Audit detail">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3 text-xs space-y-1">
            <p>
              <span className="font-bold text-slate-500">Time</span>{" "}
              {formatDate(row.createdAt)}
            </p>
            <p>
              <span className="font-bold text-slate-500">Action</span> {row.action}
            </p>
            <p>
              <span className="font-bold text-slate-500">Actor</span>{" "}
              {formatActorLabel(row)}
            </p>
            <p>
              <span className="font-bold text-slate-500">Resource</span>{" "}
              {row.resourceType && row.resourceId
                ? `${row.resourceType}:${row.resourceId}`
                : "—"}
            </p>
            <p>
              <span className="font-bold text-slate-500">IP</span> {row.ipAddress || "—"}
            </p>
            <p className="break-all">
              <span className="font-bold text-slate-500">User-Agent</span>{" "}
              {row.userAgent || "—"}
            </p>
          </div>
          <p className="text-xs font-bold uppercase text-slate-500">Metadata (JSON)</p>
          <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 text-teal-100 p-3 text-[11px] leading-relaxed">
            {JSON.stringify(row.metadata ?? {}, null, 2)}
          </pre>
        </div>
      </Modal>
    </>
  );
}

function RegisterUserButton({
  busy,
  regions,
  regionsLoading,
  healthFacilities,
  healthFacilitiesLoading,
  onSubmit,
}: {
  busy: boolean;
  regions: RegionListItem[];
  regionsLoading: boolean;
  healthFacilities: HealthFacility[];
  healthFacilitiesLoading: boolean;
  onSubmit: (body: {
    email: string;
    password: string;
    username: string;
    role: string;
    region: string;
    isActive: boolean;
    healthFacilityId?: number | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [role, setRole] = useState<string>("CITIZEN");
  const [isActive, setIsActive] = useState(true);
  const [healthFacilityId, setHealthFacilityId] = useState("");
  const selectedFacility = useMemo(
    () => healthFacilities.find((item) => String(item.id) === healthFacilityId) ?? null,
    [healthFacilities, healthFacilityId],
  );

  const regionFacilities = useMemo(
    () => healthFacilities.filter((facility) => facility.Region === region),
    [healthFacilities, region],
  );

  const [facilityQuery, setFacilityQuery] = useState("");
  const [showFacilityList, setShowFacilityList] = useState(false);

  useEffect(() => {
    setHealthFacilityId("");
    setFacilityQuery("");
    setShowFacilityList(false);
  }, [region]);

  useEffect(() => {
    if (!healthFacilityId) return;
    const facility = healthFacilities.find((item) => String(item.id) === healthFacilityId);
    if (facility && facility.Region !== region) {
      setRegion(facility.Region);
    }
  }, [healthFacilityId, healthFacilities, region]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="gap-2 bg-teal-600 hover:bg-teal-700"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        Register user
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Register user">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const finalRegion = role === "HEW" && selectedFacility ? selectedFacility.Region : region;
            if (role === "HEW" && !healthFacilityId) {
              toast.error("Select a health center");
              return;
            }
            if (!finalRegion) {
              toast.error("Select a region");
              return;
            }
            onSubmit({
              email,
              username,
              password,
              role,
              region: finalRegion,
              isActive,
              healthFacilityId: healthFacilityId ? Number(healthFacilityId) : null,
            });
            setOpen(false);
            setPassword("");
          }}
        >
          <LabeledInput label="Email" value={email} onChange={setEmail} type="email" required />
          <LabeledInput label="Username" value={username} onChange={setUsername} required />
          <LabeledInput
            label="Temporary password"
            value={password}
            onChange={setPassword}
            type="password"
            required
            minLength={8}
          />
          {role === "HEW" ? (
            <div className="space-y-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 p-3">
              <RegionSelect
                label="Region"
                value={region}
                onChange={setRegion}
                regions={regions}
                disabled={regionsLoading}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Health center</label>
                <div className="relative">
                  <input
                    value={facilityQuery || (selectedFacility ? selectedFacility.HF_Name : "")}
                    onChange={(e) => setFacilityQuery(e.target.value)}
                    onFocus={() => setShowFacilityList(true)}
                    placeholder={!region ? "Select region first" : "Search health centers by name or district"}
                    disabled={!region || healthFacilitiesLoading}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-60"
                  />

                  {showFacilityList && region && (
                    <ul className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:bg-slate-900">
                      {regionFacilities
                        .filter((f) => {
                          const q = facilityQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            f.HF_Name.toLowerCase().includes(q) ||
                            (f.Woreda || "").toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 200)
                        .map((facility) => (
                          <li
                            key={facility.id}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              setHealthFacilityId(String(facility.id));
                              setFacilityQuery(facility.HF_Name);
                              setShowFacilityList(false);
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <div className="font-semibold">{facility.HF_Name}</div>
                            <div className="text-xs text-slate-500">{facility.Woreda} • {facility.Zone}</div>
                          </li>
                        ))}
                      {regionFacilities.filter((f) => {
                        const q = facilityQuery.trim().toLowerCase();
                        return !q || f.HF_Name.toLowerCase().includes(q) || (f.Woreda || "").toLowerCase().includes(q);
                      }).length === 0 && (
                        <li className="px-3 py-2 text-xs text-slate-500">No health centers found</li>
                      )}
                    </ul>
                  )}
                </div>
                {selectedFacility && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    Assigning {selectedFacility.HF_Name} — {selectedFacility.Region} · {selectedFacility.Woreda}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <RegionSelect
              label="Region"
              value={region}
              onChange={setRegion}
              regions={regions}
              disabled={regionsLoading}
              required
            />
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Role</label>
            <select
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active immediately (uncheck to require activation later)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || regionsLoading}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function RegionSelect({
  label,
  value,
  onChange,
  regions,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  regions: RegionListItem[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
      <select
        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm disabled:opacity-60"
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{disabled ? "Loading regions…" : "Select region"}</option>
        {regions.map((r) => (
          <option key={r.id} value={r.name}>
            {r.name} ({r.code})
          </option>
        ))}
      </select>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
      <div className="relative">
        <Input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          className={cn("h-10", isPassword && "pr-11")}
        />
        {isPassword ? (
          <PasswordVisibilityToggle
            visible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            className="right-3"
          />
        ) : null}
      </div>
    </div>
  );
}

function UserActionsRow({
  user,
  regions,
  regionsLoading,
  currentUserId,
  busy,
  onToggleActive,
  onResetPassword,
  onPatch,
  onRevoke,
}: {
  user: GovernanceUser;
  regions: RegionListItem[];
  regionsLoading: boolean;
  currentUserId?: string;
  busy: boolean;
  onToggleActive: () => void;
  onResetPassword: (pwd: string) => void;
  onPatch: (body: Parameters<typeof patchSuperAdminUser>[1]) => void;
  onRevoke: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [pwd, setPwd] = useState("");

  const isSelf = currentUserId === user.id;

  return (
    <>
      <tr>
        <td className="px-4 py-3">
          <div className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</div>
          <div className="text-xs text-slate-500">{user.email ?? user.phoneNumber ?? "—"}</div>
        </td>
        <td className="px-4 py-3">
          <Badge variant="secondary">{user.role}</Badge>
        </td>
        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
          {user.region ?? "—"}
          {user.assignedDistrict ? ` · ${user.assignedDistrict}` : ""}
        </td>
        <td className="px-4 py-3">
          <Badge variant={user.isActive ? "default" : "destructive"}>
            {user.isActive ? "Active" : "Suspended"}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onToggleActive}
            >
              {user.isActive ? "Suspend" : "Activate"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1"
              disabled={busy}
              onClick={() => setResetOpen(true)}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-1"
              disabled={busy || isSelf}
              onClick={() => setRevokeOpen(true)}
            >
              <Ban className="h-3.5 w-3.5" />
              Revoke access
            </Button>
          </div>
        </td>
      </tr>

      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset password">
        <p className="text-sm text-slate-500 mb-3">
          Set a new password for <strong>{user.email}</strong>. All active sessions for this user will
          end.
        </p>
        <div className="space-y-3">
          <LabeledInput label="New password" value={pwd} onChange={setPwd} type="password" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pwd.length < 8 || busy}
              onClick={() => {
                onResetPassword(pwd);
                setPwd("");
                setResetOpen(false);
              }}
            >
              Apply reset
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={revokeOpen} onClose={() => setRevokeOpen(false)} title="Revoke access">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          This deactivates the account and invalidates all sessions for{" "}
          <strong>{user.email}</strong>. Historical audit entries are kept.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setRevokeOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              onRevoke();
              setRevokeOpen(false);
            }}
          >
            Revoke
          </Button>
        </div>
      </Modal>

      <EditUserModal
        user={user}
        regions={regions}
        regionsLoading={regionsLoading}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        busy={busy}
        onSave={onPatch}
      />
    </>
  );
}

function EditUserModal({
  user,
  regions,
  regionsLoading,
  open,
  onClose,
  busy,
  onSave,
}: {
  user: GovernanceUser;
  regions: RegionListItem[];
  regionsLoading: boolean;
  open: boolean;
  onClose: () => void;
  busy: boolean;
  onSave: (body: Parameters<typeof patchSuperAdminUser>[1]) => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? "");
  const [region, setRegion] = useState(user.region ?? "");
  const [role, setRole] = useState(user.role);

  const regionOptions = mergeRegionsForUser(user.region, regions);

  useEffect(() => {
    if (open) {
      setUsername(user.username);
      setEmail(user.email ?? "");
      setRegion(user.region ?? "");
      setRole(user.role);
    }
  }, [open, user.id, user.username, user.email, user.region, user.role]);

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit user">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!region) {
            toast.error("Select a region");
            return;
          }
          const body: Parameters<typeof patchSuperAdminUser>[1] = {};
          if (username !== user.username) body.username = username;
          if (email !== user.email) body.email = email;
          const priorRegion = user.region ?? "";
          if (region !== priorRegion) body.region = region;
          if (role !== user.role) body.role = role;
          if (Object.keys(body).length === 0) {
            toast.message("No changes to save");
            return;
          }
          onSave(body);
          onClose();
        }}
      >
        <LabeledInput label="Username" value={username} onChange={setUsername} required />
        <LabeledInput label="Email" value={email} onChange={setEmail} type="email" required />
        <RegionSelect
          label="Region"
          value={region}
          onChange={setRegion}
          regions={regionOptions}
          disabled={regionsLoading}
          required
        />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Role</label>
          <select
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
