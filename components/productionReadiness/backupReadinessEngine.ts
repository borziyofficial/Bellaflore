// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Backup readiness engine
// ==================================================
import {
  calculateCategoryReadiness,
  getBackupChecklist,
  listChecklistByCategory,
} from "@/components/productionReadiness/productionChecklist";
import type { CategoryReadinessSummary } from "@/components/productionReadiness/productionTypes";

export function assessBackupReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("backup");
}

export function listBackupChecklistItems() {
  return getBackupChecklist();
}

export function isBackupReady(): boolean {
  return assessBackupReadiness().isReady;
}

export function buildBackupReadinessReport() {
  const summary = assessBackupReadiness();
  const items = listBackupChecklistItems();

  return {
    summary,
    items,
    scheduleConfigured: items.some(
      (i) => i.id === "backup-001" && i.status === "passed",
    ),
    restoreTested: items.some(
      (i) => i.id === "backup-002" && i.status === "passed",
    ),
    isReady: summary.isReady,
    generatedAt: new Date().toISOString(),
  };
}

export function listBackupBlockers(): string[] {
  return listChecklistByCategory("backup")
    .filter((i) => i.status === "failed" || (i.priority === "critical" && i.status === "pending"))
    .map((i) => i.title);
}
