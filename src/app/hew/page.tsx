"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

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
    alert("Case report queued for sync.");
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
    },
  }[language];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{copy.title}</h1>
      <p className="text-sm text-slate-700 sm:text-base">{copy.subtitle}</p>

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">
          {copy.connectivity}
        </span>
        <span className="rounded-full bg-yellow-300 px-3 py-1.5 text-slate-900">
          {copy.saveHint}
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl bg-black p-4 text-white ring-2 ring-yellow-300 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-bold">{copy.location}</span>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="h-12 w-full rounded-lg border-2 border-white bg-white px-3 text-base font-semibold text-black"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-bold">{copy.disease}</span>
            <select
              value={form.disease}
              onChange={(e) => setForm({ ...form, disease: e.target.value })}
              className="h-12 w-full rounded-lg border-2 border-white bg-white px-3 text-base font-semibold text-black"
            >
              <option>Malaria</option>
              <option>Cholera</option>
              <option>Measles</option>
              <option>Dengue</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-bold">{copy.cases}</span>
            <input
              type="number"
              min={0}
              value={form.cases}
              onChange={(e) =>
                setForm({ ...form, cases: Number(e.target.value) })
              }
              className="h-12 w-full rounded-lg border-2 border-white bg-white px-3 text-xl font-extrabold text-black"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-bold">{copy.deaths}</span>
            <input
              type="number"
              min={0}
              value={form.deaths}
              onChange={(e) =>
                setForm({ ...form, deaths: Number(e.target.value) })
              }
              className="h-12 w-full rounded-lg border-2 border-white bg-white px-3 text-xl font-extrabold text-black"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-bold">{copy.notes}</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border-2 border-white bg-white p-3 text-base font-semibold text-black"
          />
        </label>

        <button
          type="submit"
          className="h-14 w-full rounded-xl bg-yellow-300 text-lg font-extrabold text-black hover:bg-yellow-200"
        >
          {copy.submit}
        </button>
      </form>
    </section>
  );
}
