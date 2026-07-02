// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Inventory health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiInventorySnapshot } from "@/components/aiBrain/aiInventoryBridge";
import { calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { resolveAnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";

function buildResult(
  checkId: string,
  passed: boolean,
  severity: HealthCheckResult["severity"],
  status: HealthCheckResult["status"],
  message: string,
  metadata: Record<string, unknown> = {},
): HealthCheckResult {
  return {
    checkId,
    moduleId: "inventoryIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthInventorySnapshot() {
  return readAiInventorySnapshot();
}

export function runHealthInventoryChecks(): HealthCheckResult[] {
  const snapshot = readAiInventorySnapshot();
  const metrics = calculateInventoryAnalyticsMetrics(resolveAnalyticsTimeRange("today"));

  const outOfStock = snapshot.outOfStockItemIds.length;
  const lowStock = snapshot.summary.lowStockItems;
  const risk = metrics.stockRiskLevel;

  return [
    buildResult(
      "inventory_out_of_stock",
      outOfStock === 0,
      outOfStock > 0 ? "critical" : "info",
      outOfStock > 0 ? "critical" : "healthy",
      outOfStock > 0 ? `Out of stock: ${outOfStock}` : "Out of stock нет",
      { itemIds: snapshot.outOfStockItemIds },
    ),
    buildResult(
      "inventory_low_stock",
      lowStock === 0,
      lowStock >= 3 ? "high" : lowStock > 0 ? "medium" : "info",
      lowStock > 0 ? "warning" : "healthy",
      lowStock > 0 ? `Low stock: ${lowStock}` : "Low stock нет",
      { count: lowStock },
    ),
    buildResult(
      "inventory_risk",
      risk === "low" || risk === "medium",
      risk === "critical" ? "critical" : risk === "high" ? "high" : "info",
      risk === "critical" ? "critical" : risk === "high" ? "degraded" : "healthy",
      `Inventory risk: ${risk}`,
      { stockRiskLevel: risk },
    ),
  ];
}

export function detectHealthInventoryIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "inventoryIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "inventory_item",
      resourceId: null,
    }));
}
