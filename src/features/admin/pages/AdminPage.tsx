import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGeoStats } from "@/features/admin/hooks/useAdmin";
import { useAdvisoryDrafts, useApprovedAdvisories, useUpdateAdvisoryStatusMutation } from "@/features/admin/hooks/useAdvisoryActions";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Shield } from "lucide-react";
import { useAuth } from "@/app/providers/auth/AuthProvider";
import { Button } from "@/shared/components/ui/button";

import { AdminHeader, type AdminTab } from "@/features/admin/components/AdminHeader";
import { AdvisoryManagement } from "@/features/admin/components/AdvisoryManagement";
import { MapIntelligence } from "@/features/admin/components/MapIntelligence";
import { AnomalyAnalysis } from "@/features/admin/components/AnomalyAnalysis";
import { AdvisoryDetailModal } from "@/features/admin/components/AdvisoryDetailModal";
// removed alert approval UI: no alert-specific action helpers required

const ADMIN_TABS: AdminTab[] = ["advisories", "map", "anomaly"];

function tabFromQuery(value: string | null): AdminTab {
  if (value && ADMIN_TABS.includes(value as AdminTab)) {
    return value as AdminTab;
  }
  return "advisories";
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    tabFromQuery(searchParams.get("tab")),
  );

  useEffect(() => {
    setActiveTab(tabFromQuery(searchParams.get("tab")));
  }, [searchParams]);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  };
  const { data: geoStats = [], isLoading: geoLoading } = useGeoStats();
  const [advisorySubTab, setAdvisorySubTab] = useState<"pending" | "approved">(
    "pending"
  );
  const [linkedAdvisoryId, setLinkedAdvisoryId] = useState<string | null>(null);

  const openAdvisoryFromAlert = useCallback(
    (advisoryId: string) => {
      setLinkedAdvisoryId(advisoryId);
      setTab("advisories");
    },
    [setSearchParams],
  );
  const { data: advisoryDrafts = [], isLoading: advisoriesLoading } =
    useAdvisoryDrafts();
  const { data: approvedAdvisories = [], isLoading: approvedLoading } =
    useApprovedAdvisories();
  const updateAdvisoryMutation = useUpdateAdvisoryStatusMutation();


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

  const error = updateAdvisoryMutation.error?.message || "";
  const actionLoadingId = updateAdvisoryMutation.isPending
    ? String(updateAdvisoryMutation.variables?.id)
    : null;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/60 dark:bg-slate-950/60 font-sans transition-colors duration-500">
      {user?.role === "super_admin" ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-teal-600/40 font-semibold"
            asChild
          >
            <Link to="/super-admin">
              <Shield className="h-4 w-4" />
              Governance dashboard
            </Link>
          </Button>
        </div>
      ) : null}
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <AdminHeader activeTab={activeTab} setActiveTab={setTab} t={t} />

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* ALERT approvals removed — alerts are not approved via this UI anymore */}

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
        <MapIntelligence geoStats={geoStats} geoLoading={geoLoading} t={t} />
      )}

      {activeTab === "anomaly" && (
        <AnomalyAnalysis geoStats={geoStats} geoLoading={geoLoading} t={t} />
      )}

      <AdvisoryDetailModal
        advisoryId={linkedAdvisoryId}
        onClose={() => setLinkedAdvisoryId(null)}
      />
    </div>
  );
}
