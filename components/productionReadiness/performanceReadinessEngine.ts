// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Performance readiness engine
// ==================================================
import {
  calculateCategoryReadiness,
  getMonitoringChecklist,
  getPerformanceChecklist,
  getSeoChecklist,
  listChecklistByCategory,
} from "@/components/productionReadiness/productionChecklist";
import type { CategoryReadinessSummary } from "@/components/productionReadiness/productionTypes";

export function assessPerformanceReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("performance");
}

export function assessMonitoringReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("monitoring");
}

export function assessSeoReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("seo");
}

export function listPerformanceChecklistItems() {
  return getPerformanceChecklist();
}

export function listMonitoringChecklistItems() {
  return getMonitoringChecklist();
}

export function listSeoChecklistItems() {
  return getSeoChecklist();
}

export function isPerformanceReady(): boolean {
  return assessPerformanceReadiness().isReady;
}

export function isMonitoringReady(): boolean {
  return assessMonitoringReadiness().isReady;
}

export function isSeoReady(): boolean {
  return assessSeoReadiness().isReady;
}

export function buildPerformanceReadinessReport() {
  return {
    performance: assessPerformanceReadiness(),
    monitoring: assessMonitoringReadiness(),
    seo: assessSeoReadiness(),
    performanceItems: listPerformanceChecklistItems(),
    monitoringItems: listMonitoringChecklistItems(),
    seoItems: listSeoChecklistItems(),
    isReady:
      isPerformanceReady() && isMonitoringReady() && isSeoReady(),
    generatedAt: new Date().toISOString(),
  };
}

export function listPerformanceBlockers(): string[] {
  const categories = ["performance", "monitoring", "seo"] as const;

  return categories.flatMap((category) =>
    listChecklistByCategory(category)
      .filter(
        (i) => i.status === "failed" || (i.priority === "critical" && i.status === "pending"),
      )
      .map((i) => `[${category}] ${i.title}`),
  );
}
