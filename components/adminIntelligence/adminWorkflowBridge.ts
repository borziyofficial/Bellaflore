// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Workflow bridge (read-only)
// ==================================================
import { listAdminWorkflows } from "@/components/workflowIntelligence/workflowAdminFoundation";
import { listWorkflows } from "@/components/workflowIntelligence/workflowEngine";

export type AdminWorkflowBridgeSummary = {
  totalWorkflows: number;
  runningWorkflows: number;
  waitingWorkflows: number;
  failedWorkflows: number;
  pausedWorkflows: number;
  recentWorkflows: ReturnType<typeof listAdminWorkflows>;
  generatedAt: string;
};

export function buildAdminWorkflowSummary(
  limit = 5,
): AdminWorkflowBridgeSummary {
  const workflows = listWorkflows();

  return {
    totalWorkflows: workflows.length,
    runningWorkflows: workflows.filter((workflow) => workflow.status === "running")
      .length,
    waitingWorkflows: workflows.filter((workflow) => workflow.status === "waiting")
      .length,
    failedWorkflows: workflows.filter((workflow) => workflow.status === "failed")
      .length,
    pausedWorkflows: workflows.filter((workflow) => workflow.status === "paused")
      .length,
    recentWorkflows: listAdminWorkflows().slice(0, limit),
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminWorkflowAttentionCount(): number {
  const summary = buildAdminWorkflowSummary(0);
  return (
    summary.failedWorkflows + summary.waitingWorkflows + summary.pausedWorkflows
  );
}
