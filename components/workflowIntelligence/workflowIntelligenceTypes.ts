// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type WorkflowStatus =
  | "idle"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type WorkflowStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "waiting"
  | "manual_review";

export type WorkflowTrigger =
  | "order_created"
  | "manual"
  | "scheduled"
  | "retry"
  | "admin_action";

export type WorkflowFailureCode =
  | "inventory_not_available"
  | "courier_not_found"
  | "delivery_window_unavailable"
  | "notification_failed"
  | "payment_attention"
  | "order_cancelled"
  | "unknown";

export type NewOrderWorkflowStepId =
  | "order_created"
  | "inventory_check"
  | "inventory_reservation"
  | "delivery_task_created"
  | "courier_suggestion"
  | "notification_admin_new_order"
  | "wait_admin_confirmation"
  | "order_confirmed"
  | "courier_assigned"
  | "delivery_started"
  | "delivery_completed"
  | "inventory_confirm_usage"
  | "order_closed";

export type WorkflowStepId = NewOrderWorkflowStepId | string;

export type WorkflowActionKind =
  | "read"
  | "create"
  | "notify"
  | "wait"
  | "assign"
  | "confirm"
  | "close";

export type WorkflowAction = {
  kind: WorkflowActionKind;
  target: "order" | "inventory" | "delivery" | "courier" | "notification";
  command: string;
  payload: Record<string, unknown>;
};

export type WorkflowContext = {
  orderId: string;
  workflowType: string;
  metadata: Record<string, unknown>;
};

export type WorkflowEvent = {
  id: string;
  workflowId: string;
  stepId: WorkflowStepId;
  kind: "step_started" | "step_completed" | "step_failed" | "workflow_status_changed";
  message: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

export type WorkflowTimelineEvent = {
  id: string;
  workflowId: string;
  title: string;
  message: string;
  status: WorkflowStatus;
  createdAt: string;
};

export type WorkflowStepOutput = Record<string, unknown>;

export type WorkflowStep = {
  id: WorkflowStepId;
  title: string;
  status: WorkflowStepStatus;
  optional: boolean;
  dependsOn: WorkflowStepId[];
  startedAt: string | null;
  completedAt: string | null;
  failedReason: string | null;
  failureCode: WorkflowFailureCode | null;
  retryCount: number;
  output: WorkflowStepOutput | null;
};

export type WorkflowResult = {
  ok: boolean;
  stepId: WorkflowStepId;
  output: WorkflowStepOutput | null;
  failureCode: WorkflowFailureCode | null;
  message: string;
  nextStepId: WorkflowStepId | null;
};

export type Workflow = {
  id: string;
  type: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  context: WorkflowContext;
  steps: WorkflowStep[];
  currentStepId: WorkflowStepId | null;
  timeline: WorkflowTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
};

export type WorkflowListFilters = {
  status?: WorkflowStatus | WorkflowStatus[];
  orderId?: string;
  type?: string;
};

export type AiWorkflowHooks = {
  detectWorkflowRisk?: (
    workflow: Workflow,
  ) => Promise<{ level: "low" | "medium" | "high"; reasons: string[] }>;
  suggestNextWorkflowAction?: (
    workflow: Workflow,
  ) => Promise<{ stepId: WorkflowStepId; reason: string } | null>;
  explainWorkflowFailure?: (
    workflow: Workflow,
  ) => Promise<{ summary: string; recommendations: string[] }>;
  optimizeWorkflowSequence?: (
    workflowType: string,
  ) => Promise<Array<{ stepId: WorkflowStepId; suggestion: string }>>;
  summarizeWorkflowPerformance?: (
    date: string,
  ) => Promise<{ summary: string; completedCount: number; failedCount: number }>;
};
