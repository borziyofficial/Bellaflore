// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Synchronization & retry engine
// ==================================================
import { buildIntegrationExampleRegistryState } from "@/components/integrationIntelligence/integrationExamples";
import type {
  BridgeKind,
  RetryQueueEntry,
  RetryQueueStatus,
  SyncQueueEntry,
  SyncQueueStatus,
} from "@/components/integrationIntelligence/integrationTypes";

export const INTEGRATION_SYNC_QUEUE_STORAGE_KEY =
  "bellaflore_integration_intelligence_sync_queue_v1";

export const INTEGRATION_RETRY_QUEUE_STORAGE_KEY =
  "bellaflore_integration_intelligence_retry_queue_v1";

let inMemorySyncQueue: SyncQueueEntry[] | null = null;
let inMemoryRetryQueue: RetryQueueEntry[] | null = null;

function readSyncQueueFromStorage(): SyncQueueEntry[] {
  if (typeof window === "undefined") {
    return inMemorySyncQueue ?? buildIntegrationExampleRegistryState().syncQueue;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_SYNC_QUEUE_STORAGE_KEY);
    if (!raw) {
      return inMemorySyncQueue ?? buildIntegrationExampleRegistryState().syncQueue;
    }

    const parsed = JSON.parse(raw) as SyncQueueEntry[];
    return Array.isArray(parsed) ? parsed : buildIntegrationExampleRegistryState().syncQueue;
  } catch {
    return inMemorySyncQueue ?? buildIntegrationExampleRegistryState().syncQueue;
  }
}

function writeSyncQueueToStorage(entries: SyncQueueEntry[]): void {
  inMemorySyncQueue = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_SYNC_QUEUE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readRetryQueueFromStorage(): RetryQueueEntry[] {
  if (typeof window === "undefined") {
    return inMemoryRetryQueue ?? buildIntegrationExampleRegistryState().retryQueue;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_RETRY_QUEUE_STORAGE_KEY);
    if (!raw) {
      return inMemoryRetryQueue ?? buildIntegrationExampleRegistryState().retryQueue;
    }

    const parsed = JSON.parse(raw) as RetryQueueEntry[];
    return Array.isArray(parsed) ? parsed : buildIntegrationExampleRegistryState().retryQueue;
  } catch {
    return inMemoryRetryQueue ?? buildIntegrationExampleRegistryState().retryQueue;
  }
}

function writeRetryQueueToStorage(entries: RetryQueueEntry[]): void {
  inMemoryRetryQueue = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_RETRY_QUEUE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listSyncQueue(status?: SyncQueueStatus): SyncQueueEntry[] {
  const entries = readSyncQueueFromStorage();

  return (status ? entries.filter((e) => e.status === status) : entries).sort(
    (a, b) => a.priority - b.priority,
  );
}

export function getSyncQueueEntryById(id: string): SyncQueueEntry | null {
  return readSyncQueueFromStorage().find((e) => e.id === id) ?? null;
}

export function listSyncQueueByBridge(bridgeId: string): SyncQueueEntry[] {
  return readSyncQueueFromStorage().filter((e) => e.bridgeId === bridgeId);
}

export function listSyncQueueByKind(kind: BridgeKind): SyncQueueEntry[] {
  return readSyncQueueFromStorage().filter((e) => e.bridgeKind === kind);
}

export function listPendingSyncQueue(): SyncQueueEntry[] {
  return listSyncQueue("pending");
}

export function listFailedSyncQueue(): SyncQueueEntry[] {
  return listSyncQueue("failed");
}

export function listRetryQueue(status?: RetryQueueStatus): RetryQueueEntry[] {
  const entries = readRetryQueueFromStorage();

  return (status ? entries.filter((e) => e.status === status) : entries).sort(
    (a, b) => new Date(a.nextRetryAt).getTime() - new Date(b.nextRetryAt).getTime(),
  );
}

export function getRetryQueueEntryById(id: string): RetryQueueEntry | null {
  return readRetryQueueFromStorage().find((e) => e.id === id) ?? null;
}

export function listRetryQueueBySyncId(syncQueueId: string): RetryQueueEntry[] {
  return readRetryQueueFromStorage().filter((e) => e.syncQueueId === syncQueueId);
}

export function listPendingRetryQueue(): RetryQueueEntry[] {
  return listRetryQueue("pending");
}

export function listScheduledRetryQueue(): RetryQueueEntry[] {
  return listRetryQueue("scheduled");
}

export function registerSyncQueueEntry(entry: SyncQueueEntry): SyncQueueEntry {
  const entries = readSyncQueueFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeSyncQueueToStorage(next);
  return entry;
}

export function registerRetryQueueEntry(entry: RetryQueueEntry): RetryQueueEntry {
  const entries = readRetryQueueFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeRetryQueueToStorage(next);
  return entry;
}

export function seedSyncEngine(): SyncQueueEntry[] {
  const seed = buildIntegrationExampleRegistryState();
  writeSyncQueueToStorage(seed.syncQueue);
  writeRetryQueueToStorage(seed.retryQueue);
  return listSyncQueue();
}

export function clearSyncEngine(): void {
  writeSyncQueueToStorage([]);
  writeRetryQueueToStorage([]);
}

export function buildSyncQueueSummary() {
  const pending = listPendingSyncQueue();
  const failed = listFailedSyncQueue();
  const retryPending = listPendingRetryQueue();

  return {
    total: listSyncQueue().length,
    pending: pending.length,
    failed: failed.length,
    retryPending: retryPending.length,
    nextPending: pending[0] ?? null,
    generatedAt: new Date().toISOString(),
  };
}

export function estimateNextRetryDelay(attempt: number): number {
  const baseMs = 1000;
  return Math.min(baseMs * 2 ** attempt, 60000);
}
