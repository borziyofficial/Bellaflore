// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Supplier history & analytics
// ==================================================
import { buildSupplierExampleRegistryState } from "@/components/supplierIntelligence/supplierExamples";
import type {
  SupplierAiPreparation,
  SupplierAnalyticsMetric,
  SupplierHistoryEntry,
} from "@/components/supplierIntelligence/supplierTypes";

export const SUPPLIER_HISTORY_STORAGE_KEY =
  "bellaflore_supplier_intelligence_history_v1";

export const SUPPLIER_ANALYTICS_STORAGE_KEY =
  "bellaflore_supplier_intelligence_analytics_v1";

export const SUPPLIER_AI_STORAGE_KEY =
  "bellaflore_supplier_intelligence_ai_v1";

let inMemoryHistory: SupplierHistoryEntry[] | null = null;
let inMemoryAnalytics: SupplierAnalyticsMetric[] | null = null;
let inMemoryAi: SupplierAiPreparation[] | null = null;

function readHistoryFromStorage(): SupplierHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryHistory ?? buildSupplierExampleRegistryState().history;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryHistory ?? buildSupplierExampleRegistryState().history;
    }

    const parsed = JSON.parse(raw) as SupplierHistoryEntry[];
    return Array.isArray(parsed) ? parsed : buildSupplierExampleRegistryState().history;
  } catch {
    return inMemoryHistory ?? buildSupplierExampleRegistryState().history;
  }
}

function writeHistoryToStorage(entries: SupplierHistoryEntry[]): void {
  inMemoryHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAnalyticsFromStorage(): SupplierAnalyticsMetric[] {
  if (typeof window === "undefined") {
    return inMemoryAnalytics ?? buildSupplierExampleRegistryState().analytics;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return inMemoryAnalytics ?? buildSupplierExampleRegistryState().analytics;
    }

    const parsed = JSON.parse(raw) as SupplierAnalyticsMetric[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().analytics;
  } catch {
    return inMemoryAnalytics ?? buildSupplierExampleRegistryState().analytics;
  }
}

function writeAnalyticsToStorage(metrics: SupplierAnalyticsMetric[]): void {
  inMemoryAnalytics = metrics;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_ANALYTICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): SupplierAiPreparation[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildSupplierExampleRegistryState().aiPreparations;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildSupplierExampleRegistryState().aiPreparations;
    }

    const parsed = JSON.parse(raw) as SupplierAiPreparation[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().aiPreparations;
  } catch {
    return inMemoryAi ?? buildSupplierExampleRegistryState().aiPreparations;
  }
}

function writeAiToStorage(preparations: SupplierAiPreparation[]): void {
  inMemoryAi = preparations;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_AI_STORAGE_KEY, JSON.stringify(preparations));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listSupplierHistory(supplierId?: string): SupplierHistoryEntry[] {
  const entries = readHistoryFromStorage();

  return (supplierId ? entries.filter((e) => e.supplierId === supplierId) : entries).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function listSupplierAnalytics(supplierId?: string): SupplierAnalyticsMetric[] {
  return readAnalyticsFromStorage().filter((m) =>
    supplierId ? m.supplierId === supplierId : true,
  );
}

export function getSupplierAnalyticsById(
  supplierId: string,
): SupplierAnalyticsMetric | null {
  return readAnalyticsFromStorage().find((m) => m.supplierId === supplierId) ?? null;
}

export function listAiSupplierPreparations(): SupplierAiPreparation[] {
  return readAiFromStorage();
}

export function getAiSupplierPreparationById(id: string): SupplierAiPreparation | null {
  return readAiFromStorage().find((p) => p.id === id) ?? null;
}

export function registerSupplierHistoryEntry(
  entry: SupplierHistoryEntry,
): SupplierHistoryEntry {
  writeHistoryToStorage([entry, ...readHistoryFromStorage()]);
  return entry;
}

export function registerSupplierAnalytics(
  metric: SupplierAnalyticsMetric,
): SupplierAnalyticsMetric {
  const metrics = readAnalyticsFromStorage();
  const index = metrics.findIndex((m) => m.supplierId === metric.supplierId);
  const next =
    index === -1
      ? [...metrics, metric]
      : metrics.map((m, i) => (i === index ? metric : m));

  writeAnalyticsToStorage(next);
  return metric;
}

export function registerAiSupplierPreparation(
  preparation: SupplierAiPreparation,
): SupplierAiPreparation {
  const items = readAiFromStorage();
  const index = items.findIndex((p) => p.id === preparation.id);
  const next =
    index === -1
      ? [...items, preparation]
      : items.map((p, i) => (i === index ? preparation : p));

  writeAiToStorage(next);
  return preparation;
}

export function seedSupplierHistoryRegistry(): SupplierHistoryEntry[] {
  const seed = buildSupplierExampleRegistryState();
  writeHistoryToStorage(seed.history);
  writeAnalyticsToStorage(seed.analytics);
  writeAiToStorage(seed.aiPreparations);
  return listSupplierHistory();
}

export function clearSupplierHistoryRegistry(): void {
  writeHistoryToStorage([]);
  writeAnalyticsToStorage([]);
  writeAiToStorage([]);
}

export function buildSupplierAnalyticsSummary(supplierId: string) {
  const analytics = getSupplierAnalyticsById(supplierId);
  const history = listSupplierHistory(supplierId);

  return {
    supplierId,
    analytics,
    recentHistory: history.slice(0, 5),
    totalHistoryEntries: history.length,
    generatedAt: new Date().toISOString(),
  };
}
