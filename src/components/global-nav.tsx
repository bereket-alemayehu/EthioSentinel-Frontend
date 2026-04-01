"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languages, text } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

const navItems = [
  { href: "/citizen", key: "navCitizen" },
  { href: "/hew", key: "navHew" },
  { href: "/admin", key: "navAdmin" },
] as const;

export function GlobalNav() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const t = text[language];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900 sm:text-lg">
            {t.appName}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-xs font-semibold sm:text-sm ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t[item.key]}
                </Link>
              );
            })}
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
