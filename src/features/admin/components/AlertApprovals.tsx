import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Bell, CheckCircle2, Eye, XCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { AlertItem } from "@/features/admin/types";
import { getSeverityLevel } from "@/features/admin/utils";
import { formatDate } from "@/shared/utils/formatDate";
import { AlertDetailModal } from "@/features/admin/components/AlertDetailModal";

interface AlertApprovalsProps {
  alerts: AlertItem[];
  loading: boolean;
  handleUpdate: (id: number | string, action: "approve" | "reject") => Promise<void>;
  actionLoadingId: string | null;
  updateAction?: "approve" | "reject";
  onViewAdvisory?: (advisoryId: string) => void;
  t: (key: string) => string;
}

export function AlertApprovals({
  alerts,
  loading,
  handleUpdate,
  actionLoadingId,
  updateAction,
  onViewAdvisory,
  t,
}: AlertApprovalsProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-8 py-6 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" />
              {t("pendingAlertApprovalsTitle")}
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              {t("alertApprovalsTabHint")}
            </p>
            <p className="text-xs text-teal-700/90 dark:text-teal-400/90 font-medium max-w-2xl">
              {t("alertApprovedDestination")}
            </p>
          </div>
          {!loading && (
            <Badge
              variant="secondary"
              className="px-3.5 py-1 text-xs font-bold rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50 italic"
            >
              {t("pendingCount", { count: alerts.length })}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto max-h-[720px]">
            <table className="w-full">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-xl border-b dark:border-slate-800 z-10">
                <tr className="text-left">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t("severityColumn")}
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    🦠 {t("diseaseColumn")}
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t("dateColumn")}
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t("advisorySummary")}
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t("statusColumn")}
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">
                    {t("actionsColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                        <span className="text-sm font-bold text-slate-400 tracking-wide">
                          {t("loadingRecentAlerts")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center px-8">
                      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400/80" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                            {t("noPendingAlerts")}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t("allAlertsProcessed")}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                            {t("alertApprovedDestination")}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => {
                    const sev = getSeverityLevel(alert.severity);
                    return (
                      <tr
                        key={alert.id}
                        className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                        onClick={() => setDetailId(alert.id)}
                      >
                        <td className="px-8 py-6">
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-tighter border shadow-xs",
                              sev.bg,
                              sev.color,
                              "border-current/10",
                            )}
                          >
                            {sev.icon}
                            {alert.severity}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                              {alert.disease || t("tableGlobalAdvisory")}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 opacity-60">
                              {t("refPrefix")}-{alert.id.toString().padStart(6, "0")}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                            {alert.createdAt ? formatDate(alert.createdAt) : "—"}
                          </span>
                        </td>
                        <td className="px-8 py-6 max-w-md">
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm line-clamp-3 font-medium">
                            {alert.advisory}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
                              alert.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                alert.status === "Approved" ? "bg-emerald-500" : "bg-amber-500",
                              )}
                            />
                            {alert.status === "Approved"
                              ? t("authorizedStatus")
                              : t("awaitingReview")}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailId(alert.id)}
                              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 transition-all"
                              title={t("viewDetails")}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {alert.status === "Draft" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate(alert.id, "approve")}
                                  disabled={actionLoadingId === String(alert.id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                  title="Approve"
                                >
                                  {actionLoadingId === String(alert.id) &&
                                  updateAction === "approve" ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate(alert.id, "reject")}
                                  disabled={actionLoadingId === String(alert.id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-all active:scale-95"
                                  title="Reject"
                                >
                                  {actionLoadingId === String(alert.id) &&
                                  updateAction === "reject" ? (
                                    <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-slate-600 dark:border-t-slate-100 rounded-full animate-spin" />
                                  ) : (
                                    <XCircle className="w-5 h-5" />
                                  )}
                                </button>
                              </>
                            ) : null}
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

      <AlertDetailModal
        alertId={detailId}
        onClose={() => setDetailId(null)}
        onViewAdvisory={
          onViewAdvisory
            ? (advisoryId) => {
                setDetailId(null);
                onViewAdvisory(advisoryId);
              }
            : undefined
        }
      />
    </>
  );
}
