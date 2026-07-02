// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Workflow bridge (read-only)
// ==================================================
import { buildAdminWorkflowSummary } from "@/components/adminIntelligence/adminWorkflowBridge";
import { listWorkflows } from "@/components/workflowIntelligence/workflowEngine";

export type AiWorkflowBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminWorkflowSummary>;
  failedWorkflowIds: string[];
  waitingWorkflowIds: string[];
  generatedAt: string;
};

export function readAiWorkflowSnapshot(): AiWorkflowBridgeSnapshot {
  const summary = buildAdminWorkflowSummary(8);
  const workflows = listWorkflows();

  return {
    summary,
    failedWorkflowIds: workflows
      .filter((workflow) => workflow.status === "failed")
      .map((workflow) => workflow.id),
    waitingWorkflowIds: workflows
      .filter((workflow) => workflow.status === "waiting")
      .map((workflow) => workflow.id),
    generatedAt: new Date().toISOString(),
  };
}
