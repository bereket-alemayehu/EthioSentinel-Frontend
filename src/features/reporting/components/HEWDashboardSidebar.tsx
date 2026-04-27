import React from "react";
import { motion } from "framer-motion";
import { 
  User as UserIcon,
  MapPin,
  Activity,
  Database,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HEWDashboardSidebarProps {
  user: any;
  t: any;
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => void;
}

export const HEWDashboardSidebar: React.FC<HEWDashboardSidebarProps> = ({
  user,
  t,
  isOnline,
  pendingCount,
  isSyncing,
  syncNow
}) => {
  return (
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
                    <p className="text-xs text-light-500 font-black uppercase tracking-[0.2em]">{t("healthWorker")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="group flex-between p-4 rounded-2xl bg-light-700/50 dark:bg-white/5 border border-white/10 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md">
                    <div className="flex-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex-center text-primary-500">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-light-500 dark:text-light-700 uppercase">{t("operationalDistrict")}</span>
                    </div>
                    <span className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tight">{user?.assignedDistrict || t("notAssigned")}</span>
                </div>
                <div className="group flex-between p-4 rounded-2xl bg-light-700/50 dark:bg-white/5 border border-white/10 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md">
                    <div className="flex-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex-center text-accent-500">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-light-500 dark:text-light-700 uppercase">{t("supervisoryRegion")}</span>
                    </div>
                    <span className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tight">{user?.region || t("national")}</span>
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
                    {t("infrastructure")}
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                    {isOnline ? t("syncActive") : t("offlineMode")}
                </div>
            </div>

            <p className="text-sm text-light-500 dark:text-light-700 mb-8 font-medium leading-relaxed">
                {isOnline 
                    ? t("syncDescriptionOnline")
                    : t("syncDescriptionOffline")}
            </p>

            <div className="space-y-4">
                <div className="flex-between text-[10px] font-black uppercase tracking-[0.15em] text-light-500">
                    <span>{t("transmissionQueue")}</span>
                    <span className={pendingCount > 0 ? 'text-primary-500' : ''}>{pendingCount} {t("units")}</span>
                </div>
                <div className="w-full bg-light-700 dark:bg-white/10 h-3 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div 
                        className="h-full primary-gradient rounded-full transition-all duration-700 ease-out shadow-sm" 
                        style={{ width: `${Math.min(100, Math.max(5, (pendingCount / 10) * 100))}%` }} 
                    />
                </div>
                
                <button 
                    onClick={syncNow} 
                    disabled={!isOnline || isSyncing || pendingCount === 0}
                    className="w-full h-14 mt-4 bg-slate-100 dark:bg-white/5 border-0 hover:bg-primary-500 hover:text-white rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm hover:shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                     {isSyncing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                     ) : (
                        <RefreshCw className="w-5 h-5" />
                     )}
                     {isSyncing ? t("syncingNow") : t("manualSync")}
                </button>
            </div>
        </motion.div>
    </div>
  );
};
