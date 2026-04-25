import { useState } from "react";
import { useAlerts, useUpdateAlertStatusMutation, useGeoStats } from "@/features/admin/hooks/useAdmin";
import type { AlertItem } from "@/features/admin/types";
import { Heatmap } from "@/features/admin/components/Heatmap";

function severityBadgeClass(level: AlertItem["severity"]) {
  if (level === "CRITICAL" || level === "HIGH")
    return "bg-red-100 text-red-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "map">("alerts");
  const { data: alerts = [], isLoading: loading, error: queryError } = useAlerts();
  const { data: geoStats = [], isLoading: geoLoading } = useGeoStats();
  const updateMutation = useUpdateAlertStatusMutation();

  const handleUpdate = async (
    id: number,
    action: "approve" | "reject",
  ) => {
    try {
      await updateMutation.mutateAsync({ id, action });
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const error = queryError?.message || updateMutation.error?.message || "";
  const actionLoadingId = updateMutation.isPending ? updateMutation.variables?.id : null;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Admin Oversight
          </h1>
          <p className="mt-2 text-slate-500">
            Monitor regional health status and manage system alerts.
          </p>
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit border shadow-sm">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "alerts"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Alert Approvals
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "map"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Disease Heatmap
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            {error}
          </div>
        </div>
      ) : null}

      {activeTab === "alerts" ? (
        <div className="rounded-2xl border bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="overflow-auto max-h-[700px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm border-b z-10">
                <tr className="text-left">
                  <th className="px-6 py-4 font-semibold text-slate-700">Disease</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Severity</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Advisory Content</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Loading recent alerts...
                      </div>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No pending alerts requiring action.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors align-top">
                      <td className="px-6 py-4 font-medium text-slate-900">{alert.disease ?? "Unknown"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ring-slate-200/50 ${severityBadgeClass(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xl">
                        <p className="line-clamp-3 text-slate-600 leading-relaxed text-sm">
                          {alert.advisory}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-slate-500 italic">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdate(alert.id, "approve")
                            }
                            disabled={actionLoadingId === alert.id}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 shadow-sm transition-all"
                          >
                            {actionLoadingId === alert.id && updateMutation.variables?.action === 'approve' ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdate(alert.id, "reject")
                            }
                            disabled={actionLoadingId === alert.id}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 shadow-sm transition-all"
                          >
                            {actionLoadingId === alert.id && updateMutation.variables?.action === 'reject' ? '...' : 'Reject'}
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
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center justify-center space-y-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Reports</span>
              <span className="text-3xl font-bold text-slate-900">{geoStats.reduce((acc, curr) => acc + curr.reportCount, 0)}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center justify-center space-y-2 border-l-4 border-l-red-500">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">High Risk Areas</span>
              <span className="text-3xl font-bold text-slate-900">{geoStats.filter(s => s.totalCases > 50).length} Districts</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center justify-center space-y-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cumulative Cases</span>
              <span className="text-3xl font-bold text-slate-900">{geoStats.reduce((acc, curr) => acc + curr.totalCases, 0)}</span>
            </div>
          </div>
          
          <div className="relative group">
            {geoLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl transition-all">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                  <span className="text-sm font-bold text-slate-700 animate-pulse">Rendering Geo-Spatial Data...</span>
                </div>
              </div>
            )}
            <div className="rounded-2xl border bg-white shadow-2xl p-4 shadow-slate-200/50">
              <Heatmap data={geoStats} />
            </div>
          </div>
          
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Spatial Intelligence Activated</h3>
              <p className="text-slate-400 text-sm max-w-lg">
                The heatmap visualizes disease density across Ethiopia by aggregating case counts from the Python anomaly detection engine. Use this to prioritize intervention resources.
              </p>
            </div>
            <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm">
              Export Geo-Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
