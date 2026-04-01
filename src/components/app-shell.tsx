"use client";

import { GlobalNav } from "@/components/global-nav";
import { LanguageProvider } from "@/components/language-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 text-slate-900">
        <GlobalNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
