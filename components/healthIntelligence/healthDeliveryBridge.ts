// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Delivery health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiDeliverySnapshot } from "@/components/aiBrain/aiDeliveryBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { resolveAnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";

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
    moduleId: "deliveryIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthDeliverySnapshot() {
  return readAiDeliverySnapshot();
}

export function runHealthDeliveryChecks(): HealthCheckResult[] {
  const snapshot = readAiDeliverySnapshot();
  const metrics = calculateDeliveryAnalyticsMetrics(resolveAnalyticsTimeRange("today"));
  const failed = listDeliveryTasks().filter((task) => task.status === "failed").length;
  const delayed = snapshot.delayedTaskIds.length;
  const delayRisk = metrics.deliveryDelayRisk;

  return [
    buildResult(
      "delivery_delayed",
      delayed === 0,
      delayed >= 2 ? "high" : delayed > 0 ? "medium" : "info",
      delayed > 0 ? "warning" : "healthy",
      delayed > 0 ? `Delayed deliveries: ${delayed}` : "Delayed deliveries нет",
      { taskIds: snapshot.delayedTaskIds },
    ),
    buildResult(
      "delivery_high_delay_risk",
      delayRisk < 20,
      delayRisk >= 40 ? "critical" : delayRisk >= 20 ? "high" : "info",
      delayRisk >= 20 ? "warning" : "healthy",
      `Delivery delay risk: ${delayRisk}%`,
      { delayRisk },
    ),
    buildResult(
      "delivery_failed",
      failed === 0,
      failed > 0 ? "critical" : "info",
      failed > 0 ? "critical" : "healthy",
      failed > 0 ? `Failed deliveries: ${failed}` : "Failed deliveries нет",
      { failedCount: failed },
    ),
  ];
}

export function detectHealthDeliveryIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "deliveryIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "delivery_task",
      resourceId: null,
    }));
}
