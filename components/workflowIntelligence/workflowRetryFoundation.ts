// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Retry foundation
// ==================================================
import type {
  Workflow,
  WorkflowStep,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";
import { resolveWorkflowFailureRecovery } from "@/components/workflowIntelligence/workflowFailureHandling";

export function retryStep(
  workflow: Workflow,
  stepId: WorkflowStepId,
): Workflow | null {
  const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) {
    return null;
  }

  const step = workflow.steps[stepIndex];
  const recovery = resolveWorkflowFailureRecovery(step.failureCode);

  if (!recovery.canRetry) {
    return null;
  }

  const nextSteps = workflow.steps.map((entry, index) =>
    index === stepIndex
      ? {
          ...entry,
          status: "pending" as const,
          failedReason: null,
          failureCode: null,
          retryCount: entry.retryCount + 1,
          startedAt: null,
          completedAt: null,
          output: null,
        }
      : entry,
  );

  return {
    ...workflow,
    status: "running",
    steps: nextSteps,
    currentStepId: stepId,
    updatedAt: new Date().toISOString(),
  };
}

export function retryWorkflow(workflow: Workflow): Workflow {
  const failedStep = workflow.steps.find((step) => step.status === "failed");
  if (!failedStep) {
    return workflow;
  }

  return retryStep(workflow, failedStep.id) ?? workflow;
}

export function skipOptionalStep(
  workflow: Workflow,
  stepId: WorkflowStepId,
): Workflow | null {
  const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) {
    return null;
  }

  const step = workflow.steps[stepIndex];
  if (!step.optional) {
    return null;
  }

  const now = new Date().toISOString();
  const nextSteps = workflow.steps.map((entry, index) =>
    index === stepIndex
      ? {
          ...entry,
          status: "skipped" as const,
          completedAt: now,
          output: { skipped: true },
        }
      : entry,
  );

  const nextPending = nextSteps.find((entry) => entry.status === "pending");

  return {
    ...workflow,
    steps: nextSteps,
    currentStepId: nextPending?.id ?? null,
    status: nextPending ? "running" : workflow.status,
    updatedAt: now,
  };
}

export function markStepManualReview(
  workflow: Workflow,
  stepId: WorkflowStepId,
  reason = "Manual review required",
): Workflow | null {
  const stepIndex = workflow.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) {
    return null;
  }

  const nextSteps = workflow.steps.map((entry, index) =>
    index === stepIndex
      ? {
          ...entry,
          status: "manual_review" as const,
          failedReason: reason,
        }
      : entry,
  );

  return {
    ...workflow,
    status: "paused",
    steps: nextSteps,
    currentStepId: stepId,
    updatedAt: new Date().toISOString(),
  };
}

export function getExampleWorkflowRetry(workflow: Workflow): {
  step: WorkflowStep | null;
  retriedWorkflow: Workflow | null;
} {
  const failedStep =
    workflow.steps.find((step) => step.id === "inventory_check") ??
    workflow.steps.find((step) => step.status === "failed") ??
    null;

  if (!failedStep) {
    return { step: null, retriedWorkflow: null };
  }

  const failedWorkflow: Workflow = {
    ...workflow,
    steps: workflow.steps.map((step) =>
      step.id === failedStep.id
        ? {
            ...step,
            status: "failed",
            failureCode: "inventory_not_available",
            failedReason: "Не хватает гортензии",
          }
        : step,
    ),
    status: "failed",
  };

  return {
    step: failedStep,
    retriedWorkflow: retryStep(failedWorkflow, failedStep.id),
  };
}
