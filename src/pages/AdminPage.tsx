import { useEffect, useState } from "react";

type AlertItem = {
  id: number;
  disease: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  advisory: string;
  status: "Draft" | "Approved";
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

function severityBadgeClass(level: AlertItem["severity"]) {
  if (level === "CRITICAL" || level === "HIGH")
    return "bg-red-100 text-red-700";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AdminPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch alerts");
      }

      const json = (await response.json()) as { data?: AlertItem[] };
      setAlerts(Array.isArray(json.data) ? json.data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load alerts",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const updateAlertStatus = async (
    id: number,
    action: "approve" | "reject",
  ) => {
    setActionLoadingId(id);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/alerts/${id}/${action}`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to ${action} alert`);
      }

      await loadAlerts();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Unable to ${action} alert`,
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Admin Alert Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review and manage alert approvals.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card text-card-foreground overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Disease</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Advisory</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    No alerts found.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="border-t align-top">
                    <td className="px-4 py-3">{alert.disease ?? "Unknown"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityBadgeClass(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xl">
                      <p className="line-clamp-4 text-muted-foreground">
                        {alert.advisory}
                      </p>
                    </td>
                    <td className="px-4 py-3">{alert.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void updateAlertStatus(alert.id, "approve")
                          }
                          disabled={actionLoadingId === alert.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void updateAlertStatus(alert.id, "reject")
                          }
                          disabled={actionLoadingId === alert.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
