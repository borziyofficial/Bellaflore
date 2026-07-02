// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Environment readiness engine
// ==================================================
import {
  calculateCategoryReadiness,
  getEnvironmentChecklist,
  listChecklistByCategory,
} from "@/components/productionReadiness/productionChecklist";
import type { CategoryReadinessSummary } from "@/components/productionReadiness/productionTypes";

export function assessEnvironmentReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("environment");
}

export function listEnvironmentChecklistItems() {
  return getEnvironmentChecklist();
}

export function isEnvironmentReady(): boolean {
  return assessEnvironmentReadiness().isReady;
}

export function buildEnvironmentReadinessReport() {
  const summary = assessEnvironmentReadiness();
  const items = listEnvironmentChecklistItems();

  return {
    summary,
    items,
    pendingItems: items.filter((i) => i.status === "pending"),
    failedItems: items.filter((i) => i.status === "failed"),
    isReady: summary.isReady,
    generatedAt: new Date().toISOString(),
  };
}

export function listEnvironmentBlockers(): string[] {
  return listChecklistByCategory("environment")
    .filter((i) => i.status === "failed" || (i.priority === "critical" && i.status === "pending"))
    .map((i) => i.title);
}
