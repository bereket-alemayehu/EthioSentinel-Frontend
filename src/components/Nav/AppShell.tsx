import { Navbar } from "@/components/Nav/Navbar";
import { Chatbot } from "@/features/advisory/components/Chatbot";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="w-full">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}
