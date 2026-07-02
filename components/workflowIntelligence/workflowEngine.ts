// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Workflow engine store
// ==================================================
import {
  NEW_ORDER_WORKFLOW_TYPE,
  buildNewOrderWorkflowSteps,
} from "@/components/workflowIntelligence/newOrderWorkflowCatalog";
import {
  appendWorkflowTimelineEvent,
  buildWorkflowTimelineEvent,
} from "@/components/workflowIntelligence/workflowTimelineEngine";
import type {
  Workflow,
  WorkflowContext,
  WorkflowStatus,
  WorkflowTrigger,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export const WORKFLOW_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_workflow_intelligence_v1";

let inMemoryWorkflows: Workflow[] = [];

function readWorkflowsFromStorage(): Workflow[] {
  if (typeof window === "undefined") {
    return inMemoryWorkflows;
  }

  try {
    const raw = window.localStorage.getItem(WORKFLOW_INTELLIGENCE_STORAGE_KEY);
    if (!raw) {
      return inMemoryWorkflows;
    }

    const parsed = JSON.parse(raw) as Workflow[];
    return Array.isArray(parsed) ? parsed : inMemoryWorkflows;
  } catch {
    return inMemoryWorkflows;
  }
}

function writeWorkflowsToStorage(workflows: Workflow[]): void {
  inMemoryWorkflows = workflows;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      WORKFLOW_INTELLIGENCE_STORAGE_KEY,
      JSON.stringify(workflows),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function saveWorkflow(workflow: Workflow): Workflow {
  const workflows = readWorkflowsFromStorage();
  const index = workflows.findIndex((entry) => entry.id === workflow.id);
  const nextWorkflows =
    index === -1
      ? [...workflows, workflow]
      : workflows.map((entry, entryIndex) =>
          entryIndex === index ? workflow : entry,
        );

  writeWorkflowsToStorage(nextWorkflows);
  return workflow;
}

function createWorkflowId(type: string, orderId: string): string {
  return `WFL-${type}-${orderId}`;
}

function appendStatusTimeline(
  workflow: Workflow,
  status: WorkflowStatus,
  message: string,
): Workflow {
  const event = buildWorkflowTimelineEvent({
    workflowId: workflow.id,
    title: `Workflow ${status}`,
    message,
    status,
  });

  return {
    ...workflow,
    timeline: appendWorkflowTimelineEvent(workflow.timeline, event),
  };
}

export function createWorkflow(input: {
  type: string;
  context: WorkflowContext;
  trigger?: WorkflowTrigger;
}): Workflow {
  const existing = readWorkflowsFromStorage().find(
    (workflow) =>
      workflow.type === input.type &&
      workflow.context.orderId === input.context.orderId,
  );

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const steps =
    input.type === NEW_ORDER_WORKFLOW_TYPE
      ? buildNewOrderWorkflowSteps()
      : buildNewOrderWorkflowSteps();

  const workflow: Workflow = {
    id: createWorkflowId(input.type, input.context.orderId),
    type: input.type,
    status: "idle",
    trigger: input.trigger ?? "order_created",
    context: input.context,
    steps,
    currentStepId: steps[0]?.id ?? null,
    timeline: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    failedAt: null,
    cancelledAt: null,
  };

  return saveWorkflow(
    appendStatusTimeline(workflow, "idle", "Workflow создан"),
  );
}

export function getWorkflowById(workflowId: string): Workflow | null {
  return readWorkflowsFromStorage().find((workflow) => workflow.id === workflowId) ?? null;
}

export function getWorkflowByOrderId(
  orderId: string,
  type = NEW_ORDER_WORKFLOW_TYPE,
): Workflow | null {
  return (
    readWorkflowsFromStorage().find(
      (workflow) =>
        workflow.context.orderId === orderId && workflow.type === type,
    ) ?? null
  );
}

export function listWorkflows(): Workflow[] {
  return readWorkflowsFromStorage().sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export function startWorkflow(workflowId: string): Workflow | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const now = new Date().toISOString();
  const next = appendStatusTimeline(
    {
      ...workflow,
      status: "running",
      updatedAt: now,
    },
    "running",
    "Workflow запущен",
  );

  return saveWorkflow(next);
}

export function pauseWorkflow(workflowId: string): Workflow | null {
  return updateWorkflowStatus(workflowId, "paused", "Workflow приостановлен");
}

export function resumeWorkflow(workflowId: string): Workflow | null {
  return updateWorkflowStatus(workflowId, "running", "Workflow возобновлён");
}

export function cancelWorkflow(workflowId: string): Workflow | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const now = new Date().toISOString();
  const next = appendStatusTimeline(
    {
      ...workflow,
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    },
    "cancelled",
    "Workflow отменён",
  );

  return saveWorkflow(next);
}

export function completeWorkflow(workflowId: string): Workflow | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const now = new Date().toISOString();
  const next = appendStatusTimeline(
    {
      ...workflow,
      status: "completed",
      completedAt: now,
      updatedAt: now,
      currentStepId: null,
    },
    "completed",
    "Workflow завершён",
  );

  return saveWorkflow(next);
}

export function failWorkflow(
  workflowId: string,
  reason = "Workflow failed",
): Workflow | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const now = new Date().toISOString();
  const next = appendStatusTimeline(
    {
      ...workflow,
      status: "failed",
      failedAt: now,
      updatedAt: now,
    },
    "failed",
    reason,
  );

  return saveWorkflow(next);
}

function updateWorkflowStatus(
  workflowId: string,
  status: WorkflowStatus,
  message: string,
): Workflow | null {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const next = appendStatusTimeline(
    {
      ...workflow,
      status,
      updatedAt: new Date().toISOString(),
    },
    status,
    message,
  );

  return saveWorkflow(next);
}

export function saveWorkflowState(workflow: Workflow): Workflow {
  return saveWorkflow({
    ...workflow,
    updatedAt: new Date().toISOString(),
  });
}

export function clearWorkflowIntelligenceStore(): void {
  inMemoryWorkflows = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(WORKFLOW_INTELLIGENCE_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
  }
}
