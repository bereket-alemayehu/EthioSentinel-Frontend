import { createStore, get, set } from "idb-keyval";

export type HewDraftReportInput = {
  diseaseType: string;
  cases: number;
  deaths: number;
  date: string;
  district: string;
};

export type HewQueuedReport = HewDraftReportInput & {
  id: string;
  createdAt: string;
  status: "pending" | "synced" | "failed";
  lastError?: string;
  syncedAt?: string;
};

export type HewSyncResult = {
  attempted: number;
  synced: number;
  failed: number;
};

const store = createStore("ethiosentinel-pwa", "hew-offline-reports");
const QUEUE_KEY = "queue";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

async function readQueue(): Promise<HewQueuedReport[]> {
  const queue = await get<HewQueuedReport[]>(QUEUE_KEY, store);
  return Array.isArray(queue) ? queue : [];
}

async function writeQueue(queue: HewQueuedReport[]) {
  await set(QUEUE_KEY, queue, store);
}

export async function queueHewReport(input: HewDraftReportInput) {
  const current = await readQueue();
  const next: HewQueuedReport = {
    id: makeId(),
    diseaseType: input.diseaseType,
    district: input.district,
    cases: input.cases,
    deaths: input.deaths,
    date: input.date,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await writeQueue([next, ...current]);
  return next;
}

export async function getAllQueuedHewReports() {
  return readQueue();
}

export async function syncQueuedHewReports(
  syncFn: (report: HewQueuedReport) => Promise<void>,
): Promise<HewSyncResult> {
  const queue = await readQueue();

  let attempted = 0;
  let synced = 0;
  let failed = 0;

  const updatedQueue: HewQueuedReport[] = [];

  for (const report of queue) {
    if (report.status === "synced") {
      updatedQueue.push(report);
      continue;
    }

    attempted += 1;

    try {
      await syncFn(report);
      synced += 1;
      updatedQueue.push({
        ...report,
        status: "synced",
        lastError: undefined,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      failed += 1;
      updatedQueue.push({
        ...report,
        status: "failed",
        lastError: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }

  await writeQueue(updatedQueue);

  return {
    attempted,
    synced,
    failed,
  };
}
