import { useTranslation } from "react-i18next";
import { Bell, MapPin, Radio } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { useAlertDetail, useUpdateAlertStatusMutation } from "@/features/admin/hooks/useAdmin";
import { AdminApprovalActions } from "@/features/admin/components/AdminApprovalActions";
import { AdminDetailModal } from "@/features/admin/components/AdminDetailModal";
import { getSeverityLevel } from "@/features/admin/utils";
import { formatDate } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib/apiErrors";

type AlertDetailModalProps = {
  alertId: string | null;
  onClose: () => void;
  onApproved?: () => void;
  onViewAdvisory?: (advisoryId: string) => void;
};

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50", className)}>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100 text-base">{value}</dd>
    </div>
  );
}

export function AlertDetailModal({
  alertId,
  onClose,
  onApproved,
  onViewAdvisory,
}: AlertDetailModalProps) {
  const { t } = useTranslation();
  const { data: alert, isLoading, error } = useAlertDetail(alertId ?? undefined);
  const updateMutation = useUpdateAlertStatusMutation();

  const handleAction = async (action: "approve" | "reject") => {
    if (!alertId) return;
    try {
      await updateMutation.mutateAsync({ id: alertId, action });
      if (action === "approve") {
        toast.success(t("alertApprovedToast"), {
          description: t("alertApprovedDestination"),
          duration: 8000,
        });
        onApproved?.();
        onClose();
      } else {
        toast.success(t("alertRejectedToast"));
        onClose();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("actionFailed")));
    }
  };

  const sev = alert ? getSeverityLevel(alert.severity) : null;

  return (
    <AdminDetailModal
      isOpen={Boolean(alertId)}
      onClose={onClose}
      title={alert?.title || t("healthAlertDetail")}
      subtitle={t("alertApprovalsTabHint")}
      icon={<Bell className="h-5 w-5" />}
      footer={
        alert && alert.status === "Pending" ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("alertApprovedDestination")}</p>
            <AdminApprovalActions
              variant="alert"
              status={alert.status}
              isPending={updateMutation.isPending}
              pendingAction={updateMutation.variables?.action}
              onApprove={() => void handleAction("approve")}
              onReject={() => void handleAction("reject")}
              approveLabel={t("approveAlertAction")}
              rejectLabel={t("rejectAlertAction")}
            />
          </div>
        ) : alert?.status === "Active" ? (
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t("alertAlreadyDelivered")}
          </p>
        ) : alert?.status === "Rejected" ? (
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {t("alertRejectedToast")}
          </p>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 border-3 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : error || !alert ? (
        <p className="text-center text-red-600 font-semibold py-8">{t("alertNotFound")}</p>
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
                {alert.severity}
              </div>
            ) : null}
            <Badge variant="secondary">
              {alert.status === "Active"
                ? t("authorizedStatus")
                : alert.status === "Rejected"
                  ? t("rejectedStatus")
                  : t("awaitingReview")}
            </Badge>
            {alert.aiSuggested ? (
              <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                {t("aiSuggestedBadge")}
              </Badge>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailField label={t("diseaseColumn")} value={alert.disease || "—"} />
            <DetailField
              label={t("dateColumn")}
              value={alert.createdAt ? formatDate(alert.createdAt) : "—"}
            />
            <DetailField
              className="sm:col-span-2"
              label={t("targetZoneLabel")}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                  {alert.targetZone || "—"}
                </span>
              }
            />
            <DetailField
              label={t("channelLabel")}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-teal-600 shrink-0" />
                  {alert.channel || "—"}
                </span>
              }
            />
            {alert.sourceReportId ? (
              <DetailField
                label={t("sourceReportLabel")}
                value={<span className="font-mono text-xs break-all">{alert.sourceReportId}</span>}
              />
            ) : null}
          </dl>

          <div className="rounded-2xl border-2 border-amber-200/80 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/25">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-200 mb-2">
              {t("alertMessageLabel")}
            </h3>
            <p className="text-base font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
              {alert.message}
            </p>
          </div>

          {(alert.advisoryTitle || alert.advisory) && (
            <div className="rounded-2xl border border-teal-200/60 bg-teal-50/50 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal-800 dark:text-teal-300 mb-2">
                {t("linkedAdvisoryLabel")}
              </h3>
              {alert.advisoryTitle ? (
                <p className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
                  {alert.advisoryTitle}
                </p>
              ) : null}
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {alert.advisory}
              </p>
              {alert.advisoryId && onViewAdvisory ? (
                <button
                  type="button"
                  onClick={() => onViewAdvisory(alert.advisoryId!)}
                  className="mt-3 text-sm font-bold text-teal-700 hover:text-teal-900 dark:text-teal-400 underline-offset-2 hover:underline"
                >
                  {t("viewLinkedAdvisory")}
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </AdminDetailModal>
  );
}
