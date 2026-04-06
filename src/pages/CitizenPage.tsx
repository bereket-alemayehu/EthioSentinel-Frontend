import { AppShell } from "@/components/Nav/AppShell";

export default function CitizenPage() {
  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">Citizen Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to the EthioHealth Sentinel citizen portal.</p>
      </div>
    </AppShell>
  );
}
