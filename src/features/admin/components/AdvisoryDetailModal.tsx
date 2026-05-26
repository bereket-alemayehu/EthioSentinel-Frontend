import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  useAdvisoryDetail,
  useUpdateAdvisoryStatusMutation,
} from "@/features/admin/hooks/useAdvisoryActions";
import { AdminApprovalActions } from "@/features/admin/components/AdminApprovalActions";
import { AdminDetailModal } from "@/features/admin/components/AdminDetailModal";
import { getSeverityLevel } from "@/features/admin/utils";
import { formatDate } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib/apiErrors";

type AdvisoryDetailModalProps = {
  advisoryId: string | null;
  onClose: () => void;
  onPublished?: () => void;
};

export function AdvisoryDetailModal({
  advisoryId,
  onClose,
  onPublished,
}: AdvisoryDetailModalProps) {
  const { t } = useTranslation();
  const { data: advisory, isLoading, error } = useAdvisoryDetail(advisoryId ?? undefined);
  const updateMutation = useUpdateAdvisoryStatusMutation();

  const handleAction = async (action: "approve" | "reject" | "withdraw") => {
    if (!advisoryId) return;
    try {
      await updateMutation.mutateAsync({ id: advisoryId, action });
      const msg =
        action === "approve"
          ? t("advisoryPublishedToast")
          : action === "reject"
            ? t("advisoryRejectedToast")
            : t("advisoryWithdrawnToast");
      toast.success(msg, {
        description: action === "approve" ? t("advisoryPublishedDestination") : undefined,
        duration: action === "approve" ? 8000 : 4000,
      });
      if (action === "approve") onPublished?.();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("actionFailed")));
    }
  };

  const sev = advisory
    ? getSeverityLevel(advisory.riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
    : null;
  const location =
    advisory?.district?.name || advisory?.region?.name || t("nationalShort");
  const dateRaw = advisory
    ? advisory.status === "APPROVED"
      ? advisory.approvedAt ?? advisory.updatedAt ?? advisory.createdAt
      : advisory.createdAt
    : null;

  const isDraft = advisory?.status === "DRAFT";

  return (
    <AdminDetailModal
      isOpen={Boolean(advisoryId)}
      onClose={onClose}
      title={advisory?.title || t("healthAdvisoryDrafts")}
      subtitle={t("advisoryTabHint")}
      icon={<FileText className="h-5 w-5" />}
      footer={
        advisory ? (
          <AdminApprovalActions
            variant="advisory"
            status={advisory.status}
            isPending={updateMutation.isPending}
            pendingAction={updateMutation.variables?.action}
            onApprove={() => void handleAction("approve")}
            onReject={() => void handleAction("reject")}
            onWithdraw={() => void handleAction("withdraw")}
            approveLabel={t("publishAction")}
            rejectLabel={t("deleteAction")}
            withdrawLabel={t("withdrawAction")}
          />
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : error || !advisory ? (
        <p className="text-center text-red-600 font-semibold py-8">{t("advisoryNotFound")}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {sev ? (
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs uppercase border",
                  sev.bg,
                  sev.color,
                )}
              >
                {sev.icon}
                {advisory.riskLevel}
              </div>
            ) : null}
            <Badge variant="secondary">
              {isDraft ? t("draftStatus") : t("publishedStatus")}
            </Badge>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("diseaseColumn")}</dt>
              <dd className="mt-1.5 font-semibold text-base">{advisory.diseaseType}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("locationColumn")}</dt>
              <dd className="mt-1.5 font-semibold text-base">{location}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("dateColumn")}</dt>
              <dd className="mt-1.5 font-semibold text-base tabular-nums">
                {dateRaw && !Number.isNaN(new Date(dateRaw).getTime()) ? formatDate(dateRaw) : "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("languageLabel")}</dt>
              <dd className="mt-1.5 font-semibold text-base">{advisory.language || "—"}</dd>
            </div>
          </dl>

          <div className="rounded-2xl border-2 border-teal-200/70 bg-white p-5 shadow-sm dark:border-teal-900/40 dark:bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-800 dark:text-teal-300 mb-3">
              {t("advisoryContentLabel")}
            </h3>
            <p className="text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-[1.7]">
              {advisory.content}
            </p>
          </div>

          {isDraft ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border border-slate-100 dark:border-slate-800">
              {t("advisoryPublishedDestination")}
            </p>
          ) : null}
        </div>
      )}
    </AdminDetailModal>
  );
}
