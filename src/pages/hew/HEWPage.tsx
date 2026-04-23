import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusCircle, 
  Database, 
  RefreshCw, 
  CheckCircle2,
  Table as TableIcon,
  Activity,
  User as UserIcon,
  MapPin,
  Stethoscope,
  Trash2,
  Edit3,
  RotateCcw
} from "lucide-react";
import {
  getAllQueuedHewReports,
  queueHewReport,
  deleteQueuedHewReport,
  updateQueuedHewReport,
  type HewDraftReportInput,
  type HewQueuedReport,
} from "@/features/reporting/lib/offlineHewReports";
import { useReportMutation, useSyncReportsMutation } from "@/features/reporting/hooks/useReporting";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export default function HEWPage() {
  const { user } = useAuth();
  const reportMutation = useReportMutation();
  const syncMutation = useSyncReportsMutation();
  
  const [form, setForm] = useState<HewDraftReportInput>({
    diseaseType: "",
    district: user?.assignedDistrict || "",
    cases: 0,
    deaths: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<HewQueuedReport[]>([]);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HewQueuedReport | null>(null);
  const [editForm, setEditForm] = useState<HewDraftReportInput>({
    diseaseType: "",
    district: "",
    cases: 0,
    deaths: 0,
    date: "",
  });

  const isSyncing = syncMutation.isPending;

  // Sync district if user profile updates
  useEffect(() => {
    if (user?.assignedDistrict) {
      setForm(prev => ({ ...prev, district: user.assignedDistrict || "" }));
    }
  }, [user]);

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status !== "synced").length,
    [queue],
  );

  async function refreshQueue() {
    const current = await getAllQueuedHewReports();
    setQueue(current);
  }

  async function syncNow() {
    if (!navigator.onLine) {
      toast.error("You are currently offline. Sync deferred.");
      return;
    }

    try {
      const result = await syncMutation.mutateAsync();
      await refreshQueue();
      toast.success(`Sync finished: ${result.synced} reports uploaded.`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} reports failed to sync.`);
      }
    } catch {
      toast.error("Sync process failed. Please try again later.");
    }
  }

  useEffect(() => {
    void refreshQueue();

    const onOnline = () => {
      setIsOnline(true);
      toast.info("Connection restored. Initiating background sync...");
      void syncNow();
    };

    const onOffline = () => {
      setIsOnline(false);
      toast.warning("Connection lost. Reports will be queued locally.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.diseaseType.trim()) {
      toast.error("Disease type is required.");
      return;
    }

    if (!form.district.trim()) {
      toast.error("District is required.");
      return;
    }

    const payload = {
      ...form,
      diseaseType: form.diseaseType.trim(),
      district: form.district.trim()
    };

    try {
      await reportMutation.mutateAsync(payload);
      toast.success("Report submitted successfully.");
      setForm((prev) => ({
        ...prev,
        diseaseType: "",
        cases: 0,
        deaths: 0,
      }));
    } catch {
      await queueHewReport(payload);
      await refreshQueue();
      toast.info("Offline: Report has been queued for sync.");
    }

    if (navigator.onLine && !reportMutation.isError) {
      await syncNow();
    }
  };

  const handleDelete = (id: string) => {
    const report = queue.find(r => r.id === id);
    if (report) {
      setSelectedReport(report);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReport) {
      await deleteQueuedHewReport(selectedReport.id);
      await refreshQueue();
      setIsDeleteModalOpen(false);
      setSelectedReport(null);
      toast.success("Log entry deleted.");
    }
  };

  const handleEdit = (item: HewQueuedReport) => {
    setSelectedReport(item);
    setEditForm({
      diseaseType: item.diseaseType,
      district: item.district,
      cases: item.cases,
      deaths: item.deaths,
      date: item.date,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReport) {
      await updateQueuedHewReport(selectedReport.id, editForm);
      await refreshQueue();
      setIsEditModalOpen(false);
      setSelectedReport(null);
      toast.success("Report updated successfully.");
    }
  };

  const handleRetry = async () => {
    if (!navigator.onLine) {
        toast.error("Offline: Cannot retry sync right now.");
        return;
    }
    try {
        await syncMutation.mutateAsync();
        await refreshQueue();
        toast.success("Retry attempt finished.");
    } catch {
        toast.error("Retry failed.");
    }
  };

  return (
    <div className="min-h-screen bg-light-800 dark:bg-dark-500 pb-12 font-sans overflow-x-hidden selection:bg-primary-500/20">
      {/* ── Premium Hero Section ────────────────────────────── */}
      <div className="relative pt-20 pb-20 sm:pt-24 sm:pb-32 overflow-hidden primary-gradient">
        {/* Dynamic mesh background for depth */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse" />
        
        {/* Decorative large icon */}
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
                    Authorized Access
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter font-heading leading-[0.9]">
                    HEW Dashboard
                </h1>
                <p className="text-white/70 text-base sm:text-lg font-medium max-w-2xl leading-relaxed">
                    Health Extension Worker's Secure Command Center: <br className="hidden md:block" /> Real-time Disease Reporting & Monitoring System.
                </p>
            </motion.div>
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div className="w-full px-4 sm:px-10 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Profile & Stats (4 units) */}
        <div className="lg:col-span-4 space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-wrapper p-6 sm:p-8 rounded-[2rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-2xl shadow-slate-900/5"
            >
                <div className="flex-start gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl primary-gradient flex-center text-white shadow-xl ring-4 ring-primary-500/10">
                        <UserIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-dark-300 dark:text-white tracking-tight uppercase">{user?.username}</h3>
                        <p className="text-xs text-light-500 font-black uppercase tracking-[0.2em]">Medical Extension Officer</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="group flex-between p-4 rounded-2xl bg-light-700/50 dark:bg-white/5 border border-white/10 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md">
                        <div className="flex-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex-center text-primary-500">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-light-500 dark:text-light-700 uppercase">Operational District</span>
                        </div>
                        <span className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tight">{user?.assignedDistrict || 'NOT ASSIGNED'}</span>
                    </div>
                    <div className="group flex-between p-4 rounded-2xl bg-light-700/50 dark:bg-white/5 border border-white/10 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md">
                        <div className="flex-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex-center text-accent-500">
                                <Activity className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-light-500 dark:text-light-700 uppercase">Supervisory Region</span>
                        </div>
                        <span className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tight">{user?.region || 'NATIONAL'}</span>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-wrapper p-6 sm:p-8 rounded-[2rem] border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-2xl shadow-slate-900/5"
            >
                <div className="flex-between mb-6">
                    <h3 className="font-black text-dark-300 dark:text-white flex-start gap-3 uppercase tracking-tighter text-lg">
                        <Database className="w-6 h-6 text-primary-500" />
                        Infrastructure
                    </h3>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        {isOnline ? 'Sync Active' : 'Offline Mode'}
                    </div>
                </div>

                <p className="text-sm text-light-500 dark:text-light-700 mb-8 font-medium leading-relaxed">
                    {isOnline 
                        ? "Real-time synchronization secure. All records are currently mirrored to the central node." 
                        : "Network connectivity unstable. Reports are being cached locally and will auto-sync upon restoration."}
                </p>

                <div className="space-y-4">
                    <div className="flex-between text-[10px] font-black uppercase tracking-[0.15em] text-light-500">
                        <span>Transmission Queue</span>
                        <span className={pendingCount > 0 ? 'text-primary-500' : ''}>{pendingCount} Units</span>
                    </div>
                    <div className="w-full bg-light-700 dark:bg-white/10 h-3 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div 
                            className="h-full primary-gradient rounded-full transition-all duration-700 ease-out shadow-sm" 
                            style={{ width: `${Math.min(100, Math.max(5, (pendingCount / 10) * 100))}%` }} 
                        />
                    </div>
                    
                    <Button 
                        onClick={syncNow} 
                        disabled={!isOnline || isSyncing || pendingCount === 0}
                        variant="secondary"
                        className="w-full h-14 mt-4 bg-slate-100 dark:bg-white/5 border-0 hover:bg-primary-500 hover:text-white rounded-2xl font-black transition-all active:scale-95 flex gap-3 shadow-sm hover:shadow-lg shadow-primary-500/20"
                    >
                         {isSyncing ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                         ) : (
                            <RefreshCw className="w-5 h-5" />
                         )}
                         {isSyncing ? "FORGING CONNECTION..." : "INITIATE MANUAL SYNC"}
                    </Button>
                </div>
            </motion.div>
        </div>

        {/* Right Column: Report Form (8 units) */}
        <div className="lg:col-span-8">
            
            {/* New Report Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="card-wrapper p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/25 dark:border-white/5 shadow-2xl shadow-slate-900/10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <PlusCircle className="w-48 h-48" />
                </div>

                <div className="relative flex-start gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-accent-500 text-white flex-center shadow-lg shadow-accent-500/30">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-dark-300 dark:text-white tracking-tighter uppercase">New Field Report</h2>
                        <p className="text-xs text-light-500 font-black uppercase tracking-[.2em] mt-1">Surveillance Log Alpha-01</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-8 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Pathogen/Disease Identification</label>
                            <Input 
                                placeholder="e.g. EBOLA, MALARIA, CHOLERA"
                                value={form.diseaseType}
                                onChange={e => setForm({...form, diseaseType: e.target.value})}
                                required
                                className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase placeholder:text-light-400 p-6 text-lg shadow-inner"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Operational Area (District)</label>
                            <Input 
                                value={form.district}
                                readOnly
                                className="h-14 bg-light-700/60 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-2xl font-black text-primary-500 p-6 text-lg cursor-not-allowed uppercase"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Observation Date</label>
                            <div className="relative">
                                <Input 
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({...form, date: e.target.value})}
                                    required
                                    className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black p-6 text-lg shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Case Count</label>
                                <Input 
                                    type="number"
                                    min="0"
                                    value={form.cases}
                                    onChange={e => setForm({...form, cases: Number(e.target.value)})}
                                    required
                                    className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black text-center text-xl shadow-inner"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-light-500 dark:text-light-700 uppercase tracking-widest ml-1">Mortality</label>
                                <Input 
                                    type="number"
                                    min="0"
                                    value={form.deaths}
                                    onChange={e => setForm({...form, deaths: Number(e.target.value)})}
                                    required
                                    className="h-14 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black text-center text-xl text-red-500 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={reportMutation.isPending}
                        className="w-full h-16 primary-gradient text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-primary-500/30 active:scale-[0.98] transition-all flex-center gap-4 group"
                    >
                        {reportMutation.isPending ? (
                            <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                                <span className="tracking-tighter">SECURE SUBMISSION</span>
                            </>
                        )}
                    </Button>
                </form>
            </motion.div>
        </div>
      </div>

      {/* ── Transmission Logs: Full Width Section ────────────────── */}
      <div className="w-full px-4 sm:px-10 mt-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-wrapper p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-slate-900/5 min-h-[400px]"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex-center text-primary-500 shadow-sm shrink-0">
                        <TableIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-dark-300 dark:text-white tracking-tighter uppercase whitespace-nowrap">Transmission Logs</h2>
                        <p className="text-[9px] sm:text-[10px] text-light-500 font-black uppercase tracking-widest mt-1">Localized PWA Database Context</p>
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest animate-pulse border border-amber-500/20">
                            {pendingCount} Needs Sync
                        </div>
                    )}
                    <Button 
                        onClick={refreshQueue}
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-10 w-10 hover:bg-primary-500/10"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-light-500 dark:text-light-700 text-[10px] font-black uppercase tracking-widest">
                            <th className="px-6 py-4">Identification</th>
                            <th className="px-6 py-4 text-center">Infection Stats</th>
                            <th className="px-6 py-4">Operational Area</th>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Transmission Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {queue.map((item) => (
                                <motion.tr 
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={item.id}
                                    className="bg-light-700/20 dark:bg-white/5 border border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 group cursor-default"
                                >
                                    <td className="px-6 py-6 font-black text-dark-300 dark:text-white first:rounded-l-3xl uppercase tracking-tighter">
                                        {item.diseaseType}
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex-center gap-6">
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <p className="text-[9px] text-light-500 font-black uppercase tracking-widest mb-1">Cases</p>
                                                <p className="text-lg font-black text-primary-500">{item.cases}</p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <p className="text-[9px] text-light-500 font-black uppercase tracking-widest mb-1">Deaths</p>
                                                <p className="text-lg font-black text-red-500">{item.deaths}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-xs font-black text-light-500 dark:text-light-700 uppercase tracking-widest">
                                        {item.district}
                                    </td>
                                    <td className="px-6 py-6 text-xs font-bold text-light-500 dark:text-light-700">
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-6">
                                        {item.status === 'synced' ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Securely Synced</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                                                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pending Upload</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-right last:rounded-r-3xl">
                                        <div className="flex justify-end gap-2">
                                            {item.status !== 'synced' && (
                                                <Button 
                                                    onClick={() => handleRetry()}
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-lg text-amber-500 hover:bg-amber-500/10"
                                                    title="Retry Sync"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                onClick={() => handleEdit(item)}
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-lg text-primary-500 hover:bg-primary-500/10"
                                                title="Edit Entry"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                onClick={() => handleDelete(item.id)}
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-500/10"
                                                title="Delete Entry"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {queue.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-24 text-center">
                                    <Database className="w-20 h-20 text-light-700/50 dark:text-white/5 mx-auto mb-6" />
                                    <p className="text-light-500 font-black uppercase tracking-[0.3em]">No Transmission Records Identified</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <AnimatePresence mode="popLayout">
                    {queue.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className="bg-light-700/30 dark:bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                        >
                            <div className="flex-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-light-500 font-black uppercase tracking-widest">Identification</p>
                                    <h3 className="text-lg font-black text-dark-300 dark:text-white uppercase tracking-tighter">{item.diseaseType}</h3>
                                </div>
                                {item.status === 'synced' ? (
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex-center border border-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex-center border border-amber-500/20">
                                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                <div className="text-center">
                                    <p className="text-[9px] text-light-500 font-black uppercase tracking-widest mb-1">Cases</p>
                                    <p className="text-xl font-black text-primary-500">{item.cases}</p>
                                </div>
                                <div className="text-center border-l border-white/5">
                                    <p className="text-[9px] text-light-500 font-black uppercase tracking-widest mb-1">Deaths</p>
                                    <p className="text-xl font-black text-red-500">{item.deaths}</p>
                                </div>
                            </div>

                            <div className="flex-between text-[10px] font-bold text-light-500">
                                <div className="flex items-center gap-1.5 uppercase">
                                    <MapPin className="w-3 h-3 text-primary-500" />
                                    {item.district}
                                </div>
                                <div>
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                {item.status !== 'synced' && (
                                    <Button 
                                        onClick={() => handleRetry()}
                                        className="flex-1 h-10 rounded-xl bg-amber-500 text-white font-black uppercase tracking-widest text-[9px]"
                                    >
                                        Retry Sync
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => handleEdit(item)}
                                    variant="secondary"
                                    className="flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[9px]"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(item.id)}
                                    className="h-10 w-10 flex-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {queue.length === 0 && (
                    <div className="py-20 text-center">
                        <Database className="w-16 h-16 text-light-700/50 dark:text-white/5 mx-auto mb-4" />
                        <p className="text-[10px] text-light-500 font-black uppercase tracking-widest">No records identified</p>
                    </div>
                )}
            </div>
        </motion.div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
            <p className="text-sm font-bold uppercase tracking-tight">Warning: Irreversible Action</p>
            <p className="text-sm mt-1 opacity-80">Deletion will permanently remove this record from the local PWA database.</p>
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
              onClick={handleDeleteConfirm}
              className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Field Report"
        className="max-w-2xl"
      >
        <form onSubmit={handleEditSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Pathogen ID</label>
              <Input
                value={editForm.diseaseType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, diseaseType: e.target.value })}
                required
                className="h-12 bg-light-700/40 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-black uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">District</label>
              <Input
                value={editForm.district}
                readOnly
                className="h-12 bg-light-700/60 dark:bg-black/20 border-white/5 rounded-xl font-black text-primary-500 cursor-not-allowed uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Date</label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, date: e.target.value })}
                required
                className="h-12 bg-light-700/40 dark:bg-white/5 border-white/10 rounded-xl font-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Cases</label>
                <Input
                  type="number"
                  value={editForm.cases}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, cases: Number(e.target.value) })}
                  required
                  className="h-12 bg-light-700/40 dark:bg-white/5 border-white/10 rounded-xl font-black text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Deaths</label>
                <Input
                  type="number"
                  value={editForm.deaths}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, deaths: Number(e.target.value) })}
                  required
                  className="h-12 bg-light-700/40 dark:bg-white/5 border-white/10 rounded-xl font-black text-center text-red-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-[10px]"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              className="flex-1 h-14 rounded-xl primary-gradient text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
            >
              Update Record
            </Button>
          </div>
        </form>
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
