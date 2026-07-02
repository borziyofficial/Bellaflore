// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Step runner
// ==================================================
import { executeCourierWorkflowStep } from "@/components/workflowIntelligence/workflowCourierBridge";
import { executeDeliveryWorkflowStep } from "@/components/workflowIntelligence/workflowDeliveryBridge";
import { executeInventoryWorkflowStep } from "@/components/workflowIntelligence/workflowInventoryBridge";
import { executeNotificationWorkflowStep } from "@/components/workflowIntelligence/workflowNotificationBridge";
import {
  detectOrderPaymentAttention,
  executeOrderWorkflowStep,
} from "@/components/workflowIntelligence/workflowOrderBridge";
import { shouldPauseWorkflowOnFailure } from "@/components/workflowIntelligence/workflowFailureHandling";
import type {
  Workflow,
  WorkflowResult,
  WorkflowStep,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

const STEP_BRIDGE_ORDER: WorkflowStepId[] = [
  "order_created",
  "inventory_check",
  "inventory_reservation",
  "delivery_task_created",
  "courier_suggestion",
  "notification_admin_new_order",
  "wait_admin_confirmation",
  "order_confirmed",
  "courier_assigned",
  "delivery_started",
  "delivery_completed",
  "inventory_confirm_usage",
  "order_closed",
];

function isStepReady(step: WorkflowStep, steps: WorkflowStep[]): boolean {
  return step.dependsOn.every((dependencyId) => {
    const dependency = steps.find((entry) => entry.id === dependencyId);
    return (
      dependency?.status === "completed" || dependency?.status === "skipped"
    );
  });
}

export function canRunWorkflowStep(
  workflow: Workflow,
  stepId: WorkflowStepId,
): boolean {
  const step = workflow.steps.find((entry) => entry.id === stepId);
  if (!step || step.status === "completed" || step.status === "skipped") {
    return false;
  }

  return isStepReady(step, workflow.steps);
}

function dispatchStep(
  stepId: WorkflowStepId,
  workflow: Workflow,
): WorkflowResult {
  const paymentIssue = detectOrderPaymentAttention(workflow.context);
  if (paymentIssue && stepId !== "order_created") {
    return {
      ok: false,
      stepId,
      output: null,
      failureCode: paymentIssue,
      message: "Payment requires attention",
      nextStepId: null,
    };
  }

  const orderResult = executeOrderWorkflowStep(stepId, workflow.context);
  if (
    !orderResult.ok &&
    STEP_BRIDGE_ORDER.slice(0, 8).includes(stepId)
  ) {
    return orderResult;
  }

  if (
    ["inventory_check", "inventory_reservation", "inventory_confirm_usage"].includes(
      stepId,
    )
  ) {
    const inventoryResult = executeInventoryWorkflowStep(stepId, workflow.context);
    if (!inventoryResult.ok) {
      return inventoryResult;
    }
    return inventoryResult;
  }

  if (
    ["delivery_task_created", "delivery_started", "delivery_completed"].includes(
      stepId,
    )
  ) {
    const deliveryResult = executeDeliveryWorkflowStep(stepId, workflow.context);
    if (!deliveryResult.ok) {
      return deliveryResult;
    }
    return deliveryResult;
  }

  if (["courier_suggestion", "courier_assigned"].includes(stepId)) {
    const courierResult = executeCourierWorkflowStep(stepId, workflow.context);
    if (!courierResult.ok && stepId === "courier_suggestion") {
      const step = workflow.steps.find((entry) => entry.id === stepId);
      if (step?.optional) {
        return {
          ok: true,
          stepId,
          output: courierResult.output,
          failureCode: null,
          message: "Optional courier suggestion skipped due to no match",
          nextStepId: "notification_admin_new_order",
        };
      }
      return courierResult;
    }
    return courierResult.ok ? courierResult : executeOrderWorkflowStep(stepId, workflow.context);
  }

  if (stepId === "notification_admin_new_order") {
    return executeNotificationWorkflowStep(stepId, workflow.context);
  }

  return orderResult.ok
    ? orderResult
    : executeOrderWorkflowStep(stepId, workflow.context);
}

export function runWorkflowStep(
  workflow: Workflow,
  stepId: WorkflowStepId,
): { workflow: Workflow; result: WorkflowResult } {
  const stepIndex = workflow.steps.findIndex((entry) => entry.id === stepId);
  if (stepIndex === -1 || !canRunWorkflowStep(workflow, stepId)) {
    return {
      workflow,
      result: {
        ok: false,
        stepId,
        output: null,
        failureCode: "unknown",
        message: "Step is not ready",
        nextStepId: null,
      },
    };
  }

  const now = new Date().toISOString();
  const runningSteps = workflow.steps.map((entry, index) =>
    index === stepIndex
      ? { ...entry, status: "running" as const, startedAt: now }
      : entry,
  );

  const result = dispatchStep(stepId, workflow);

  const updatedSteps = runningSteps.map((entry, index) => {
    if (index !== stepIndex) {
      return entry;
    }

    if (result.ok) {
      return {
        ...entry,
        status:
          stepId === "wait_admin_confirmation"
            ? ("waiting" as const)
            : ("completed" as const),
        completedAt: stepId === "wait_admin_confirmation" ? null : now,
        failedReason: null,
        failureCode: null,
        output: result.output,
      };
    }

    return {
      ...entry,
      status: "failed" as const,
      failedReason: result.message,
      failureCode: result.failureCode,
      output: result.output,
    };
  });

  const nextPending = updatedSteps.find(
    (entry) => entry.status === "pending" || entry.status === "waiting",
  );

  let nextStatus = workflow.status;
  if (!result.ok && result.failureCode) {
    nextStatus = shouldPauseWorkflowOnFailure(result.failureCode)
      ? "paused"
      : "failed";
  } else if (stepId === "wait_admin_confirmation" && result.ok) {
    nextStatus = "waiting";
  } else if (stepId === "order_closed" && result.ok) {
    nextStatus = "completed";
  } else if (result.ok) {
    nextStatus = "running";
  }

  const nextWorkflow: Workflow = {
    ...workflow,
    status: nextStatus,
    steps: updatedSteps,
    currentStepId: nextPending?.id ?? (result.ok ? result.nextStepId : stepId),
    updatedAt: now,
    completedAt: nextStatus === "completed" ? now : workflow.completedAt,
    failedAt: nextStatus === "failed" ? now : workflow.failedAt,
  };

  return { workflow: nextWorkflow, result };
}

export function runNextWorkflowStep(workflow: Workflow) {
  const nextStep = workflow.steps.find(
    (step) =>
      (step.status === "pending" || step.status === "waiting") &&
      isStepReady(step, workflow.steps),
  );

  if (!nextStep) {
    return {
      workflow,
      result: null,
    };
  }

  return runWorkflowStep(workflow, nextStep.id);
}

export function getNextRunnableStepId(
  workflow: Workflow,
): WorkflowStepId | null {
  const nextStep = workflow.steps.find(
    (step) => step.status === "pending" && isStepReady(step, workflow.steps),
  );

  return nextStep?.id ?? null;
}
