// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Checklist registry
// ==================================================
import { buildProductionExampleRegistryState } from "@/components/productionReadiness/productionExamples";
import type {
  CategoryReadinessSummary,
  ChecklistCategory,
  ChecklistItem,
  ChecklistItemPriority,
  ChecklistItemStatus,
  ChecklistListFilters,
} from "@/components/productionReadiness/productionTypes";

export const PRODUCTION_CHECKLIST_STORAGE_KEY =
  "bellaflore_production_readiness_checklist_v1";

const ALL_CATEGORIES: ChecklistCategory[] = [
  "launch",
  "environment",
  "deployment",
  "backup",
  "security",
  "monitoring",
  "performance",
  "seo",
  "telegram",
  "payment",
  "admin",
];

let inMemoryChecklists: ChecklistItem[] | null = null;

function readChecklistsFromStorage(): ChecklistItem[] {
  if (typeof window === "undefined") {
    return inMemoryChecklists ?? buildProductionExampleRegistryState().checklists;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTION_CHECKLIST_STORAGE_KEY);
    if (!raw) {
      return inMemoryChecklists ?? buildProductionExampleRegistryState().checklists;
    }

    const parsed = JSON.parse(raw) as ChecklistItem[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildProductionExampleRegistryState().checklists;
  } catch {
    return inMemoryChecklists ?? buildProductionExampleRegistryState().checklists;
  }
}

function writeChecklistsToStorage(items: ChecklistItem[]): void {
  inMemoryChecklists = items;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTION_CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesChecklistFilters(item: ChecklistItem, filters: ChecklistListFilters): boolean {
  if (filters.category && item.category !== filters.category) {
    return false;
  }

  if (filters.status && item.status !== filters.status) {
    return false;
  }

  if (filters.priority && item.priority !== filters.priority) {
    return false;
  }

  return true;
}

export function listChecklistItems(filters: ChecklistListFilters = {}): ChecklistItem[] {
  return readChecklistsFromStorage()
    .filter((item) => matchesChecklistFilters(item, filters))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function getChecklistItemById(id: string): ChecklistItem | null {
  return readChecklistsFromStorage().find((item) => item.id === id) ?? null;
}

export function listChecklistByCategory(category: ChecklistCategory): ChecklistItem[] {
  return listChecklistItems({ category });
}

export function listPassedChecklistItems(): ChecklistItem[] {
  return listChecklistItems({ status: "passed" });
}

export function listFailedChecklistItems(): ChecklistItem[] {
  return listChecklistItems({ status: "failed" });
}

export function listPendingChecklistItems(): ChecklistItem[] {
  return listChecklistItems({ status: "pending" });
}

export function listCriticalChecklistItems(): ChecklistItem[] {
  return listChecklistItems({ priority: "critical" });
}

export function listPendingCriticalItems(): ChecklistItem[] {
  return readChecklistsFromStorage().filter(
    (item) => item.priority === "critical" && item.status === "pending",
  );
}

export function listFailedCriticalItems(): ChecklistItem[] {
  return readChecklistsFromStorage().filter(
    (item) => item.priority === "critical" && item.status === "failed",
  );
}

export function calculateCategoryReadiness(category: ChecklistCategory): CategoryReadinessSummary {
  const items = listChecklistByCategory(category);
  const passed = items.filter((i) => i.status === "passed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const applicable = items.filter((i) => i.status !== "not_applicable").length;

  const readinessPercent =
    applicable > 0 ? Math.round((passed / applicable) * 1000) / 10 : 0;

  return {
    category,
    totalItems: items.length,
    passedItems: passed,
    failedItems: failed,
    pendingItems: pending,
    readinessPercent,
    isReady: failed === 0 && pending === 0 && passed > 0,
  };
}

export function listAllCategorySummaries(): CategoryReadinessSummary[] {
  return ALL_CATEGORIES.map((category) => calculateCategoryReadiness(category));
}

export function calculateOverallReadinessPercent(): number {
  const items = readChecklistsFromStorage().filter((i) => i.status !== "not_applicable");
  if (items.length === 0) {
    return 0;
  }

  const passed = items.filter((i) => i.status === "passed").length;
  return Math.round((passed / items.length) * 1000) / 10;
}

export function registerChecklistItem(item: ChecklistItem): ChecklistItem {
  const items = readChecklistsFromStorage();
  const index = items.findIndex((i) => i.id === item.id);
  const next =
    index === -1
      ? [...items, item]
      : items.map((i, idx) => (idx === index ? item : i));

  writeChecklistsToStorage(next);
  return item;
}

export function updateChecklistItemStatus(
  id: string,
  status: ChecklistItemStatus,
): ChecklistItem | null {
  const item = getChecklistItemById(id);
  if (!item) {
    return null;
  }

  return registerChecklistItem({
    ...item,
    status,
    completedAt: status === "passed" ? new Date().toISOString() : item.completedAt,
    updatedAt: new Date().toISOString(),
  });
}

export function seedProductionChecklist(): ChecklistItem[] {
  writeChecklistsToStorage(buildProductionExampleRegistryState().checklists);
  return listChecklistItems();
}

export function clearProductionChecklist(): void {
  writeChecklistsToStorage([]);
}

export function getLaunchChecklist(): ChecklistItem[] {
  return listChecklistByCategory("launch");
}

export function getEnvironmentChecklist(): ChecklistItem[] {
  return listChecklistByCategory("environment");
}

export function getDeploymentChecklist(): ChecklistItem[] {
  return listChecklistByCategory("deployment");
}

export function getBackupChecklist(): ChecklistItem[] {
  return listChecklistByCategory("backup");
}

export function getSecurityChecklist(): ChecklistItem[] {
  return listChecklistByCategory("security");
}

export function getMonitoringChecklist(): ChecklistItem[] {
  return listChecklistByCategory("monitoring");
}

export function getPerformanceChecklist(): ChecklistItem[] {
  return listChecklistByCategory("performance");
}

export function getSeoChecklist(): ChecklistItem[] {
  return listChecklistByCategory("seo");
}

export function getTelegramChecklist(): ChecklistItem[] {
  return listChecklistByCategory("telegram");
}

export function getPaymentChecklist(): ChecklistItem[] {
  return listChecklistByCategory("payment");
}

export function getAdminChecklist(): ChecklistItem[] {
  return listChecklistByCategory("admin");
}

export function listChecklistCategories(): ChecklistCategory[] {
  return [...ALL_CATEGORIES];
}

export function countChecklistByPriority(priority: ChecklistItemPriority): number {
  return listChecklistItems({ priority }).length;
}
