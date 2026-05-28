import { ShieldCheck, FileText, Map as MapIcon, Activity } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type AdminTab = "advisories" | "map" | "anomaly";

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  t: (key: string) => string;
}

export function AdminHeader({ activeTab, setActiveTab, t }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-900/20"
               style={{ background: "linear-gradient(135deg,#0f6b7c,#2e8b57)" }}>
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {t("adminOversight")}
            </h1>
            <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium">{t("adminOversightDesc")}</p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-800 shadow-sm gap-1.5">
        {(["advisories", "map", "anomaly"] as const).map((tab) => {
          const isActive = activeTab === tab;
          let Icon = FileText;
          if (tab === "map") Icon = MapIcon;
          if (tab === "anomaly") Icon = Activity;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-[#0f6b7c] text-white shadow-lg shadow-teal-900/10 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 transition-transform", isActive ? "scale-110" : "")} />
              {tab === "advisories"
                ? t("advisoriesAdmin")
                : tab === "map"
                  ? t("diseaseHeatmap")
                  : t("anomalyAnalysis")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
