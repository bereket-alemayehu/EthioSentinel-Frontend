import { AppShell } from "@/components/Nav/AppShell";

export default function LoginPage() {
  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to access your dashboard.</p>
      </div>
    </AppShell>
  );
}
