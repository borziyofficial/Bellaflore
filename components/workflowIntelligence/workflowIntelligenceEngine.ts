// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Main orchestrator
// ==================================================
import { NEW_ORDER_WORKFLOW_TYPE } from "@/components/workflowIntelligence/newOrderWorkflowCatalog";
import { listAdminWorkflows } from "@/components/workflowIntelligence/workflowAdminFoundation";
import { getExampleWorkflowFailure } from "@/components/workflowIntelligence/workflowFailureHandling";
import { getExampleWorkflowRetry } from "@/components/workflowIntelligence/workflowRetryFoundation";
import {
  createWorkflow,
  getWorkflowById,
  saveWorkflowState,
  startWorkflow,
} from "@/components/workflowIntelligence/workflowEngine";
import { readOrderWorkflowContext } from "@/components/workflowIntelligence/workflowOrderBridge";
import {
  runNextWorkflowStep,
  runWorkflowStep,
} from "@/components/workflowIntelligence/workflowStepRunner";

export function createNewOrderWorkflow(orderId: string) {
  const context = readOrderWorkflowContext(orderId);

  if (!context) {
    return null;
  }

  return createWorkflow({
    type: NEW_ORDER_WORKFLOW_TYPE,
    context,
    trigger: "order_created",
  });
}

export function startNewOrderWorkflow(orderId: string) {
  const workflow =
    createNewOrderWorkflow(orderId) ??
    createWorkflow({
      type: NEW_ORDER_WORKFLOW_TYPE,
      context: {
        orderId,
        workflowType: NEW_ORDER_WORKFLOW_TYPE,
        metadata: {},
      },
    });

  const started = startWorkflow(workflow.id);
  if (!started) {
    return null;
  }

  return runNextWorkflowStep(started);
}

export function advanceWorkflow(workflowId: string) {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  return runNextWorkflowStep(workflow);
}

export function runWorkflowUntilBlocked(workflowId: string, maxSteps = 20) {
  let workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  let stepsRun = 0;
  while (stepsRun < maxSteps && workflow) {
    const result = runNextWorkflowStep(workflow);
    if (!result.result) {
      break;
    }

    workflow = saveWorkflowState(result.workflow);
    stepsRun += 1;

    if (
      workflow.status === "failed" ||
      workflow.status === "paused" ||
      workflow.status === "waiting" ||
      workflow.status === "completed"
    ) {
      break;
    }
  }

  return workflow;
}

export function getWorkflowIntelligenceExample() {
  const workflow = createWorkflow({
    type: NEW_ORDER_WORKFLOW_TYPE,
    context: {
      orderId: "BF-1001",
      workflowType: NEW_ORDER_WORKFLOW_TYPE,
      metadata: {
        customerName: "Анна Иванова",
        status: "new",
      },
    },
  });

  const started = startWorkflow(workflow.id);
  const firstStep = started
    ? runWorkflowStep(started, "order_created")
    : null;

  const failure = getExampleWorkflowFailure();
  const retry = getExampleWorkflowRetry(
    firstStep?.workflow ?? workflow,
  );

  return {
    workflow: firstStep?.workflow ?? workflow,
    firstStepResult: firstStep?.result ?? null,
    failureExample: failure,
    retryExample: retry,
    adminList: listAdminWorkflows(),
  };
}

export function runWorkflowIntelligenceEngine() {
  return {
    workflows: listAdminWorkflows(),
    generatedAt: new Date().toISOString(),
  };
}
