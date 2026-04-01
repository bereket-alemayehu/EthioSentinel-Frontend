"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { RoleGate } from "@/components/role-gate";
import { addCaseReport } from "@/lib/reports";
import { getStoredRole } from "@/lib/auth";

type FormState = {
  location: string;
  disease: string;
  cases: number;
  deaths: number;
  notes: string;
};

const initialState: FormState = {
  location: "",
  disease: "Malaria",
  cases: 0,
  deaths: 0,
  notes: "",
};

export default function HewEntryPage() {
  const { language } = useLanguage();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }
    const cached = localStorage.getItem("hew-form-draft");
    return cached ? (JSON.parse(cached) as FormState) : initialState;
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("hew-form-draft", JSON.stringify(form));
  }, [form]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const role = getStoredRole();
    addCaseReport({
      location: form.location,
      disease: form.disease as "Malaria" | "Cholera" | "Measles" | "Dengue",
      cases: form.cases,
      deaths: form.deaths,
      notes: form.notes,
      submittedByRole: role === "admin" ? "admin" : "hew",
    });
    setForm(initialState);
    localStorage.removeItem("hew-form-draft");
    setMessage("Report submitted successfully.");
  };

  const copy = {
    en: {
      title: "HEW Data Entry Form",
      subtitle: "High-contrast rapid reporting for Health Extension Workers",
      saveHint: "Autosaved locally",
      connectivity: online ? "Online" : "Offline - local save active",
      location: "Location",
      disease: "Disease",
      cases: "Cases",
      deaths: "Deaths",
      notes: "Field Notes",
      submit: "Submit Report",
      success: message,
    },
    am: {
      title: "የጤና ሰራተኛ መመዝገቢያ",
      subtitle: "ለፈጣን ሪፖርት ከፍተኛ ኮንትራስት ቅጽ",
      saveHint: "በአካባቢ ተቀምጧል",
      connectivity: online ? "መስመር ላይ" : "ከመስመር ውጪ - አካባቢያዊ ማስቀመጥ ነቅቷል",
      location: "ቦታ",
      disease: "በሽታ",
      cases: "ኬዞች",
      deaths: "ሞት",
      notes: "ማስታወሻ",
      submit: "ሪፖርት አስገባ",
      success: message,
    },
    om: {
      title: "Galmee Hojjettuu Fayyaa",
      subtitle: "Unka ifa addaa qabu gabaasa saffisaaf",
      saveHint: "Naannotti kuufameera",
      connectivity: online
        ? "Toora irratti"
        : "Toora ala - kuusaan naannoo hojjechaa jira",
      location: "Naannoo",
      disease: "Dhukkuba",
      cases: "Lakkoofsa Dhukkubsattootaa",
      deaths: "Du'a",
      notes: "Yaadannoo",
      submit: "Gabaasa Ergi",
      success: message,
    },
  }[language];

  return (
    <RoleGate allowedRoles={["hew", "admin"]}>
      <section className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">{copy.subtitle}</p>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-white">
          {copy.connectivity}
        </span>
        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">
          {copy.saveHint}
        </span>
      </div>
      {copy.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {copy.success}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">{copy.location}</span>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">{copy.disease}</span>
            <select
              value={form.disease}
              onChange={(e) => setForm({ ...form, disease: e.target.value })}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
            >
              <option>Malaria</option>
              <option>Cholera</option>
              <option>Measles</option>
              <option>Dengue</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">{copy.cases}</span>
            <input
              type="number"
              min={0}
              value={form.cases}
              onChange={(e) =>
                setForm({ ...form, cases: Number(e.target.value) })
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">{copy.deaths}</span>
            <input
              type="number"
              min={0}
              value={form.deaths}
              onChange={(e) =>
                setForm({ ...form, deaths: Number(e.target.value) })
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">{copy.notes}</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {copy.submit}
        </button>
      </form>
      </section>
    </RoleGate>
  );
}
