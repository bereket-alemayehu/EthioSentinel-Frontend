"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type SpikeRow = {
  district: string;
  disease: string;
  trend: string;
  updated: string;
};

const baseRows: SpikeRow[] = [
  {
    district: "Addis Ketema",
    disease: "Cholera",
    trend: "+34%",
    updated: "now",
  },
  { district: "Bahir Dar", disease: "Malaria", trend: "+19%", updated: "1m" },
  { district: "Adama", disease: "Measles", trend: "+11%", updated: "2m" },
  { district: "Jijiga", disease: "Dengue", trend: "+22%", updated: "3m" },
];

export default function AdminPanelPage() {
  const { language } = useLanguage();
  const [rows, setRows] = useState<SpikeRow[]>(baseRows);

  useEffect(() => {
    const timer = setInterval(() => {
      setRows((current) =>
        current.map((row) => ({
          ...row,
          trend: `+${Math.floor(10 + Math.random() * 30)}%`,
          updated: "now",
        })),
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const copy = useMemo(
    () => ({
      en: {
        title: "Admin Panel",
        spikes: "Real-time Disease Spike Grid",
        review: "Review Needed (AI Advisories)",
        occupancy: "Hospital Bed Occupancy",
      },
      am: {
        title: "አስተዳዳሪ ፓነል",
        spikes: "የበሽታ ግሽበት መረጃ ግሪድ",
        review: "ማረጋገጥ ያስፈልጋል (AI ምክሮች)",
        occupancy: "የሆስፒታል አልጋ መያዣ",
      },
      om: {
        title: "Paanaalii Bulchiinsaa",
        spikes: "Gabatee Daddarbaa Dhukkubaa Yeroo-dhugaa",
        review: "Ilaalcha Barbaada (Gorsa AI)",
        occupancy: "Guutummaa Siree Hospitaalaa",
      },
    }),
    [],
  )[language];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{copy.title}</h1>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <h2 className="mb-3 text-lg font-bold">{copy.spikes}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2">District</th>
                  <th className="px-2 py-2">Disease</th>
                  <th className="px-2 py-2">Spike</th>
                  <th className="px-2 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={`${row.district}-${idx}`}
                    className="border-b border-slate-100"
                  >
                    <td className="px-2 py-2 font-semibold">{row.district}</td>
                    <td className="px-2 py-2">{row.disease}</td>
                    <td className="px-2 py-2 text-rose-600 font-bold">
                      {row.trend}
                    </td>
                    <td className="px-2 py-2">{row.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-lg font-bold">{copy.review}</h2>
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
              Cholera water advisory draft for Addis Ketema.
            </li>
            <li className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
              Malaria spray campaign recommendation for Bahir Dar.
            </li>
            <li className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
              Measles vaccination urgency alert for Adama schools.
            </li>
          </ul>
        </article>
      </div>

      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-lg font-bold">{copy.occupancy}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { hospital: "St. Paul", occupancy: 82 },
            { hospital: "Black Lion", occupancy: 91 },
            { hospital: "Adama General", occupancy: 67 },
            { hospital: "Jijiga Referral", occupancy: 74 },
          ].map((item) => (
            <div
              key={item.hospital}
              className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
              <p className="text-sm font-semibold">{item.hospital}</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${item.occupancy}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-bold text-slate-600">
                {item.occupancy}% occupied
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
