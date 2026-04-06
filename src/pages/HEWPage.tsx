import { AppShell } from "@/components/Nav/AppShell";

export default function HEWPage() {
  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">HEW Data Entry</h1>
        <p className="mt-2 text-muted-foreground">Health Extension Worker portal for data entry and monitoring.</p>
      </div>
    </AppShell>
  );
}
