"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { setStoredRole, UserRole } from "@/lib/auth";

type LoginRole = Extract<UserRole, "hew" | "admin">;
const credentials: Record<LoginRole, { username: string; password: string }> = {
  admin: { username: "admin", password: "admin123" },
  hew: { username: "hew", password: "hew123" },
};

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<LoginRole>("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next");
  const safeNextPath =
    nextPath && nextPath.startsWith("/") ? nextPath : role === "admin" ? "/admin" : "/hew";

  const copy = useMemo(
    () => ({
      en: {
        role: "Role",
        admin: "Admin",
        hew: "Health Extension Worker",
        signIn: "Continue",
        username: "Username",
        password: "Password",
        invalid: "Invalid credentials for selected role.",
      },
      am: {
        role: "ሚና",
        admin: "አስተዳዳሪ",
        hew: "የጤና ሰራተኛ",
        signIn: "ቀጥል",
        username: "የተጠቃሚ ስም",
        password: "የይለፍ ቃል",
        invalid: "ለተመረጠው ሚና የማይሰራ መረጃ ነው።",
      },
      om: {
        role: "Gahee",
        admin: "Bulchaa",
        hew: "Hojjettuu Fayyaa",
        signIn: "Itti Fufi",
        username: "Maqaa Fayyadamaa",
        password: "Jecha Darbii",
        invalid: "Ragaa gahee filatameef sirrii miti.",
      },
    }),
    [],
  )[language];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expected = credentials[role];
    if (username !== expected.username || password !== expected.password) {
      setError(copy.invalid);
      return;
    }
    setError("");
    setStoredRole(role);
    router.replace(safeNextPath);
  };

  return (
    <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex justify-center">
        <Image src="/globe.svg" alt="EthioSentinel logo" width={52} height={52} />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">{copy.role}</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as LoginRole)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
          >
            <option value="admin">{copy.admin}</option>
            <option value="hew">{copy.hew}</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">{copy.username}</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">{copy.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
          />
        </label>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700"
        >
          {copy.signIn}
        </button>
      </form>
    </section>
  );
}
