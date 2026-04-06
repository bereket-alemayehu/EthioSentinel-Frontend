import { Navbar } from "@/components/Nav/Navbar";
import { Chatbot } from "@/components/Chat/Chatbot";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}
