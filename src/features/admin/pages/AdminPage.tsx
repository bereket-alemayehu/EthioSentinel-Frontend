import { useState } from "react";
import { useAlerts, useUpdateAlertStatusMutation, useGeoStats } from "@/features/admin/hooks/useAdmin";
import { useAdvisoryDrafts, useApprovedAdvisories, useUpdateAdvisoryStatusMutation } from "@/features/admin/hooks/useAdvisoryActions";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

import { AdminHeader, type AdminTab } from "@/features/admin/components/AdminHeader";
import { AlertApprovals } from "@/features/admin/components/AlertApprovals";
import { AdvisoryManagement } from "@/features/admin/components/AdvisoryManagement";
import { MapIntelligence } from "@/features/admin/components/MapIntelligence";
import { AnomalyAnalysis } from "@/features/admin/components/AnomalyAnalysis";
import { aggregateByDistrict } from "@/features/admin/utils";

export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>("alerts");
  const {
    data: alerts = [],
    isLoading: loading,
    error: queryError,
  } = useAlerts();
  const [advisorySubTab, setAdvisorySubTab] = useState<"pending" | "approved">(
    "pending"
  );
  const { data: advisoryDrafts = [], isLoading: advisoriesLoading } =
    useAdvisoryDrafts();
  const { data: approvedAdvisories = [], isLoading: approvedLoading } =
    useApprovedAdvisories();
  const { data: geoStats = [], isLoading: geoLoading } = useGeoStats();
  const updateMutation = useUpdateAlertStatusMutation();
  const updateAdvisoryMutation = useUpdateAdvisoryStatusMutation();

  const handleUpdate = async (
    id: number | string,
    action: "approve" | "reject"
  ) => {
    try {
      await updateMutation.mutateAsync({ id, action });
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const handleAdvisoryUpdate = async (
    id: string,
    action: "approve" | "reject" | "withdraw"
  ) => {
    try {
      await updateAdvisoryMutation.mutateAsync({ id, action });
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const error =
    queryError?.message || updateMutation.error?.message || "";
  const actionLoadingId = updateMutation.isPending
    ? String(updateMutation.variables?.id)
    : null;

  const totalReports = geoStats.reduce((acc, c) => acc + c.reportCount, 0);
  const totalCases = geoStats.reduce((acc, c) => acc + c.totalCases, 0);
  const districtList = aggregateByDistrict(geoStats);
  const highRiskDistricts = districtList.filter((d) => d.totalCases > 50).length;
  const maxCases = districtList[0]?.totalCases ?? 1;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/60 dark:bg-slate-950/60 font-sans transition-colors duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* ── TAB: ALERT APPROVALS ───────────────────────────────────────── */}
      {activeTab === "alerts" && (
        <AlertApprovals
          alerts={alerts}
          loading={loading}
          handleUpdate={handleUpdate}
          actionLoadingId={actionLoadingId}
          updateAction={updateMutation.variables?.action as any}
          t={t}
        />
      )}

      {/* ── TAB: ADVISORY MANAGEMENT ───────────────────────────────────── */}
      {activeTab === "advisories" && (
        <AdvisoryManagement
          drafts={advisoryDrafts}
          approved={approvedAdvisories}
          subTab={advisorySubTab}
          setSubTab={setAdvisorySubTab}
          handleUpdate={handleAdvisoryUpdate}
          isLoading={advisoriesLoading}
          approvedLoading={approvedLoading}
          isActionPending={(id) =>
            updateAdvisoryMutation.isPending &&
            updateAdvisoryMutation.variables?.id === id
          }
          pendingAction={(id) =>
            updateAdvisoryMutation.isPending &&
            updateAdvisoryMutation.variables?.id === id
              ? updateAdvisoryMutation.variables?.action
              : null
          }
        />
      )}

      {/* ── TAB: DISEASE HEATMAP ────────────────────────────────────────── */}
      {activeTab === "map" && (
        <MapIntelligence
          geoStats={geoStats}
          geoLoading={geoLoading}
          districtList={districtList}
          totalCases={totalCases}
          totalReports={totalReports}
          highRiskDistricts={highRiskDistricts}
          maxCases={maxCases}
          t={t}
        />
      )}

      {activeTab === "anomaly" && (
        <AnomalyAnalysis geoStats={geoStats} geoLoading={geoLoading} t={t} />
      )}
    </div>
  );
}
