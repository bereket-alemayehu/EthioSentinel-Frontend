"use client";

import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { languages, text } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  clearStoredRole,
  getStoredRole,
  privilegedRoles,
  type UserRole,
} from "@/lib/auth";

const navItems = [
  { href: "/citizen", key: "navCitizen" },
  { href: "/hew", key: "navHew" },
  { href: "/admin", key: "navAdmin" },
] as const;

export function GlobalNav() {
  const { pathname } = useLocation();
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
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight text-foreground font-heading">
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
                  to={item.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                    isActive
                      ? "bg-primary-500 text-primary-foreground"
                      : "bg-light-800 text-light-500 hover:bg-light-700"
                  }`}
                >
                  {t[item.key]}
                </Link>
              );
            })}

            <Link
              to="/login"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                pathname.startsWith("/login")
                  ? "bg-primary-500 text-primary-foreground"
                  : "bg-light-800 text-light-500 hover:bg-light-700"
              }`}
            >
              Login
            </Link>
            {role ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-error-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-error-600 sm:text-sm"
              >
                Logout ({role})
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-2" aria-label={t.language}>
            <span className="text-xs font-semibold text-slate-600">
              {t.language}
            </span>
            <div className="flex overflow-hidden rounded-full border border-border">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`px-3 py-1.5 text-xs font-bold ${
                    language === item.code
                      ? "bg-primary-500 text-white"
                      : "bg-background text-foreground hover:bg-light-800"
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
