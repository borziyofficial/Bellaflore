// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Workflow health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiWorkflowSnapshot } from "@/components/aiBrain/aiWorkflowBridge";
import { calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
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
    moduleId: "workflowIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthWorkflowSnapshot() {
  return readAiWorkflowSnapshot();
}

export function runHealthWorkflowChecks(): HealthCheckResult[] {
  const snapshot = readAiWorkflowSnapshot();
  const metrics = calculateWorkflowAnalyticsMetrics(resolveAnalyticsTimeRange("today"));

  const failed = snapshot.failedWorkflowIds.length;
  const paused = snapshot.summary.pausedWorkflows;
  const manualReview = metrics.manualReviewCount;

  return [
    buildResult(
      "workflow_failed",
      failed === 0,
      failed > 0 ? "critical" : "info",
      failed > 0 ? "critical" : "healthy",
      failed > 0 ? `Failed workflows: ${failed}` : "Failed workflows нет",
      { workflowIds: snapshot.failedWorkflowIds },
    ),
    buildResult(
      "workflow_paused",
      paused === 0,
      paused > 0 ? "medium" : "info",
      paused > 0 ? "warning" : "healthy",
      paused > 0 ? `Paused workflows: ${paused}` : "Paused workflows нет",
      { pausedCount: paused },
    ),
    buildResult(
      "workflow_manual_review",
      manualReview === 0,
      manualReview > 0 ? "high" : "info",
      manualReview > 0 ? "degraded" : "healthy",
      manualReview > 0
        ? `Manual review required: ${manualReview}`
        : "Manual review не требуется",
      { manualReviewCount: manualReview },
    ),
  ];
}

export function detectHealthWorkflowIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "workflowIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "workflow",
      resourceId: null,
    }));
}
