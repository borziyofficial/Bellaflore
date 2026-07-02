// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Courier health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiCourierSnapshot } from "@/components/aiBrain/aiCourierBridge";

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
    moduleId: "courierIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthCourierSnapshot() {
  return readAiCourierSnapshot();
}

export function runHealthCourierChecks(): HealthCheckResult[] {
  const snapshot = readAiCourierSnapshot();
  const couriers = snapshot.summary.couriers;

  const overloaded = snapshot.overloadedCourierIds.length;
  const offline = couriers.filter((courier) => courier.status === "offline").length;
  const available = snapshot.availableCourierIds.length;

  return [
    buildResult(
      "courier_overloaded",
      overloaded === 0,
      overloaded > 0 ? "high" : "info",
      overloaded > 0 ? "degraded" : "healthy",
      overloaded > 0 ? `Overloaded couriers: ${overloaded}` : "Overloaded couriers нет",
      { courierIds: snapshot.overloadedCourierIds },
    ),
    buildResult(
      "courier_offline",
      offline === 0,
      offline >= 2 ? "medium" : offline > 0 ? "low" : "info",
      offline > 0 ? "warning" : "healthy",
      offline > 0 ? `Offline couriers: ${offline}` : "Offline couriers нет",
      { count: offline },
    ),
    buildResult(
      "courier_no_available",
      available > 0,
      available === 0 ? "critical" : "info",
      available === 0 ? "critical" : "healthy",
      available === 0 ? "Нет доступных курьеров" : `Available couriers: ${available}`,
      { availableCount: available },
    ),
  ];
}

export function detectHealthCourierIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "courierIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "courier",
      resourceId: null,
    }));
}
