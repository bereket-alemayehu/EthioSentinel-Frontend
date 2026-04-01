"use client";

import { useMemo, useState } from "react";
import { text } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

type RiskLevel = "Low" | "Medium" | "High";

const areas: Array<{ name: string; level: RiskLevel }> = [
  { name: "Addis Ababa", level: "High" },
  { name: "Amhara", level: "Medium" },
  { name: "Oromia", level: "Medium" },
  { name: "Tigray", level: "Low" },
  { name: "SNNPR", level: "Low" },
  { name: "Somali", level: "High" },
];

const levelStyle: Record<RiskLevel, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-rose-600",
};

export default function CitizenDashboardPage() {
  const { language } = useLanguage();
  const t = text[language];
  const [selectedArea, setSelectedArea] = useState(areas[0]);

  const localized = useMemo(
    () => ({
      en: {
        title: "Citizen Dashboard",
        subtitle: "Live outbreak intelligence for your area",
        mapTitle: "Interactive Outbreak Map",
        riskTitle: "Local Risk Level",
        triage: "Check My Symptoms",
        legend: "Legend",
      },
      am: {
        title: "የዜጎች ዳሽቦርድ",
        subtitle: "ለአካባቢዎ የቀጥታ ወረርሽኝ መረጃ",
        mapTitle: "ቀለም ያለው የወረርሽኝ ካርታ",
        riskTitle: "የአካባቢ አደጋ ደረጃ",
        triage: "ምልክቶቼን ያረጋግጡ",
        legend: "ምልክት",
      },
      om: {
        title: "Daashboordii Lammiilee",
        subtitle:
          "Odeeffannoo daddarbaa dhukkubaa yeroo dhugaa naannoo keetiif",
        mapTitle: "Kaartaa Daddarbaa Wal-qunnamtii",
        riskTitle: "Sadarkaa Balaa Naannoo",
        triage: "Mallattoolee Koo Ilaali",
        legend: "Ibsa Halluu",
      },
    }),
    [],
  )[language];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {localized.title}
      </h1>
      <p className="text-sm text-slate-600 sm:text-base">
        {localized.subtitle}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">{localized.mapTitle}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {areas.map((area) => (
              <button
                key={area.name}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`h-20 rounded-xl p-2 text-left text-white transition hover:brightness-110 ${
                  levelStyle[area.level]
                } ${selectedArea.name === area.name ? "ring-4 ring-slate-900/30" : ""}`}
              >
                <p className="text-sm font-bold">{area.name}</p>
                <p className="text-xs">{area.level}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">
              {localized.legend}:
            </span>
            <span className="rounded-full bg-emerald-500 px-2 py-1 text-white">
              Low
            </span>
            <span className="rounded-full bg-amber-500 px-2 py-1 text-white">
              Medium
            </span>
            <span className="rounded-full bg-rose-600 px-2 py-1 text-white">
              High
            </span>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">{localized.riskTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">{selectedArea.name}</p>
          <p className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
            {selectedArea.level}
          </p>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-extrabold text-white shadow hover:bg-emerald-700"
          >
            {localized.triage}
          </button>

          <p className="mt-3 text-xs text-slate-500">{t.appName}</p>
        </article>
      </div>
    </section>
  );
}
