"use client";

import { GlobalNav } from "@/components/global-nav";
import { LanguageProvider } from "@/components/language-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <GlobalNav />
        <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
