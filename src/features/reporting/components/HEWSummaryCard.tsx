import React from "react";
import { motion } from "framer-motion";
import { 
  Wifi, 
  WifiOff, 
  Zap, 
  BadgeCheck,
  TrendingUp
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface HEWSummaryCardProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => void;
  t: any;
  dailyThroughput?: number;
  activeSessionInfo?: {
    userName: string;
    location: string;
  };
  isThroughputLoading?: boolean;
}

export const HEWSummaryCard: React.FC<HEWSummaryCardProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
  syncNow,
  t,
  dailyThroughput = 0,
  activeSessionInfo,
  isThroughputLoading = false
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="card-wrapper p-6 rounded-[2rem] border border-white/20 dark:border-white/5 shadow-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-4 group">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' 
              : 'bg-red-500/10 text-red-500 shadow-red-500/10'
          }`}>
            {isOnline ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-light-500 uppercase tracking-widest leading-none mb-1">Network Status</p>
            <p className={`text-sm font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
              {isOnline ? t("online") || "System Online" : t("offline") || "Local Cache Only"}
            </p>
          </div>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Zap className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-[10px] font-black text-light-500 uppercase tracking-widest leading-none mb-1">Queue Alpha</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tighter">
                {pendingCount} {t("pending") || "Pending"}
              </span>
              {pendingCount > 0 && isOnline && (
                <Button 
                  onClick={syncNow}
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[8px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 rounded-lg animate-bounce"
                >
                  Sync Now
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Efficiency/Summary */}
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-light-500 uppercase tracking-widest leading-none mb-1">Daily Throughput</p>
            <p className="text-sm font-black text-dark-300 dark:text-white uppercase tracking-tighter flex items-center gap-1">
              {isThroughputLoading ? (
                <span className="inline-flex items-center gap-1 opacity-50">
                  <span className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  {t("loading") || "Calculating..."}
                </span>
              ) : (
                <>
                  {dailyThroughput} {t("reports") || "Reports"} / 24h
                </>
              )}
            </p>
            {activeSessionInfo && (
              <p className="text-[9px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                {activeSessionInfo.userName} @ {activeSessionInfo.location} <BadgeCheck className="w-3 h-3" />
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
