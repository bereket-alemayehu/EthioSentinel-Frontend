import { GlobalNav } from "@/components/Nav/GlobalNav";
import { LanguageProvider } from "@/providers/LanguageProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        <GlobalNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
