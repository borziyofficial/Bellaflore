// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Workflow bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  WorkflowAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { isDateWithinAnalyticsRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { readAiWorkflowSnapshot } from "@/components/aiBrain/aiWorkflowBridge";
import { listWorkflows } from "@/components/workflowIntelligence/workflowEngine";

function calculateWorkflowDurationMinutes(
  startedAt: string | null,
  completedAt: string | null,
): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }

  const minutes =
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60_000;

  return minutes > 0 ? minutes : null;
}

export function readAnalyticsWorkflowSnapshot(range: AnalyticsTimeRange) {
  const workflows = listWorkflows().filter((workflow) =>
    isDateWithinAnalyticsRange(workflow.createdAt, range),
  );

  return {
    snapshot: readAiWorkflowSnapshot(),
    workflowsInRange: workflows.length,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateWorkflowAnalyticsMetrics(
  range: AnalyticsTimeRange,
): WorkflowAnalyticsMetrics {
  const snapshot = readAiWorkflowSnapshot();
  const workflows = listWorkflows().filter((workflow) =>
    isDateWithinAnalyticsRange(workflow.createdAt, range),
  );

  const manualReviewCount = workflows.reduce((count, workflow) => {
    return (
      count +
      workflow.steps.filter((step) => step.status === "manual_review").length
    );
  }, 0);

  const durations = workflows
    .map((workflow) => {
      const started = workflow.steps.find((step) => step.startedAt)?.startedAt ?? null;
      const completed = workflow.steps.find((step) => step.completedAt)?.completedAt ?? null;
      return calculateWorkflowDurationMinutes(started, completed);
    })
    .filter((value): value is number => value != null);

  const averageWorkflowDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

  let workflowRiskLevel: WorkflowAnalyticsMetrics["workflowRiskLevel"] = "low";
  if (snapshot.summary.failedWorkflows > 0) {
    workflowRiskLevel = "critical";
  } else if (snapshot.summary.waitingWorkflows > 0 || manualReviewCount > 0) {
    workflowRiskLevel = "high";
  } else if (snapshot.summary.pausedWorkflows > 0) {
    workflowRiskLevel = "medium";
  }

  return {
    activeWorkflows:
      snapshot.summary.runningWorkflows + snapshot.summary.waitingWorkflows,
    failedWorkflows: snapshot.summary.failedWorkflows,
    completedWorkflows: snapshot.summary.totalWorkflows - snapshot.summary.failedWorkflows,
    manualReviewCount,
    averageWorkflowDuration,
    workflowRiskLevel,
  };
}
