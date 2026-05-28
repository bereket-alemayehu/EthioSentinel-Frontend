import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Table as TableIcon,
  RefreshCw,
  Database,
  CheckCircle2,
  RotateCcw,
  Edit3,
  Trash2,
  MapPin

} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface ReportHistoryTableProps {
  activeTab: 'queue' | 'archive';
  setActiveTab: (tab: 'queue' | 'archive') => void;
  displayReports: any[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  t: any;
  handleEdit: (item: any) => void;
  handleDelete: (id: string) => void;
  handleRetry: () => void;
  isLoadingHistory: boolean;
  refreshQueue: () => void;
  pendingCount: number;
  reportsContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({
  activeTab,
  setActiveTab,
  displayReports,
  currentPage,
  setCurrentPage,
  totalPages,
  t,
  handleEdit,
  handleDelete,
  handleRetry,
  isLoadingHistory,
  refreshQueue,
  pendingCount,
  reportsContainerRef
}) => {
  return (
    <div className="w-full px-4 sm:px-10 mt-8" ref={reportsContainerRef}>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-wrapper p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-slate-900/5 min-h-[400px]"
        >
            <div className="flex flex-col mb-8 sm:mb-10 gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-sm shrink-0">
                            <TableIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-dark-300 dark:text-white tracking-tighter uppercase whitespace-nowrap">Reports Management</h2>
                            <p className="text-[9px] sm:text-[10px] text-light-500 font-black uppercase tracking-widest mt-1">Unified Submission Context</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={refreshQueue}
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl h-10 w-10 hover:bg-primary-500/10"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-light-700/50 dark:border-white/5 p-1 bg-light-700/20 dark:bg-white/5 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative ${
                            activeTab === 'queue' 
                                ? 'bg-white dark:bg-white/10 text-primary-500 shadow-lg shadow-primary-500/10 border border-primary-500/10' 
                                : 'text-light-500 hover:text-dark-300 dark:hover:text-white'
                        }`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'animate-spin-slow' : ''}`} />
                        Transmission Queue
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'archive' 
                                ? 'bg-white dark:bg-white/10 text-primary-500 shadow-lg shadow-primary-500/10 border border-primary-500/10' 
                                : 'text-light-500 hover:text-dark-300 dark:hover:text-white'
                        }`}
                    >
                        <Database className="w-3.5 h-3.5" />
                        Report Archive
                    </button>
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
                        <AnimatePresence>
                            {displayReports.map((item) => (
                                <motion.tr 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={item.id}
                                    className="bg-light-700/20 dark:bg-white/5 border border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 group cursor-default"
                                >
                                    <td className="px-6 py-6 font-black text-dark-300 dark:text-white first:rounded-l-3xl uppercase tracking-tighter">
                                        <div className="flex flex-col">
                                            <span>{item.diseaseType}</span>
                                            {(item.disease?.code || item.code) && (
                                                <span className="text-[10px] text-primary-500 font-bold tracking-widest">
                                                    {item.disease?.code || item.code}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex items-center justify-center gap-6">
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
                                        ) : item.status === 'archived' ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20 shadow-sm">
                                                <Database className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Archived</span>
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
                                            <>
                                                {item.status !== 'synced' && item.status !== 'archived' && (
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
                                                <button 
                                                    onClick={() => handleEdit(item)}
                                                    className="h-9 w-9 rounded-lg text-primary-500 hover:bg-primary-500/10 flex items-center justify-center transition-colors"
                                                    title="Edit Entry"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                        {displayReports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-24 text-center">
                                    <Database className="w-20 h-20 text-light-700/50 dark:text-white/5 mx-auto mb-6" />
                                    <p className="text-light-500 font-black uppercase tracking-[0.3em]">No {activeTab} Records Identified</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <AnimatePresence mode="popLayout">
                    {displayReports.map((item) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className="bg-light-700/30 dark:bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-light-500 font-black uppercase tracking-widest">Identification</p>
                                    <h3 className="text-lg font-black text-dark-300 dark:text-white uppercase tracking-tighter">{item.diseaseType}</h3>
                                </div>
                                {item.status === 'synced' ? (
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                ) : item.status === 'archived' ? (
                                    <div className="h-8 w-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20 shadow-sm">
                                        <Database className="w-4 h-4" />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
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

                            <div className="flex items-center justify-between text-[10px] font-bold text-light-500">
                                <div className="flex items-center gap-1.5 uppercase">
                                    <MapPin className="w-3 h-3 text-primary-500" />
                                    {item.district}
                                </div>
                                <div>
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                    <>
                                        {item.status !== 'synced' && item.status !== 'archived' && (
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
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Pagination Controls for Archive */}
            {activeTab === 'archive' && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 px-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-light-500">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setCurrentPage(Math.max(1, currentPage - 1));
                                reportsContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            disabled={currentPage === 1 || isLoadingHistory}
                            variant="secondary"
                            className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]"
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => {
                                setCurrentPage(Math.min(totalPages, currentPage + 1));
                                reportsContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            disabled={currentPage === totalPages || isLoadingHistory}
                            variant="secondary"
                            className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[9px]"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    </div>
  );
};
