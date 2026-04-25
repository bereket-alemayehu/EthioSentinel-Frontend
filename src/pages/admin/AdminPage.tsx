import { useState } from "react";
import { useAlerts, useUpdateAlertStatusMutation, useGeoStats } from "@/features/admin/hooks/useAdmin";
import type { AlertItem } from "@/features/admin/types";
import type { GeoStat } from "@/features/admin/api";
import { Heatmap } from "@/features/admin/components/Heatmap";
import { useTranslation } from "react-i18next";

// ── Severity helpers ─────────────────────────────────────────────────────────
function severityBadgeClass(level: AlertItem["severity"]) {
  if (level === "CRITICAL") return "bg-red-100 text-red-700 ring-red-200";
  if (level === "HIGH")     return "bg-orange-100 text-orange-700 ring-orange-200";
  if (level === "MEDIUM")   return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

function severityIcon(level: AlertItem["severity"]) {
  if (level === "CRITICAL") return "🔴";
  if (level === "HIGH")     return "🟠";
  if (level === "MEDIUM")   return "🟡";
  return "🟢";
}

function statusStyle(status: AlertItem["status"]) {
  if (status === "Approved")
    return "bg-teal-50 text-teal-700 ring-1 ring-teal-200";
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

// ── District breakdown helpers ───────────────────────────────────────────────
function districtCaseSeverityDot(cases: number) {
  if (cases >= 200) return "bg-red-500";
  if (cases >= 100) return "bg-orange-500";
  if (cases >= 50)  return "bg-amber-500";
  return "bg-emerald-500";
}

type DistrictDiseaseStat = {
  disease: string;
  cases: number;
  deaths: number;
  reports: number;
};

function aggregateByDistrict(geoStats: GeoStat[]) {
  const map = new Map<string, { totalCases: number; totalDeaths: number; reportCount: number; diseaseRows: DistrictDiseaseStat[] }>();
  geoStats.forEach((s) => {
    if (!map.has(s.district)) {
      map.set(s.district, { totalCases: 0, totalDeaths: 0, reportCount: 0, diseaseRows: [] });
    }
    const entry = map.get(s.district)!;
    entry.totalCases  += s.totalCases;
    entry.totalDeaths += s.totalDeaths;
    entry.reportCount += s.reportCount;
    entry.diseaseRows.push({ disease: s.diseaseType, cases: s.totalCases, deaths: s.totalDeaths, reports: s.reportCount });
  });
  return [...map.entries()]
    .map(([district, stats]) => ({ district, ...stats }))
    .sort((a, b) => b.totalCases - a.totalCases);
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"alerts" | "map">("alerts");
  const { data: alerts = [], isLoading: loading, error: queryError } = useAlerts();
  const { data: geoStats = [], isLoading: geoLoading } = useGeoStats();
  const updateMutation = useUpdateAlertStatusMutation();

  const handleUpdate = async (id: number, action: "approve" | "reject") => {
    try { await updateMutation.mutateAsync({ id, action }); }
    catch (err) { console.error("Action failed", err); }
  };

  const error = queryError?.message || updateMutation.error?.message || "";
  const actionLoadingId = updateMutation.isPending ? updateMutation.variables?.id : null;

  const totalReports    = geoStats.reduce((acc, c) => acc + c.reportCount, 0);
  const totalCases      = geoStats.reduce((acc, c) => acc + c.totalCases, 0);
  const highRiskDistricts = aggregateByDistrict(geoStats).filter((d) => d.totalCases > 50).length;
  const districtList    = aggregateByDistrict(geoStats);
  const maxCases        = districtList[0]?.totalCases ?? 1;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/60">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                 style={{ background: "linear-gradient(135deg,#0f6b7c,#2e8b57)" }}>
              🛡️
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading text-slate-900 tracking-tight">
                {t("adminOversight")}
              </h1>
              <p className="mt-0.5 text-slate-500 text-sm">{t("adminOversightDesc")}</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white p-1 rounded-xl w-fit border shadow-sm gap-1">
          {(["alerts", "map"] as const).map((tab) => {
            const labels: Record<typeof tab, string> = {
              alerts: `🔔 ${t("alertApprovals")}`,
              map:    `🗺️ ${t("diseaseHeatmap")}`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                style={activeTab === tab
                  ? { background: "linear-gradient(135deg,#0f6b7c,#2e8b57)" }
                  : {}}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            {error}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: ALERT APPROVALS
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "alerts" && (
        <div className="rounded-2xl border bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="px-6 py-4 border-b bg-linear-to-r from-slate-50 to-teal-50/30 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">📋 Pending Alert Approvals</h2>
            {!loading && (
              <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="overflow-auto max-h-[680px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm border-b z-10">
                <tr className="text-left">
                  <th className="px-6 py-4 font-semibold text-slate-700">Severity</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">🦠 Disease</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Advisory Content</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
                        <span className="text-sm font-medium">{t("loadingRecentAlerts")}</span>
                      </div>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="text-4xl">✅</div>
                        <div className="font-medium">{t("noPendingAlerts")}</div>
                        <div className="text-xs">All alerts have been reviewed</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      {/* Severity */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${severityBadgeClass(alert.severity)}`}>
                          {severityIcon(alert.severity)} {alert.severity}
                        </span>
                      </td>

                      {/* Disease */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900 text-sm">
                            {alert.disease ?? <span className="italic text-slate-400">Unknown</span>}
                          </span>
                          <span className="text-xs text-slate-400">#{alert.id}</span>
                        </div>
                      </td>

                      {/* Advisory */}
                      <td className="px-6 py-4 max-w-md">
                        <p className="line-clamp-3 text-slate-600 leading-relaxed text-sm">
                          {alert.advisory}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(alert.status)}`}>
                          {alert.status === "Approved" ? "✔ Approved" : "⏳ Draft"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleUpdate(alert.id, "approve")}
                            disabled={actionLoadingId === alert.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
                          >
                            {actionLoadingId === alert.id && updateMutation.variables?.action === "approve" ? "⏳" : "✔"} {t("approve")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleUpdate(alert.id, "reject")}
                            disabled={actionLoadingId === alert.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-sm transition-all"
                          >
                            {actionLoadingId === alert.id && updateMutation.variables?.action === "reject" ? "⏳" : "✕"} {t("reject")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: DISEASE HEATMAP
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "map" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: "📍", label: "Districts Tracked", value: districtList.length,     sub: "with geo-coordinates",   accent: "#0f6b7c" },
              { icon: "⚠️",  label: "High-Risk Areas",  value: `${highRiskDistricts}`,   sub: "districts > 50 cases",   accent: "#ea580c" },
              { icon: "🦠", label: "Cumulative Cases",  value: totalCases,               sub: `across ${totalReports} reports`, accent: "#dc2626" },
            ].map(({ icon, label, value, sub, accent }) => (
              <div key={label} className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                     style={{ background: `${accent}15` }}>
                  {icon}
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Two-column map + district list ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

            {/* Map panel */}
            <div className="rounded-2xl border bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
              {/* Map header */}
              <div className="px-5 py-3.5 border-b flex items-center justify-between bg-linear-to-r from-slate-50 to-teal-50/30">
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">🌍 Disease Distribution by District</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click a marker to see which disease was reported</p>
                </div>
                {geoLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="h-3.5 w-3.5 border-2 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
                    Loading…
                  </div>
                )}
              </div>

              {/* Loading overlay */}
              <div className="relative">
                {geoLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-b-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-slate-600">{t("renderingGeo")}</span>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <Heatmap data={geoStats} />
                </div>
              </div>
            </div>

            {/* District breakdown panel */}
            <div className="rounded-2xl border bg-white shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b bg-linear-to-r from-slate-50 to-teal-50/30 shrink-0">
                <h2 className="font-bold text-slate-800 text-sm">🏥 District Report Breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by total cases</p>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-50 max-h-[640px]">
                {geoLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                    <div className="h-6 w-6 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
                    <span className="text-sm">Loading districts…</span>
                  </div>
                ) : districtList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                    <div className="text-4xl">📭</div>
                    <div className="text-sm font-medium">No district data</div>
                  </div>
                ) : (
                  districtList.map((d, idx) => (
                    <div key={d.district} className="px-4 py-3.5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Rank */}
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? "bg-red-100 text-red-700" :
                          idx === 1 ? "bg-orange-100 text-orange-700" :
                          idx === 2 ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* District + severity dot */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${districtCaseSeverityDot(d.totalCases)}`} />
                            <span className="font-semibold text-slate-800 text-sm truncate">{d.district}</span>
                          </div>

                          {/* Per-disease breakdown: cases + deaths */}
                          <div className="flex flex-col gap-1.5 mb-2">
                            {d.diseaseRows.map((dr) => (
                              <div key={dr.disease} className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                                <div className="text-[10px] font-bold text-slate-600 mb-1">🦠 {dr.disease}</div>
                                <div className="flex gap-2">
                                  <span className="text-[10px] font-semibold" style={{ color: districtCaseSeverityDot(dr.cases).includes('red') ? '#dc2626' : districtCaseSeverityDot(dr.cases).includes('orange') ? '#ea580c' : districtCaseSeverityDot(dr.cases).includes('amber') ? '#d97706' : '#16a34a' }}>
                                    {dr.cases} cases
                                  </span>
                                  <span className="text-[10px] text-slate-300">·</span>
                                  <span className={`text-[10px] font-semibold ${dr.deaths > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    💀 {dr.deaths} deaths
                                  </span>
                                  <span className="text-[10px] text-slate-300">·</span>
                                  <span className="text-[10px] text-slate-500">{dr.reports} reports</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (d.totalCases / maxCases) * 100)}%`,
                                background: d.totalCases >= 200 ? "#dc2626" :
                                            d.totalCases >= 100 ? "#ea580c" :
                                            d.totalCases >= 50  ? "#d97706" : "#16a34a",
                              }}
                            />
                          </div>

                          {/* Totals */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Total:</span>
                            <span className="font-bold text-slate-600">{d.totalCases} cases</span>
                            <span>·</span>
                            <span className={`font-bold ${d.totalDeaths > 0 ? 'text-red-500' : 'text-slate-400'}`}>{d.totalDeaths} deaths</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Spatial Intelligence banner ──────────────────────────────── */}
          <div className="rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-5"
               style={{ background: "linear-gradient(135deg,#0f4c5c,#0f6b7c,#1a8a5a)" }}>
            <div className="space-y-1 text-white">
              <h3 className="text-lg font-bold">{t("spatialIntelligence")}</h3>
              <p className="text-sm text-white/70 max-w-lg">{t("spatialIntelligenceDesc")}</p>
            </div>
            <button className="shrink-0 bg-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                    style={{ color: "#0f6b7c" }}>
              📥 {t("exportGeoData")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
