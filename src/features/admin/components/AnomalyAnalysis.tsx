import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, ArrowRight, BarChart3, Map as MapIcon, Table2, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { GeoStat } from "../api";
import {
  useAnomalies,
  useAnomalyTimeseries,
  useRunAnomalyMutation,
} from "../hooks/useAdmin";
import { useRegions } from "@/features/advisory/hooks/useAdvisory";
import { getDiseases } from "@/features/reporting/api/index";
import { useQuery } from "@tanstack/react-query";
import { exportAnomaliesBlob } from "../api";
import { downloadBlob, timestampedFilename } from "@/shared/utils/download";
import { toast } from "sonner";
import { Heatmap } from "./Heatmap";
import type { District } from "@/features/advisory/types";

type SubView = "chart" | "map" | "table";

interface AnomalyAnalysisProps {
  geoStats: GeoStat[];
  geoLoading: boolean;
  t: (key: string) => string;
}

export function AnomalyAnalysis({ geoStats, geoLoading, t }: AnomalyAnalysisProps) {
  const [subView, setSubView] = useState<SubView>("chart");
  const [page, setPage] = useState(1);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedDiseaseName, setSelectedDiseaseName] = useState("");
  const [lookbackDays, setLookbackDays] = useState(7);
  const [persistSignal, setPersistSignal] = useState(false);
  const [classificationFilter, setClassificationFilter] = useState<"" | "ANOMALY" | "NORMAL">("");

  const { data: regions = [], isLoading: regionsLoading } = useRegions();
  const { data: diseases = [] } = useQuery({
    queryKey: ["diseases", "all"],
    queryFn: getDiseases,
    staleTime: 1000 * 60 * 30,
  });

  const selectionFilters = useMemo(
    () => ({
      district: selectedDistrictName || undefined,
      diseaseType: selectedDiseaseName || undefined,
      classification: classificationFilter || undefined,
    }),
    [selectedDistrictName, selectedDiseaseName, classificationFilter],
  );

  const anomalyQuery = useMemo(
    () => ({
      ...selectionFilters,
      page,
      limit: 20,
    }),
    [page, selectionFilters],
  );

  const { data: anomaliesPage, isLoading: anomaliesLoading } = useAnomalies(anomalyQuery);

  const hotspotQuery = useMemo(
    () => ({
      district: selectedDistrictName || undefined,
      diseaseType: selectedDiseaseName || undefined,
      classification: classificationFilter || undefined,
      page: 1,
      limit: 200,
    }),
    [selectedDistrictName, selectedDiseaseName, classificationFilter],
  );

  const { data: anomalyHotspots } = useAnomalies(hotspotQuery);

  const timeseriesParams =
    selectedDistrictName && selectedDiseaseName
      ? { district: selectedDistrictName, diseaseType: selectedDiseaseName, days: 30 }
      : null;

  const { data: ts, isLoading: tsLoading } = useAnomalyTimeseries(timeseriesParams);

  const runMutation = useRunAnomalyMutation();

  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
  }, [regions, selectedRegionId]);

  const districtOptions: District[] = useMemo(() => {
    const region = regions.find((r) => String(r.id) === selectedRegionId);
    return region?.districts ?? [];
  }, [regions, selectedRegionId]);

  useEffect(() => {
    if (districtOptions.length > 0 && !selectedDistrictName) {
      setSelectedDistrictName(districtOptions[0].name);
    }
  }, [districtOptions, selectedDistrictName]);

  useEffect(() => {
    const first = diseases[0]?.name;
    if (first && !selectedDiseaseName) {
      setSelectedDiseaseName(first);
    }
  }, [diseases, selectedDiseaseName]);

  useEffect(() => {
    setPage(1);
  }, [selectedDistrictName, selectedDiseaseName, classificationFilter]);

  const anomalyMapData = useMemo(() => {
    const rows = anomalyHotspots?.data ?? [];
    const keys = new Set(rows.map((r) => `${r.district}|${r.diseaseType}`));
    if (keys.size === 0) return [];
    return geoStats.filter((g) => keys.has(`${g.district}|${g.diseaseType}`));
  }, [anomalyHotspots?.data, geoStats]);

  const chartData = useMemo(() => {
    if (!ts?.series) return [];
    return ts.series.map((d) => ({
      ...d,
      mean: ts.summary.mean,
      upper2: ts.summary.threshold2Sigma,
      upper3: ts.summary.threshold3Sigma,
    }));
  }, [ts]);

  const handleExportAnomalies = async () => {
    try {
      const blob = await exportAnomaliesBlob({
        district: selectedDistrictName || undefined,
        diseaseType: selectedDiseaseName || undefined,
        classification: classificationFilter || undefined,
      });
      downloadBlob(blob, timestampedFilename("anomaly-signals", "csv"));
      toast.success(t("exportStarted") || "Download started");
    } catch (e) {
      toast.error(t("exportFailed") || "Export failed");
      console.error(e);
    }
  };

  const handleRun = () => {
    if (!selectedDistrictName || !selectedDiseaseName) return;
    runMutation.mutate(
      {
        district: selectedDistrictName,
        diseaseType: selectedDiseaseName,
        lookbackDays,
        persist: persistSignal,
      },
      {
        onSuccess: (res) => {
          toast.success(
            `${t("zScoreShort")}: ${res.zScore ?? "–"} · ${res.classification}`,
          );
        },
        onError: (err: Error) => {
          toast.error(err.message || String(err));
        },
      },
    );
  };

  const runResult = runMutation.data;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-slate-100">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            {t("runZscore")}
          </CardTitle>
          <CardDescription>{t("runZscoreHint")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{t("region")}</label>
            <select
              value={selectedRegionId}
              disabled={regionsLoading}
              onChange={(e) => {
                setSelectedRegionId(e.target.value);
                setSelectedDistrictName("");
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {regions.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{t("district")}</label>
            <select
              value={selectedDistrictName}
              onChange={(e) => setSelectedDistrictName(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {districtOptions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">{t("disease")}</label>
            <select
              value={selectedDiseaseName}
              onChange={(e) => setSelectedDiseaseName(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {diseases.map((d: { id: number; name: string }) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              {t("lookbackDays")} ({lookbackDays}d)
            </label>
            <input
              type="range"
              min={1}
              max={90}
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={persistSignal}
                onChange={(e) => setPersistSignal(e.target.checked)}
              />
              {t("persistSignal")}
            </label>
            <Button
              type="button"
              onClick={handleRun}
              disabled={runMutation.isPending || !selectedDistrictName || !selectedDiseaseName}
              className="primary-gradient text-white rounded-xl font-bold"
            >
              {runMutation.isPending ? t("scanningDatabases") : t("runAnalysis")}
            </Button>
          </div>
        </CardContent>
        {runResult && (
          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 p-4 flex flex-wrap gap-4 items-center">
              <Badge variant="secondary" className="text-xs font-black">
                {t("classification")}: {runResult.classification}
              </Badge>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t("zScoreShort")}: {runResult.zScore ?? "—"}
              </span>
              <span className="text-xs text-slate-500">
                n={runResult.sampleSize} · μ={runResult.historicalMean.toFixed(2)} · σ=
                {runResult.stdDev.toFixed(2)}
              </span>
              {runResult.signalId && (
                <span className="text-xs text-teal-700 dark:text-teal-400">
                  ID: {runResult.signalId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-1.5">
          {(
            [
              { id: "chart" as const, icon: BarChart3, label: t("chartView") },
              { id: "map" as const, icon: MapIcon, label: t("mapView") },
              { id: "table" as const, icon: Table2, label: t("tableView") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                subView === tab.id
                  ? "bg-[#0f6b7c] text-white shadow-lg"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value as typeof classificationFilter);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900"
          >
            <option value="">{t("allClassifications")}</option>
            <option value="ANOMALY">ANOMALY</option>
            <option value="NORMAL">NORMAL</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExportAnomalies} className="rounded-xl font-bold">
            <ArrowRight className="w-4 h-4 mr-1 -rotate-90" />
            {t("exportAnomalies")}
          </Button>
        </div>
      </div>

      {subView === "chart" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              {t("anomalyTrendChart")}
            </CardTitle>
            <CardDescription>{t("anomalyTrendChartDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[420px]">
            {!selectedDistrictName || !selectedDiseaseName ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t("selectDistrictDisease")}</div>
            ) : tsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500">
                <Activity className="w-12 h-12 opacity-30" />
                <p className="text-sm">{t("noTimeseriesData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend />
                  {ts && (
                    <>
                      <ReferenceArea
                        y1={ts.summary.mean}
                        y2={ts.summary.threshold2Sigma}
                        fill="#fbbf24"
                        fillOpacity={0.12}
                        ifOverflow="extendDomain"
                      />
                      <ReferenceLine
                        y={ts.summary.mean}
                        stroke="#64748b"
                        strokeDasharray="4 4"
                        label={{ value: "μ", fill: "#64748b", fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={ts.summary.threshold2Sigma}
                        stroke="#f97316"
                        strokeDasharray="4 4"
                        label={{ value: "+2σ", fill: "#f97316", fontSize: 10 }}
                      />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="#0f6b7c"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name={t("caseCount")}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={(props: { cx?: number; cy?: number; payload?: { isAnomaly?: boolean } }) => {
                      const { cx, cy, payload } = props;
                      if (!payload?.isAnomaly || cx == null || cy == null) return <g />;
                      return (
                        <circle cx={cx} cy={cy} r={7} fill="#dc2626" stroke="#fff" strokeWidth={2} />
                      );
                    }}
                    legendType="none"
                    name={t("anomalyPoints")}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {subView === "map" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-teal-600" />
              {t("anomalyMap")}
            </CardTitle>
            <CardDescription>{t("anomalyMapDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {geoLoading ? (
              <div className="h-[540px] flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : anomalyMapData.length === 0 ? (
              <div className="h-[540px] flex flex-col items-center justify-center gap-3 text-slate-500">
                <AlertTriangle className="w-14 h-14 opacity-30" />
                <p className="text-sm font-medium">{t("noAnomalyMarkers")}</p>
              </div>
            ) : (
              <Heatmap data={anomalyMapData} />
            )}
          </CardContent>
        </Card>
      )}

      {subView === "table" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle>{t("anomalyHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 border-b dark:border-slate-800">
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-3">{t("timestamp")}</th>
                    <th className="px-6 py-3">{t("district")}</th>
                    <th className="px-6 py-3">{t("disease")}</th>
                    <th className="px-6 py-3">{t("caseCount")}</th>
                    <th className="px-6 py-3">{t("historicalMean")}</th>
                    <th className="px-6 py-3">{t("stdDevLabel")}</th>
                    <th className="px-6 py-3">{t("zScoreShort")}</th>
                    <th className="px-6 py-3">{t("classification")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {anomaliesLoading ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400">
                        {t("loadingAnomalies")}
                      </td>
                    </tr>
                  ) : !(anomaliesPage?.data ?? []).length ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400">
                        {t("noAnomalyRecords")}
                      </td>
                    </tr>
                  ) : (
                    (anomaliesPage?.data ?? []).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{row.district}</td>
                        <td className="px-6 py-4">{row.diseaseType}</td>
                        <td className="px-6 py-4">{row.currentCases}</td>
                        <td className="px-6 py-4">{row.historicalMean}</td>
                        <td className="px-6 py-4">{row.stdDev}</td>
                        <td
                          className={cn(
                            "px-6 py-4 font-black",
                            (row.zScore ?? 0) >= 3
                              ? "text-red-600"
                              : (row.zScore ?? 0) >= 2
                                ? "text-orange-600"
                                : "text-slate-600",
                          )}
                        >
                          {row.zScore ?? "–"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={row.classification === "ANOMALY" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {row.classification}
                          </Badge>
                          {row.manual && (
                            <span className="ml-1 text-[9px] text-slate-400">({t("manualRun")})</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {anomaliesPage && anomaliesPage.meta.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("previousPage")}
                </Button>
                <span className="text-xs font-bold text-slate-500">
                  {page} / {anomaliesPage.meta.totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= anomaliesPage.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("nextPage")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
