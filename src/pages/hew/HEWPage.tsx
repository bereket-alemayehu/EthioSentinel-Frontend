
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getAllQueuedHewReports,
  queueHewReport,
  type HewDraftReportInput,
  type HewQueuedReport,
} from "@/features/reporting/lib/offlineHewReports";
import { useReportMutation, useSyncReportsMutation } from "@/features/reporting/hooks/useReporting";

export default function HEWPage() {
  const reportMutation = useReportMutation();
  const syncMutation = useSyncReportsMutation();
  const [form, setForm] = useState<HewDraftReportInput>({
    diseaseType: "",
    cases: 0,
    deaths: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<HewQueuedReport[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const isSyncing = syncMutation.isPending;

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status !== "synced").length,
    [queue],
  );

  async function refreshQueue() {
    const current = await getAllQueuedHewReports();
    setQueue(current);
  }

  async function syncNow() {
    if (!navigator.onLine) {
      setStatusMessage("Offline: data queued in IndexedDB");
      return;
    }

    try {
      const result = await syncMutation.mutateAsync();
      await refreshQueue();
      setStatusMessage(
        `Sync completed. attempted=${result.attempted}, synced=${result.synced}, failed=${result.failed}`,
      );
    } catch {
      setStatusMessage("Sync failed. Pending reports remain queued.");
    }
  }

  useEffect(() => {
    void refreshQueue();

    const onOnline = () => {
      setIsOnline(true);
      void syncNow();
    };

    const onOffline = () => {
      setIsOnline(false);
      setStatusMessage("You are offline. New reports will be queued locally.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.diseaseType.trim()) {
      setStatusMessage("Disease type is required.");
      return;
    }

    if (form.cases < 0 || form.deaths < 0) {
      setStatusMessage("Cases and deaths must be zero or positive.");
      return;
    }

    if (form.deaths > form.cases) {
      setStatusMessage("Deaths cannot be greater than cases.");
      return;
    }

    try {
      await reportMutation.mutateAsync({
        diseaseType: form.diseaseType.trim(),
        cases: form.cases,
        deaths: form.deaths,
        date: form.date,
      });
      setStatusMessage("Report successfully submitted.");
      setForm((prev) => ({
        ...prev,
        diseaseType: "",
        cases: 0,
        deaths: 0,
      }));
    } catch {
      await queueHewReport({
        diseaseType: form.diseaseType.trim(),
        cases: form.cases,
        deaths: form.deaths,
        date: form.date,
      });
      await refreshQueue();
      setStatusMessage("Failed to reach server. Report saved to offline queue.");
    }

    if (navigator.onLine && !reportMutation.isError) {
      await syncNow();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          HEW Data Entry (PWA)
        </h1>
        <p className="mt-2 text-muted-foreground">
          Offline-first disease reporting with IndexedDB queue and automatic
          sync.
        </p>
      </div>

      <div className="rounded-lg border p-4 bg-card text-card-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              isOnline
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="text-sm text-muted-foreground">
            Pending sync: {pendingCount}
          </span>
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={!isOnline || isSyncing}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
        {statusMessage ? (
          <p className="mt-3 text-sm text-muted-foreground">{statusMessage}</p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-lg border p-4 bg-card text-card-foreground space-y-4"
      >
        <h2 className="text-lg font-semibold">New Disease Report</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Disease type</span>
            <input
              type="text"
              required
              value={form.diseaseType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  diseaseType: event.target.value,
                }))
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
              placeholder="e.g. Malaria"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Date</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Cases</span>
            <input
              type="number"
              min={0}
              required
              value={form.cases}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  cases: Number(event.target.value),
                }))
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Deaths</span>
            <input
              type="number"
              min={0}
              required
              value={form.deaths}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  deaths: Number(event.target.value),
                }))
              }
              className="w-full rounded-md border px-3 py-2 bg-background"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Save report
        </button>
      </form>

      <div className="rounded-lg border p-4 bg-card text-card-foreground">
        <h2 className="text-lg font-semibold">Local Queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored in IndexedDB for offline support and background sync.
        </p>

        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Disease</th>
                <th className="py-2 pr-4">Cases</th>
                <th className="py-2 pr-4">Deaths</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{item.diseaseType}</td>
                  <td className="py-2 pr-4">{item.cases}</td>
                  <td className="py-2 pr-4">{item.deaths}</td>
                  <td className="py-2 pr-4">{item.date}</td>
                  <td className="py-2 pr-4">{item.status}</td>
                </tr>
              ))}
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    No local reports yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
