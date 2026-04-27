import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, AlertTriangle, Activity, Database, Search, ChevronRight, Download, ShieldCheck, Map as MapIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Heatmap } from "./Heatmap";

interface MapIntelligenceProps {
  geoStats: any[];
  geoLoading: boolean;
  districtList: any[];
  totalCases: number;
  totalReports: number;
  highRiskDistricts: number;
  maxCases: number;
  t: (key: string) => string;
}

export function MapIntelligence({
  geoStats,
  geoLoading,
  districtList,
  totalCases,
  totalReports,
  highRiskDistricts,
  maxCases,
  t
}: MapIntelligenceProps) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: MapPin, label: "Districts Tracked", value: districtList.length, sub: "Surveillance Active", color: "from-teal-600 to-teal-800" },
          { icon: AlertTriangle, label: "High-Risk Areas", value: highRiskDistricts, sub: "Threshold > 50 cases", color: "from-orange-500 to-orange-700" },
          { icon: Activity, label: "Cumulative Cases", value: totalCases.toLocaleString(), sub: `From ${totalReports} data points`, color: "from-red-600 to-red-800" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="group relative overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-teal-950/20 bg-white dark:bg-slate-900 hover:shadow-2xl hover:shadow-slate-200/70 dark:hover:shadow-teal-900/40 transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-0">
              <div className={cn("absolute right-0 top-0 w-32 h-32 -mr-8 -mt-8 bg-linear-to-br opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full", color.split(' ')[0])} />
              <div className="p-7 flex items-center gap-6 relative z-10">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-linear-to-br", color)}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">{sub}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Two-column map + district list ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Map panel */}
        <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-none border-none overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="px-8 py-6 border-b dark:border-slate-800 flex flex-row items-center justify-between bg-white dark:bg-slate-900 relative">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-teal-600" />
                Disease Distribution Intelligence
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Geospatial mapping of reported outbreaks across Ethiopian provinces</p>
            </div>
            {geoLoading && (
              <div className="flex items-center gap-3 text-[10px] font-black text-teal-600 uppercase tracking-widest">
                <div className="h-3 w-3 border-2 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                Syncing...
              </div>
            )}
          </CardHeader>

          <div className="relative">
            {geoLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-slate-950/60 backdrop-blur-[2px] transition-all">
                <div className="bg-white/80 dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-4 border-teal-100 dark:border-teal-900 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin" />
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{t("renderingGeo")}</span>
                </div>
              </div>
            )}
            <div className="p-0">
              <Heatmap data={geoStats} />
            </div>
          </div>
        </Card>

        {/* District breakdown panel */}
        <Card className="shadow-2xl shadow-slate-200/40 dark:shadow-none flex flex-col h-[680px] border-none bg-white dark:bg-slate-900">
          <CardHeader className="px-8 py-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-100">Hotspot Analysis</CardTitle>
              <Database className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prioritized by outbreak intensity (Case count)</p>
          </CardHeader>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 px-4">
            {geoLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 h-full text-slate-400 dark:text-slate-600">
                <div className="h-8 w-8 border-3 border-slate-100 dark:border-slate-800 border-t-teal-500 rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest italic leading-none">Scanning Databases…</span>
              </div>
            ) : districtList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 h-full opacity-40">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <div className="text-xs font-bold uppercase tracking-[0.2em] dark:text-slate-400">Zero Hazards Detected</div>
              </div>
            ) : (
              districtList.map((d, idx) => {
                const isHazard = d.totalCases >= 100;
                return (
                  <div key={d.district} className={cn(
                    "group px-4 py-5 transition-all relative border-l-4 border-transparent",
                    isHazard ? "hover:border-red-500" : "hover:border-teal-500",
                    "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:scale-110",
                        idx === 0 ? "bg-red-600 text-white shadow-red-200" :
                        idx === 1 ? "bg-orange-500 text-white shadow-orange-200" :
                        idx === 2 ? "bg-amber-500 text-white shadow-amber-200" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[15px] truncate group-hover:text-[#0f6b7c] dark:group-hover:text-teal-400 transition-colors">{d.district}</span>
                          <Badge variant={isHazard ? "destructive" : "success"} className="text-[9px] font-black uppercase px-2 tracking-tighter italic border-none h-5">
                            {isHazard ? "Extreme" : "Monitored"}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          {d.diseaseRows.map((dr: any) => (
                            <div key={dr.disease} className="flex items-center justify-between group/row p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-wide">{dr.disease}</span>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Activity className="w-2.5 h-2.5 text-orange-500" />
                                  <span className="text-[10px] font-bold text-slate-800">{dr.cases}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 opacity-80 decoration-slate-300">💀 {dr.deaths}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Intensity Visualizer */}
                        <div className="space-y-2">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                            <div
                              className={cn("h-1.5 rounded-full transition-all duration-1000 ease-out shadow-xs", isHazard ? "bg-red-500" : "bg-teal-500")}
                              style={{
                                width: `${Math.min(100, (d.totalCases / maxCases) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            <div className="flex gap-2">
                              <span>{d.totalCases} cases</span>
                              <span className="opacity-30">•</span>
                              <span className={cn(d.totalDeaths > 0 ? "text-red-500 dark:text-red-400" : "")}>{d.totalDeaths} fatalities</span>
                            </div>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ── Intelligence Deck ──────────────────────────────── */}
      <Card className="border-none shadow-2xl p-8 overflow-hidden relative"
            style={{ background: "linear-gradient(135deg,#0d414d,#0f6b7c,#167554)" }}>
        <div className="absolute right-0 bottom-0 opacity-[0.08] translate-x-1/4 translate-y-1/4 select-none pointer-events-none">
          <ShieldCheck className="w-[400px] h-[400px] text-white" />
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-2 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-white/5">AI Insight Engine</div>
            <h3 className="text-2xl font-black tracking-tight">{t("spatialIntelligence")}</h3>
            <p className="text-sm text-teal-50/70 max-w-xl font-medium leading-relaxed">{t("spatialIntelligenceDesc")}</p>
          </div>
          <div className="flex gap-3">
            <button className="group shrink-0 bg-white dark:bg-slate-900 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-50 dark:hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-2"
                    style={{ color: "#0f6b7c" }}>
              <Download className="w-4 h-4 transition-bounce" />
              {t("exportGeoData")}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
