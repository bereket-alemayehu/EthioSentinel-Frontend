import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Stethoscope,
  Activity,
} from "lucide-react";
import {
  getAllQueuedHewReports,
  queueHewReport,
  deleteQueuedHewReport,
  updateQueuedHewReport,
  type HewDraftReportInput,
  type HewQueuedReport,
} from "@/features/reporting/services/offlineStorage";
import { 
  useReportMutation, 
  useSyncReportsMutation, 
  useReports,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useDiseases
} from "@/features/reporting/hooks/useReporting";
import { useAuth } from "@/app/providers/auth/AuthProvider";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/Modal";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Modular Components
import { HEWDashboardSidebar } from "@/features/reporting/components/HEWDashboardSidebar";
import { ReportingForm } from "@/features/reporting/components/ReportingForm";
import { ReportHistoryTable } from "@/features/reporting/components/ReportHistoryTable";
import { EditReportModal } from "@/features/reporting/components/EditReportModal";
import { HEWSummaryCard } from "@/features/reporting/components/HEWSummaryCard";

export default function HEWPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const reporterId = user?.id;
  const reportMutation = useReportMutation(reporterId);
  const [activeTab, setActiveTab] = useState<'queue' | 'archive'>('queue');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { data: serverResult, refetch: refetchServerReports, isPending: isLoadingHistory } = useReports(currentPage, pageSize);
  const serverReports = serverResult?.reports || [];
  const totalPages = serverResult?.totalPages || 1;
  const syncMutation = useSyncReportsMutation(reporterId);
  const updateServerMutation = useUpdateReportMutation();
  const deleteServerMutation = useDeleteReportMutation();
  const { data: diseaseList = [] } = useDiseases();
  const reportsContainerRef = useRef<HTMLDivElement>(null);
  const todayDate = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  const diseaseOptions = useMemo(() => 
    diseaseList.map((d: any) => ({
      id: d.id,
      label: d.name,
      code: d.code
    })), [diseaseList]
  );
  
  const [form, setForm] = useState<HewDraftReportInput>({
    diseaseType: "",
    district: user?.assignedDistrict || "",
    cases: 0,
    deaths: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<HewQueuedReport[]>([]);

  // Merged reports for display - now filtered by active tab
  const displayReports = useMemo(() => {
    if (activeTab === 'queue') {
       return queue;
    } else {
       return serverReports.map(r => ({
         ...r,
         status: "archived" as const,
         date: r.timestamp || r.date,
         cases: r.caseCount,
         deaths: r.deathCount,
       }));
    }
  }, [queue, serverReports, activeTab]);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<HewDraftReportInput>({
    diseaseType: "",
    district: "",
    cases: 0,
    deaths: 0,
    date: "",
  });

  const isSyncing = syncMutation.isPending;

  useEffect(() => {
    if (user?.assignedDistrict) {
      setForm(prev => ({ ...prev, district: user.assignedDistrict || "" }));
    }
  }, [user]);

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status !== "synced").length,
    [queue],
  );

  const dailyThroughput = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Count only queued reports from today
    const queuedToday = queue.filter(r => {
      const rDate = r.date ? new Date(r.date).toISOString().split('T')[0] : "";
      return rDate === today;
    }).length;

    // Use the global count from the server response
    const archivedTodayCount = serverResult?.dailyCount || 0;

    return queuedToday + archivedTodayCount;
  }, [queue, serverResult?.dailyCount]);

  const activeSessionInfo = useMemo(() => ({
    userName: user?.username || "User",
    district: user?.assignedDistrict || "General",
  }), [user]);

  async function refreshQueue() {
    const current = await getAllQueuedHewReports();
    setQueue(current);
  }

  async function syncNow(silent = false) {
    if (!navigator.onLine) {
      if (!silent) toast.error(t("offlineMode"));
      return;
    }

    // Capture pending count before sync to decide if we should show success toast
    const preSyncPending = pendingCount;

    try {
      const result = await syncMutation.mutateAsync();
      await refreshQueue();
      await refetchServerReports();
      
      if (!silent && result.synced > 0) {
        toast.success(`${t("syncActive")}: ${result.synced} ${t("totalReports")}`);
      } else if (!silent && preSyncPending > 0 && result.synced === 0) {
        // If we had pending reports but none were synced (and not silent), show info
        toast.info(t("syncDescriptionOffline"));
      }
    } catch {
      if (!silent) toast.error(t("syncDescriptionOffline"));
    }
  }

  useEffect(() => {
    void refreshQueue();
    
    // Initial sync on mount if online (needs logged-in user for reporterId)
    if (navigator.onLine && reporterId) {
      void syncNow(true);
    }

    const onOnline = () => {
      setIsOnline(true);
      if (reporterId) void syncNow(true);
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Background sync heartbeat every 30 seconds if online
    const interval = setInterval(() => {
      if (navigator.onLine && reporterId && pendingCount > 0) {
        void syncNow(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [pendingCount, reporterId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.diseaseType.trim() || !form.district.trim()) return;

    if (form.deaths > form.cases) {
      toast.error(t("mortalityError") || "deathCount cannot exceed caseCount");
      return;
    }

    if (form.date && form.date > todayDate) {
      toast.error(t("futureDateError") || "Report date cannot be in the future");
      return;
    }

    const payload = { ...form };
    if (!navigator.onLine) {
      await queueHewReport(payload);
      await refreshQueue();
      setForm(prev => ({ ...prev, diseaseType: "", cases: 0, deaths: 0 }));
      toast.info(t("queuedOffline") || "Report queued for offline sync");
      return;
    }

    try {
      await reportMutation.mutateAsync(payload);
      setForm(prev => ({ ...prev, diseaseType: "", cases: 0, deaths: 0 }));
      toast.success(t("submissionSuccess") || "Report submitted successfully");
    } catch (error: any) {
      const errorMsg = error.message || t("submissionError") || "Submission failed";
      toast.error(errorMsg);
      
      // Only queue if it's not a validation error (e.g. network failure)
      if (!errorMsg.includes("deathCount")) {
        await queueHewReport(payload);
        await refreshQueue();
      }
    }
    await syncNow();
  };

  const handleEdit = (item: any) => {
    setSelectedReport(item);
    const formattedDate = item.date ? new Date(item.date).toISOString().split('T')[0] : "";
    setEditForm({
      diseaseType: item.diseaseType,
      diseaseId: item.diseaseId || item.disease?.id,
      district: item.district,
      cases: item.cases || item.caseCount,
      deaths: item.deaths || item.deathCount,
      date: formattedDate,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editForm.deaths > editForm.cases) {
      toast.error(t("mortalityError") || "deathCount cannot exceed caseCount");
      return;
    }

    if (editForm.date && editForm.date > todayDate) {
      toast.error(t("futureDateError") || "Report date cannot be in the future");
      return;
    }

    try {
      if (selectedReport.status === 'archived') {
        await updateServerMutation.mutateAsync({ id: selectedReport.id, ...editForm });
      } else {
        await updateQueuedHewReport(selectedReport.id, editForm);
        await refreshQueue();
      }
      setIsEditModalOpen(false);
      setSelectedReport(null);
      toast.success(t("editSuccess"));
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleDelete = (id: string) => {
    const report = displayReports.find(r => r.id === id);
    if (report) {
      setSelectedReport(report);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (selectedReport.status === 'archived') {
        await deleteServerMutation.mutateAsync(selectedReport.id);
      } else {
        await deleteQueuedHewReport(selectedReport.id);
        await refreshQueue();
      }
      setIsDeleteModalOpen(false);
      setSelectedReport(null);
      toast.success(t("deleteEntry"));
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const handleRetry = async () => {
    await syncNow();
  };

  return (
    <div className="min-h-screen bg-light-800 dark:bg-dark-500 pb-12 font-sans overflow-x-hidden selection:bg-primary-500/20">
      {/* ── Premium Hero Section ────────────────────────────── */}
      <div className="relative pt-20 pb-20 sm:pt-24 sm:pb-32 overflow-hidden primary-gradient">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 pointer-events-none">
            <Stethoscope className="w-56 h-56 text-white" />
        </div>
        
        <div className="relative w-full px-4 sm:px-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 sm:space-y-3"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-black uppercase tracking-widest">
                    <Activity className="w-3 h-3" />
                    {t("authorizedAccess")}
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter font-heading leading-[0.9]">
                    {t("hewDashboard")}
                </h1>
                <p className="text-white/70 text-base sm:text-lg font-medium max-w-2xl leading-relaxed">
                    {t("hewHeroDesc")}
                </p>
            </motion.div>
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div className="w-full px-4 sm:px-10 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <HEWDashboardSidebar 
          user={user}
          t={t}
          isOnline={isOnline}
          pendingCount={pendingCount}
          isSyncing={isSyncing}
          syncNow={syncNow}
        />

        <div className="lg:col-span-8 space-y-6">
            <ReportingForm 
              t={t}
              form={form}
              setForm={setForm}
              onSubmit={onSubmit}
              diseaseOptions={diseaseOptions}
              isOnline={isOnline}
              reportMutationPending={reportMutation.isPending}
            />
            
            <HEWSummaryCard 
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              syncNow={syncNow}
              t={t}
              dailyThroughput={dailyThroughput}
              activeSessionInfo={activeSessionInfo}
              isThroughputLoading={isLoadingHistory}
            />
        </div>
      </div>

      <ReportHistoryTable 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayReports={displayReports}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        t={t}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleRetry={handleRetry}
        isLoadingHistory={isLoadingHistory}
        refreshQueue={refreshQueue}
        pendingCount={pendingCount}
        reportsContainerRef={reportsContainerRef}
      />

      {/* Modals */}
      <EditReportModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        diseaseOptions={diseaseOptions}
        handleEditSave={handleEditSave}
        t={t}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
            <p className="text-sm font-bold uppercase tracking-tight">Warning: Irreversible Action</p>
            <p className="text-sm mt-1 opacity-80">
              {selectedReport?.status === 'archived' 
                ? "This will permanently remove the record from the central server archive."
                : "Deletion will permanently remove this record from the local PWA database."}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
                onClick={confirmDelete}
                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
            >
                Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .animate-spin-slow {
            animation: spin 4s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .primary-gradient {
            background: linear-gradient(135deg, #0f6b7c 0%, #2e8b57 100%);
        }
      `}</style>
    </div>
  );
}
