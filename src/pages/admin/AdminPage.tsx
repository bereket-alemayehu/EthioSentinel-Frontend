import { useState } from "react";
import { useAlerts, useUpdateAlertStatusMutation, useGeoStats } from "@/features/admin/hooks/useAdmin";
import { useAdvisoryDrafts, useApprovedAdvisories, useUpdateAdvisoryStatusMutation } from "@/features/admin/hooks/useAdvisoryActions";
import type { AlertItem } from "@/features/admin/types";
import type { GeoStat } from "@/features/admin/api";
import { Heatmap } from "@/features/admin/components/Heatmap";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Bell, 
  Map as MapIcon, 
  ChevronRight, 
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Database,
  FileText,
  Trash2,
  Clock,
  CheckCircle,
  Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Severity helpers ─────────────────────────────────────────────────────────
function getSeverityLevel(level: AlertItem["severity"]) {
  if (level === "CRITICAL") return { variant: "destructive", color: "text-red-700", bg: "bg-red-50", icon: <XCircle className="w-3.5 h-3.5" /> };
  if (level === "HIGH")     return { variant: "warning", color: "text-orange-700", bg: "bg-orange-50", icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  if (level === "MEDIUM")   return { variant: "default", color: "text-amber-700", bg: "bg-amber-50", icon: <Activity className="w-3.5 h-3.5" /> };
  return { variant: "success", color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
}

// ── District breakdown helpers ───────────────────────────────────────────────
type DistrictDiseaseStat = {
  disease: string;
  cases: number;
  deaths: number;
  reports: number;
};

function aggregateByDistrict(geoStats: GeoStat[]) {
  const map = new Map<string, { totalCases: number; totalDeaths: number; reportCount: number; diseaseRows: DistrictDiseaseStat[] }>();
  geoStats.forEach((s) => {
    if (!map.has(s.district)) {
      map.set(s.district, { totalCases: 0, totalDeaths: 0, reportCount: 0, diseaseRows: [] });
    }
    const entry = map.get(s.district)!;
    entry.totalCases  += s.totalCases;
    entry.totalDeaths += s.totalDeaths;
    entry.reportCount += s.reportCount;
    entry.diseaseRows.push({ disease: s.diseaseType, cases: s.totalCases, deaths: s.totalDeaths, reports: s.reportCount });
  });
  return [...map.entries()]
    .map(([district, stats]) => ({ district, ...stats }))
    .sort((a, b) => b.totalCases - a.totalCases);
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"alerts" | "advisories" | "map">("alerts");
  const { data: alerts = [], isLoading: loading, error: queryError } = useAlerts();
  const [advisorySubTab, setAdvisorySubTab] = useState<"pending" | "approved">("pending");
  const { data: advisoryDrafts = [], isLoading: advisoriesLoading } = useAdvisoryDrafts();
  const { data: approvedAdvisories = [], isLoading: approvedLoading } = useApprovedAdvisories();
  const { data: geoStats = [], isLoading: geoLoading } = useGeoStats();
  const updateMutation = useUpdateAlertStatusMutation();
  const updateAdvisoryMutation = useUpdateAdvisoryStatusMutation();

  const handleUpdate = async (id: number | string, action: "approve" | "reject") => {
    try { await updateMutation.mutateAsync({ id, action }); }
    catch (err) { console.error("Action failed", err); }
  };

  const handleAdvisoryUpdate = async (id: string, action: "approve" | "reject" | "withdraw") => {
    try { await updateAdvisoryMutation.mutateAsync({ id, action }); }
    catch (err) { console.error("Action failed", err); }
  };

  const error = queryError?.message || updateMutation.error?.message || "";
  const actionLoadingId = updateMutation.isPending ? String(updateMutation.variables?.id) : null;

  const totalReports    = geoStats.reduce((acc, c) => acc + c.reportCount, 0);
  const totalCases      = geoStats.reduce((acc, c) => acc + c.totalCases, 0);
  const highRiskDistricts = aggregateByDistrict(geoStats).filter((d) => d.totalCases > 50).length;
  const districtList    = aggregateByDistrict(geoStats);
  const maxCases        = districtList[0]?.totalCases ?? 1;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/60 font-sans">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-900/20"
                 style={{ background: "linear-gradient(135deg,#0f6b7c,#2e8b57)" }}>
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {t("adminOversight")}
              </h1>
              <p className="mt-1.5 text-slate-500 text-sm font-medium">{t("adminOversightDesc")}</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm gap-1.5">
          {(["alerts", "advisories", "map"] as const).map((tab) => {
            const isActive = activeTab === tab;
            let Icon = Bell;
            if (tab === "advisories") Icon = FileText;
            if (tab === "map") Icon = MapIcon;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-[#0f6b7c] text-white shadow-lg shadow-teal-900/10 scale-[1.02]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 transition-transform", isActive ? "scale-110" : "")} />
                {tab === "alerts" ? t("alertApprovals") : tab === "advisories" ? "Advisories" : t("diseaseHeatmap")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: ALERT APPROVALS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "alerts" && (
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-500 border-none">
          <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                Pending Alert Approvals
              </CardTitle>
              <p className="text-sm text-slate-500 font-medium">Review and authorize system-generated advisories</p>
            </div>
            {!loading && (
              <Badge variant="secondary" className="px-3.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border-teal-100 italic">
                {alerts.length} pending
              </Badge>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto max-h-[720px]">
              <table className="w-full">
                <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-xl border-b z-10">
                  <tr className="text-left">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Severity</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">🦠 Disease</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Advisory Summary</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                          <span className="text-sm font-bold text-slate-400 tracking-wide">{t("loadingRecentAlerts")}</span>
                        </div>
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center px-8">
                        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 text-lg">{t("noPendingAlerts")}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">All alerts have been reviewed and processed by the system.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert) => {
                      const sev = getSeverityLevel(alert.severity);
                      return (
                        <tr key={alert.id} className="group hover:bg-slate-50/60 transition-all cursor-default">
                          <td className="px-8 py-6">
                            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-tighter border shadow-xs", sev.bg, sev.color, "border-current/10")}>
                              {sev.icon}
                              {alert.severity}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-[15px]">{alert.disease || "Global Advisory"}</span>
                              <span className="text-[10px] font-mono text-slate-400 mt-1 opacity-60">REF-{alert.id.toString().padStart(6, '0')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 max-w-md">
                            <p className="text-slate-600 leading-relaxed text-sm line-clamp-3 font-medium">
                              {alert.advisory}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
                              alert.status === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", alert.status === "Approved" ? "bg-emerald-500" : "bg-amber-500")} />
                              {alert.status === "Approved" ? "Authorized" : "Awaiting Review"}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <button
                                type="button"
                                onClick={() => void handleUpdate(alert.id, "approve")}
                                disabled={actionLoadingId === String(alert.id)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                title="Approve"
                              >
                                {actionLoadingId === String(alert.id) && updateMutation.variables?.action === "approve" ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleUpdate(alert.id, "reject")}
                                disabled={actionLoadingId === String(alert.id)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 transition-all active:scale-95"
                                title="Reject"
                              >
                                {actionLoadingId === String(alert.id) && updateMutation.variables?.action === "reject" ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <XCircle className="w-5 h-5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: ADVISORY MANAGEMENT
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "advisories" && (
        <div className="space-y-6">
          {/* Sub-tabs for Advisories */}
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setAdvisorySubTab("pending")}
              className={cn(
                "pb-3 px-2 text-sm font-bold transition-all relative",
                advisorySubTab === "pending" ? "text-teal-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Drafts
                <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-600">
                  {advisoryDrafts.length}
                </Badge>
              </div>
              {advisorySubTab === "pending" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setAdvisorySubTab("approved")}
              className={cn(
                "pb-3 px-2 text-sm font-bold transition-all relative",
                advisorySubTab === "approved" ? "text-teal-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approved List
                <Badge variant="secondary" className="ml-1 bg-teal-50 text-teal-700">
                  {approvedAdvisories.length}
                </Badge>
              </div>
              {advisorySubTab === "approved" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
            </button>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-none">
            <CardHeader className="bg-white border-b px-8 py-6 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {advisorySubTab === "pending" ? "Health Advisory Drafts" : "Published Advisories"}
                </CardTitle>
                <p className="text-sm text-slate-500 font-medium">
                  {advisorySubTab === "pending" 
                    ? "Review and publish public health advisories for citizens" 
                    : "Currently visible to citizens on their dashboard"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-auto max-h-[720px]">
                <table className="w-full">
                  <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-xl border-b z-10">
                    <tr className="text-left">
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Risk Level</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Disease & Location</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Advisory Content</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {advisoriesLoading || approvedLoading ? (
                      <tr>
                        <td colSpan={4} className="py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                            <span className="text-sm font-bold text-slate-400 tracking-wide">Syncing...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (advisorySubTab === "pending" ? advisoryDrafts : approvedAdvisories).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-32 text-center px-8">
                          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                              <ShieldCheck className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-slate-800 text-lg">No {advisorySubTab} items</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">No advisories found in this category.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (advisorySubTab === "pending" ? advisoryDrafts : approvedAdvisories).map((advisory: any) => {
                        const sev = getSeverityLevel(advisory.riskLevel);
                        return (
                          <tr key={advisory.id} className="group hover:bg-slate-50/60 transition-all cursor-default">
                            <td className="px-8 py-6">
                              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-tighter border shadow-xs", sev.bg, sev.color, "border-current/10")}>
                                {sev.icon}
                                {advisory.riskLevel}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-[15px]">{advisory.diseaseType}</span>
                                <span className="text-[11px] text-slate-500 mt-1">
                                  {advisory.district?.name || advisory.region?.name || "National"}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 max-w-md">
                              <div className="space-y-1">
                                <p className="text-slate-800 font-bold text-sm">{advisory.title}</p>
                                <p className="text-slate-500 leading-relaxed text-[13px] line-clamp-2">
                                  {advisory.content}
                                </p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                {advisorySubTab === "pending" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleAdvisoryUpdate(advisory.id, "approve")}
                                      disabled={updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id}
                                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                      title="Publish"
                                    >
                                      {updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id && updateAdvisoryMutation.variables?.action === "approve" ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleAdvisoryUpdate(advisory.id, "reject")}
                                      disabled={updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id}
                                      className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"
                                      title="Delete"
                                    >
                                      {updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id && updateAdvisoryMutation.variables?.action === "reject" ? (
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                      ) : (
                                        <Trash2 className="w-5 h-5" />
                                      )}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void handleAdvisoryUpdate(advisory.id, "withdraw")}
                                    disabled={updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id}
                                    className="h-9 px-4 flex items-center gap-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-95 text-xs font-bold"
                                    title="Withdraw"
                                  >
                                    {updateAdvisoryMutation.isPending && updateAdvisoryMutation.variables?.id === advisory.id && updateAdvisoryMutation.variables?.action === "withdraw" ? (
                                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Undo2 className="w-4 h-4" />
                                        Withdraw
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: DISEASE HEATMAP
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "map" && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, label: "Districts Tracked", value: districtList.length, sub: "Surveillance Active", color: "from-teal-600 to-teal-800" },
              { icon: AlertTriangle, label: "High-Risk Areas", value: highRiskDistricts, sub: "Threshold > 50 cases", color: "from-orange-500 to-orange-700" },
              { icon: Activity, label: "Cumulative Cases", value: totalCases.toLocaleString(), sub: `From ${totalReports} data points`, color: "from-red-600 to-red-800" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <Card key={label} className="group relative overflow-hidden border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/70 transition-all duration-500 hover:-translate-y-1">
                <CardContent className="p-0">
                  <div className={cn("absolute right-0 top-0 w-32 h-32 -mr-8 -mt-8 bg-linear-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full", color.split(' ')[0])} />
                  <div className="p-7 flex items-center gap-6 relative z-10">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-linear-to-br", color)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                      <div className="text-[10px] text-slate-400 font-medium italic">{sub}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Two-column map + district list ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* Map panel */}
            <Card className="shadow-2xl shadow-slate-200/40 border-none overflow-hidden">
              <CardHeader className="px-8 py-6 border-b flex flex-row items-center justify-between bg-white relative">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-teal-600" />
                    Disease Distribution Intelligence
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-medium italic">Geospatial mapping of reported outbreaks across Ethiopian provinces</p>
                </div>
                {geoLoading && (
                  <div className="flex items-center gap-3 text-[10px] font-black text-teal-600 uppercase tracking-widest">
                    <div className="h-3 w-3 border-2 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                    Syncing...
                  </div>
                )}
              </CardHeader>

              <div className="relative">
                {geoLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px] transition-all">
                    <div className="bg-white/80 p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4 border-none">
                      <div className="h-10 w-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{t("renderingGeo")}</span>
                    </div>
                  </div>
                )}
                <div className="p-0">
                  <Heatmap data={geoStats} />
                </div>
              </div>
            </Card>

            {/* District breakdown panel */}
            <Card className="shadow-2xl shadow-slate-200/40 flex flex-col h-[680px] border-none">
              <CardHeader className="px-8 py-6 border-b bg-white shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <CardTitle className="text-lg font-black text-slate-800">Hotspot Analysis</CardTitle>
                  <Database className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Prioritized by outbreak intensity (Case count)</p>
              </CardHeader>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-100 px-4">
                {geoLoading ? (
                  <div className="flex flex-col items-center justify-center gap-4 h-full text-slate-400">
                    <div className="h-8 w-8 border-3 border-slate-100 border-t-teal-500 rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest italic leading-none">Scanning Databases…</span>
                  </div>
                ) : districtList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 h-full opacity-40">
                    <Search className="w-12 h-12 text-slate-300" />
                    <div className="text-xs font-bold uppercase tracking-[0.2em]">Zero Hazards Detected</div>
                  </div>
                ) : (
                  districtList.map((d, idx) => {
                    const isHazard = d.totalCases >= 100;
                    return (
                      <div key={d.district} className={cn(
                        "group px-4 py-5 transition-all relative border-l-4 border-transparent",
                        isHazard ? "hover:border-red-500" : "hover:border-teal-500"
                      )}>
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:scale-110",
                            idx === 0 ? "bg-red-600 text-white shadow-red-200" :
                            idx === 1 ? "bg-orange-500 text-white shadow-orange-200" :
                            idx === 2 ? "bg-amber-500 text-white shadow-amber-200" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="font-bold text-slate-900 text-[15px] truncate group-hover:text-[#0f6b7c] transition-colors">{d.district}</span>
                              <Badge variant={isHazard ? "destructive" : "success"} className="text-[9px] font-black uppercase px-2 tracking-tighter italic border-none h-5">
                                {isHazard ? "Extreme" : "Monitored"}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 mb-4">
                              {d.diseaseRows.map((dr) => (
                                <div key={dr.disease} className="flex items-center justify-between group/row p-2 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                  <span className="text-[10px] font-black text-slate-700 tracking-wide">{dr.disease}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <Activity className="w-2.5 h-2.5 text-orange-500" />
                                      <span className="text-[10px] font-bold text-slate-800">{dr.cases}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] font-bold text-red-600 opacity-80 decoration-slate-300">💀 {dr.deaths}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Intensity Visualizer */}
                            <div className="space-y-2">
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                                <div
                                  className={cn("h-1.5 rounded-full transition-all duration-1000 ease-out shadow-xs", isHazard ? "bg-red-500" : "bg-teal-500")}
                                  style={{
                                    width: `${Math.min(100, (d.totalCases / maxCases) * 100)}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                <div className="flex gap-2">
                                  <span>{d.totalCases} cases</span>
                                  <span className="opacity-30">•</span>
                                  <span className={cn(d.totalDeaths > 0 ? "text-red-500" : "")}>{d.totalDeaths} fatalities</span>
                                </div>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* ── Intelligence Deck ──────────────────────────────── */}
          <Card className="border-none shadow-2xl p-8 overflow-hidden relative"
                style={{ background: "linear-gradient(135deg,#0d414d,#0f6b7c,#167554)" }}>
            <div className="absolute right-0 bottom-0 opacity-[0.08] translate-x-1/4 translate-y-1/4 select-none pointer-events-none">
              <ShieldCheck className="w-[400px] h-[400px] text-white" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-2 text-white">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/5">AI Insight Engine</div>
                <h3 className="text-2xl font-black tracking-tight">{t("spatialIntelligence")}</h3>
                <p className="text-sm text-teal-50/70 max-w-xl font-medium leading-relaxed">{t("spatialIntelligenceDesc")}</p>
              </div>
              <div className="flex gap-3">
                <button className="group shrink-0 bg-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2"
                        style={{ color: "#0f6b7c" }}>
                  <Download className="w-4 h-4 transition-bounce" />
                  {t("exportGeoData")}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
