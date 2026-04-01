"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { languages, text } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import {
  clearStoredRole,
  getStoredRole,
  privilegedRoles,
  UserRole,
} from "@/lib/auth";

const navItems = [
  { href: "/citizen", key: "navCitizen" },
  { href: "/hew", key: "navHew" },
  { href: "/admin", key: "navAdmin" },
] as const;

export function GlobalNav() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const [role, setRole] = useState<UserRole | null>(null);
  const t = text[language];
  const isPrivileged = role ? privilegedRoles.includes(role) : false;

  useEffect(() => {
    setRole(getStoredRole());
  }, [pathname]);

  const onLogout = () => {
    clearStoredRole();
    setRole(null);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight text-slate-900">
            {t.appName}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              if ((item.href === "/hew" || item.href === "/admin") && !isPrivileged) {
                return null;
              }

              if (item.href === "/admin" && role !== "admin") {
                return null;
              }

              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t[item.key]}
                </Link>
              );
            })}

            <Link
              href="/login"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                pathname.startsWith("/login")
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Login
            </Link>
            {role ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 sm:text-sm"
              >
                Logout ({role})
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-2" aria-label={t.language}>
            <span className="text-xs font-semibold text-slate-600">
              {t.language}
            </span>
            <div className="flex overflow-hidden rounded-full border border-slate-300">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`px-3 py-1.5 text-xs font-bold ${
                    language === item.code
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
