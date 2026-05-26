import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { FileText, Clock, CheckCircle, ShieldCheck, CheckCircle2, Trash2, Undo2, Eye } from "lucide-react";
import { AdvisoryDetailModal } from "@/features/admin/components/AdvisoryDetailModal";
import { cn } from "@/shared/utils/cn";
import { getSeverityLevel } from "@/features/admin/utils";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/shared/utils/formatDate";

interface AdvisoryManagementProps {
  drafts: any[];
  approved: any[];
  subTab: "pending" | "approved";
  setSubTab: (tab: "pending" | "approved") => void;
  handleUpdate: (id: string, action: "approve" | "reject" | "withdraw") => Promise<void>;
  isLoading: boolean;
  approvedLoading: boolean;
  isActionPending: (id: string) => boolean;
  pendingAction: (id: string) => string | null;
}

export function AdvisoryManagement({
  drafts,
  approved,
  subTab,
  setSubTab,
  handleUpdate,
  isLoading,
  approvedLoading,
  isActionPending,
  pendingAction
}: AdvisoryManagementProps) {
  const { t } = useTranslation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const currentList = subTab === "pending" ? drafts : approved;
  const isListLoading = subTab === "pending" ? isLoading : approvedLoading;

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Advisories */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubTab("pending")}
          className={cn(
            "pb-3 px-2 text-sm font-bold transition-all relative",
            subTab === "pending" ? "text-teal-700 dark:text-teal-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t("draftsTab")}
            <Badge variant="secondary" className="ml-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {drafts.length}
            </Badge>
          </div>
          {subTab === "pending" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setSubTab("approved")}
          className={cn(
            "pb-3 px-2 text-sm font-bold transition-all relative",
            subTab === "approved" ? "text-teal-700 dark:text-teal-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t("approvedTab")}
            <Badge variant="secondary" className="ml-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
              {approved.length}
            </Badge>
          </div>
          {subTab === "approved" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
        </button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-8 py-6 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              {subTab === "pending" ? t("healthAdvisoryDrafts") : t("publishedAdvisories")}
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              {subTab === "pending" ? t("advisoryTabHint") : t("publishedDesc")}
            </p>
            {subTab === "pending" ? (
              <p className="text-xs text-teal-700/90 dark:text-teal-400/90 font-medium max-w-2xl">
                {t("advisoryPublishedDestination")}
              </p>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto max-h-[720px]">
            <table className="w-full">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-xl border-b dark:border-slate-800 z-10">
                <tr className="text-left">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("riskLevelColumn")}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("diseaseLocationColumn")}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("dateColumn")}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("advisoryContentColumn")}</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{t("actionsColumn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isListLoading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                        <span className="text-sm font-bold text-slate-400 tracking-wide">{t("syncingLabel")}</span>
                      </div>
                    </td>
                  </tr>
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center px-8">
                      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t("noItemsInCategory")}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t("noAdvisoriesCategory")}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentList.map((advisory) => {
                    const sev = getSeverityLevel(advisory.riskLevel);
                    const isPending = isActionPending(advisory.id);
                    const action = pendingAction(advisory.id);
                    const rawDate =
                      subTab === "pending"
                        ? advisory.createdAt
                        : advisory.approvedAt ?? advisory.updatedAt ?? advisory.createdAt;
                    const dateLabel =
                      rawDate && !Number.isNaN(new Date(rawDate).getTime())
                        ? formatDate(rawDate)
                        : "—";

                    return (
                      <tr
                        key={advisory.id}
                        className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                        onClick={() => setDetailId(advisory.id)}
                      >
                        <td className="px-8 py-6">
                          <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-tighter border shadow-xs", sev.bg, sev.color, "border-current/10")}>
                            {sev.icon}
                            {advisory.riskLevel}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{advisory.diseaseType}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {advisory.district?.name || advisory.region?.name || t("nationalShort")}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                            {dateLabel}
                          </span>
                        </td>
                        <td className="px-8 py-6 max-w-md">
                          <div className="space-y-1">
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">{advisory.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[13px] line-clamp-2">
                              {advisory.content}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailId(advisory.id)}
                              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 transition-all"
                              title={t("viewDetails")}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {subTab === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate(advisory.id, "approve")}
                                  disabled={isPending}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                  title={t("publishAction")}
                                >
                                  {isPending && action === "approve" ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdate(advisory.id, "reject")}
                                  disabled={isPending}
                                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95"
                                  title={t("deleteAction")}
                                >
                                  {isPending && action === "reject" ? (
                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-5 h-5" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleUpdate(advisory.id, "withdraw")}
                                disabled={isPending}
                                className="h-9 px-4 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-95 text-xs font-bold"
                                title={t("withdrawAction")}
                              >
                                {isPending && action === "withdraw" ? (
                                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Undo2 className="w-4 h-4" />
                                    {t("withdrawAction")}
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

      <AdvisoryDetailModal advisoryId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
