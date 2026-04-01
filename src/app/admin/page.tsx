"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { RoleGate } from "@/components/role-gate";
import { CaseReport, getCaseReports, markReportReviewed } from "@/lib/reports";

export default function AdminPanelPage() {
  const { language } = useLanguage();
  const [reports, setReports] = useState<CaseReport[]>([]);

  useEffect(() => {
    const hydrate = () => setReports(getCaseReports());
    hydrate();
    window.addEventListener("case-reports-updated", hydrate);
    return () => window.removeEventListener("case-reports-updated", hydrate);
  }, []);

  const copy = useMemo(
    () => ({
      en: {
        title: "Admin Panel",
        intake: "Incoming Case Reports",
        review: "Recommended Actions",
        occupancy: "Facility Capacity",
        empty: "No submitted reports yet.",
        markReviewed: "Mark Reviewed",
      },
      am: {
        title: "አስተዳዳሪ ፓነል",
        intake: "የገቡ የኬዝ ሪፖርቶች",
        review: "የሚመከሩ እርምጃዎች",
        occupancy: "የተቋም አቅም",
        empty: "እስካሁን የተላከ ሪፖርት የለም።",
        markReviewed: "ተመርመረ ብለው ምልክት ያድርጉ",
      },
      om: {
        title: "Paanaalii Bulchiinsaa",
        intake: "Gabaasota Dhukkuba Galan",
        review: "Tarkaanfiiwwan Gorfaman",
        occupancy: "Dandeettii Dhaabbataa",
        empty: "Gabaasni ammaaf hin jiru.",
        markReviewed: "Akka Ilaalameetti Mallatteessi",
      },
    }),
    [],
  )[language];

  const hotspots = reports
    .filter((item) => item.status === "new")
    .reduce<Record<string, number>>((acc, item) => {
      const key = `${item.location} (${item.disease})`;
      acc[key] = (acc[key] ?? 0) + item.cases;
      return acc;
    }, {});

  return (
    <RoleGate allowedRoles={["admin"]}>
      <section className="space-y-5">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{copy.title}</h1>

        <div className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{copy.intake}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Disease</th>
                    <th className="px-2 py-2">Cases</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td className="px-2 py-4 text-slate-500" colSpan={5}>
                        {copy.empty}
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-semibold text-slate-900">{report.location}</td>
                        <td className="px-2 py-2">{report.disease}</td>
                        <td className="px-2 py-2">{report.cases}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              report.status === "new"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          {report.status === "new" ? (
                            <button
                              type="button"
                              onClick={() => markReportReviewed(report.id)}
                              className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              {copy.markReviewed}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">{copy.review}</h2>
            <ul className="space-y-2 text-sm">
              {Object.keys(hotspots).length === 0 ? (
                <li className="rounded-lg bg-slate-50 p-3 text-slate-500 ring-1 ring-slate-200">
                  No new spikes detected.
                </li>
              ) : (
                Object.entries(hotspots)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([key, totalCases]) => (
                    <li
                      key={key}
                      className="rounded-lg bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-200"
                    >
                      Prioritize outreach for <span className="font-semibold">{key}</span> ({totalCases} cases).
                    </li>
                  ))
              )}
            </ul>
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">{copy.occupancy}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { hospital: "St. Paul", occupancy: 82 },
              { hospital: "Black Lion", occupancy: 91 },
              { hospital: "Adama General", occupancy: 67 },
              { hospital: "Jijiga Referral", occupancy: 74 },
            ].map((item) => (
              <div
                key={item.hospital}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold">{item.hospital}</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      item.occupancy > 85 ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                    style={{ width: `${item.occupancy}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {item.occupancy}% occupied
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </RoleGate>
  );
}
