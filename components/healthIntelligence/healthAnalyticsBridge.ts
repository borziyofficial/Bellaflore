// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Analytics health bridge (read-only)
// ==================================================
import type { HealthCheckResult } from "@/components/healthIntelligence/healthIntelligenceTypes";
import {
  collectAnalyticsSnapshot,
} from "@/components/analyticsIntelligence/analyticsIntelligenceEngine";
import { generateAllAnalyticsReports } from "@/components/analyticsIntelligence/analyticsReportEngine";
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
    moduleId: "analyticsIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthAnalyticsSnapshot() {
  const range = resolveAnalyticsTimeRange("today");
  const snapshot = collectAnalyticsSnapshot("today");
  const reports = generateAllAnalyticsReports(range);

  return {
    snapshot,
    reportCount: reports.length,
    generatedAt: new Date().toISOString(),
  };
}

export function runHealthAnalyticsChecks(): HealthCheckResult[] {
  const snapshot = collectAnalyticsSnapshot("today");
  const reports = generateAllAnalyticsReports(snapshot.timeRange);

  return [
    buildResult(
      "analytics_snapshot_available",
      snapshot.metrics.length > 0,
      snapshot.metrics.length === 0 ? "critical" : "info",
      snapshot.metrics.length === 0 ? "offline" : "healthy",
      snapshot.metrics.length === 0
        ? "Analytics snapshot unavailable"
        : "Analytics snapshot available",
      { metricCount: snapshot.metrics.length },
    ),
    buildResult(
      "analytics_report_generation",
      reports.length >= 8,
      reports.length < 8 ? "medium" : "info",
      reports.length < 8 ? "degraded" : "healthy",
      `Reports generated: ${reports.length}`,
      { reportCount: reports.length },
    ),
  ];
}
