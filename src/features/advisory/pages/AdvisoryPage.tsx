import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { District } from "@/features/advisory/types";
import { SymptomChecker } from "../components/SymptomChecker";
import { AdvisoryArticles } from "../components/AdvisoryArticles";
import { useRegions, useAdvisories } from "../hooks/useAdvisory";

export default function AdvisoryPage() {
  const { t, i18n } = useTranslation();
  const preferredLanguage = i18n.language === "am" ? "AMHARIC" : "ENGLISH";
  const { data: regions = [], isLoading: regionsLoading } = useRegions();
  const { data: advisories = [], isLoading: advisoriesLoading } =
    useAdvisories(preferredLanguage);

  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [tab, setTab] = useState<"browse" | "symptom">("browse");

  const loading = regionsLoading || advisoriesLoading;

  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(String(regions[0].id));
    }
  }, [regions, selectedRegionId]);

  const districtOptions = useMemo(() => {
    const r = regions.find((x) => String(x.id) === selectedRegionId);
    return r?.districts ?? [];
  }, [regions, selectedRegionId]);

  const filtered = useMemo(() => {
    if (!selectedRegionId) return advisories;
    return advisories.filter((item) => {
      if (String(item.regionId) !== selectedRegionId) return false;
      if (!selectedDistrictId) return true;
      return item.districtId === null || String(item.districtId) === selectedDistrictId;
    });
  }, [advisories, selectedRegionId, selectedDistrictId]);

  return (
    <div className="w-full min-h-screen pb-24">
      <div className="relative overflow-hidden bg-linear-to-br from-[#0f6b7c] via-primary-600 to-[#2e8b57] text-white px-6 sm:px-10 lg:px-16 py-10">
        <div className="relative max-w-5xl mx-auto space-y-6">
          <div>
            <p className="text-white/75 text-sm font-semibold">{t("advisoryBrowseTitle")}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">{t("advisory")}</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-white/70">{t("region")}</label>
              <select
                value={selectedRegionId}
                onChange={(e) => {
                  setSelectedRegionId(e.target.value);
                  setSelectedDistrictId("");
                }}
                className="min-w-[200px] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm"
              >
                {regions.map((r) => (
                  <option key={r.id} value={String(r.id)} className="bg-primary-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-white/70">{t("district")}</label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="min-w-[200px] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm"
              >
                <option value="" className="bg-primary-900 text-white">
                  {t("allDistricts")}
                </option>
                {districtOptions.map((d: District) => (
                  <option key={d.id} value={String(d.id)} className="bg-primary-900 text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === "browse" ? "bg-white text-[#0f6b7c]" : "bg-white/10 text-white"}`}
            >
              {t("advisories")}
            </button>
            <button
              type="button"
              onClick={() => setTab("symptom")}
              className={`rounded-xl px-5 py-2 text-sm font-bold transition ${tab === "symptom" ? "bg-white text-[#0f6b7c]" : "bg-white/10 text-white"}`}
            >
              🩺 {t("symptomCheck")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-10">
        {tab === "browse" ? (
          <AdvisoryArticles items={filtered} loading={loading} />
        ) : (
          <div className="rounded-3xl border border-border overflow-hidden shadow-sm bg-card">
            <div className="border-b border-border px-6 py-4 bg-muted/40">
              <h2 className="text-lg font-bold">{t("aiSymptomChecker")}</h2>
              <p className="text-sm text-muted-foreground">{t("symptomCheckerDesc")}</p>
            </div>
            <div className="p-6">
              <SymptomChecker />
            </div>
          </div>
        )}
      </div>
      <p className="sr-only">{t("advisoryAssistNote")}</p>
    </div>
  );
}
