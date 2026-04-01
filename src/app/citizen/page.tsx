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
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    rash: false,
    dehydration: false,
  });

  const triageResult = useMemo(() => {
    const score = Object.values(symptoms).filter(Boolean).length;
    if (score >= 3) {
      return { level: "High", action: "Visit nearest health center immediately." };
    }
    if (score === 2) {
      return { level: "Medium", action: "Book a clinical checkup within 24 hours." };
    }
    return { level: "Low", action: "Monitor symptoms and hydrate regularly." };
  }, [symptoms]);

  const localized = useMemo(
    () => ({
      en: {
        title: "Citizen Dashboard",
        subtitle: "Live outbreak intelligence for your area",
        mapTitle: "Interactive Outbreak Map",
        riskTitle: "Local Risk Level",
        triage: "Symptom Triage",
        legend: "Legend",
        triageHint: "Select symptoms to get instant guidance.",
      },
      am: {
        title: "የዜጎች ዳሽቦርድ",
        subtitle: "ለአካባቢዎ የቀጥታ ወረርሽኝ መረጃ",
        mapTitle: "ቀለም ያለው የወረርሽኝ ካርታ",
        riskTitle: "የአካባቢ አደጋ ደረጃ",
        triage: "የምልክት ምዘና",
        legend: "ምልክት",
        triageHint: "ፈጣን መመሪያ ለማግኘት ምልክቶችን ይምረጡ።",
      },
      om: {
        title: "Daashboordii Lammiilee",
        subtitle:
          "Odeeffannoo daddarbaa dhukkubaa yeroo dhugaa naannoo keetiif",
        mapTitle: "Kaartaa Daddarbaa Wal-qunnamtii",
        riskTitle: "Sadarkaa Balaa Naannoo",
        triage: "Qorannoo Mallattoo",
        legend: "Ibsa Halluu",
        triageHint: "Qajeelfama battalaa argachuuf mallattoolee fili.",
      },
    }),
    [],
  )[language];

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {localized.title}
      </h1>
      <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
        {localized.subtitle}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-slate-900">{localized.mapTitle}</h2>
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

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{localized.riskTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">{selectedArea.name}</p>
          <p className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
            {selectedArea.level}
          </p>

          <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{localized.triage}</p>
            <p className="text-xs text-slate-500">{localized.triageHint}</p>
            {(
              [
                ["fever", "Fever"],
                ["cough", "Cough"],
                ["rash", "Skin Rash"],
                ["dehydration", "Dehydration"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={symptoms[key]}
                  onChange={(event) =>
                    setSymptoms((current) => ({ ...current, [key]: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {label}
              </label>
            ))}
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{triageResult.level} Risk</p>
              <p className="mt-1 text-xs text-slate-600">{triageResult.action}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">{t.appName}</p>
        </article>
      </div>
    </section>
  );
}
