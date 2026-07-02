// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Admin foundation
// ==================================================
import {
  getWorkflowById,
  listWorkflows,
  pauseWorkflow,
  resumeWorkflow,
  saveWorkflowState,
  startWorkflow,
} from "@/components/workflowIntelligence/workflowEngine";
import {
  markStepManualReview,
  retryWorkflow,
} from "@/components/workflowIntelligence/workflowRetryFoundation";
import type {
  Workflow,
  WorkflowListFilters,
  WorkflowStatus,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export type AdminWorkflowListItem = {
  id: string;
  type: string;
  orderId: string;
  status: WorkflowStatus;
  currentStepId: string | null;
  completedSteps: number;
  totalSteps: number;
  updatedAt: string;
};

export type AdminWorkflowDetails = Workflow & {
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
};

function matchesStatus(
  workflow: Workflow,
  status?: WorkflowListFilters["status"],
): boolean {
  if (!status) {
    return true;
  }

  if (Array.isArray(status)) {
    return status.includes(workflow.status);
  }

  return workflow.status === status;
}

export function filterWorkflows(
  workflows: Workflow[],
  filters: WorkflowListFilters = {},
): Workflow[] {
  return workflows.filter((workflow) => {
    if (!matchesStatus(workflow, filters.status)) {
      return false;
    }

    if (filters.orderId && workflow.context.orderId !== filters.orderId) {
      return false;
    }

    if (filters.type && workflow.type !== filters.type) {
      return false;
    }

    return true;
  });
}

export function listAdminWorkflows(
  filters: WorkflowListFilters = {},
): AdminWorkflowListItem[] {
  return filterWorkflows(listWorkflows(), filters).map((workflow) => {
    const completedSteps = workflow.steps.filter(
      (step) => step.status === "completed" || step.status === "skipped",
    ).length;

    return {
      id: workflow.id,
      type: workflow.type,
      orderId: workflow.context.orderId,
      status: workflow.status,
      currentStepId: workflow.currentStepId,
      completedSteps,
      totalSteps: workflow.steps.length,
      updatedAt: workflow.updatedAt,
    };
  });
}

export function filterWorkflowsByStatus(
  status: WorkflowStatus | WorkflowStatus[],
): Workflow[] {
  return filterWorkflows(listWorkflows(), { status });
}

export function getAdminWorkflowDetails(
  workflowId: string,
): AdminWorkflowDetails | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const completedSteps = workflow.steps.filter(
    (step) => step.status === "completed" || step.status === "skipped",
  ).length;

  return {
    ...workflow,
    completedSteps,
    totalSteps: workflow.steps.length,
    progressPercent: Math.round((completedSteps / workflow.steps.length) * 100),
  };
}

export function restartWorkflow(workflowId: string): AdminWorkflowDetails | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const retried = retryWorkflow(workflow);
  saveWorkflowState(retried);
  startWorkflow(workflowId);
  return getAdminWorkflowDetails(workflowId);
}

export function pauseAdminWorkflow(workflowId: string) {
  return pauseWorkflow(workflowId);
}

export function resumeAdminWorkflow(workflowId: string) {
  return resumeWorkflow(workflowId);
}

export function markWorkflowManualReview(
  workflowId: string,
  stepId: string,
  reason?: string,
) {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const updated = markStepManualReview(workflow, stepId, reason);
  return updated ? saveWorkflowState(updated) : null;
}
