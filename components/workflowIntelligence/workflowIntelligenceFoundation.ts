// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  Workflow,
  WorkflowStep,
  WorkflowStatus,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowContext,
  WorkflowEvent,
  WorkflowResult,
  WorkflowTimelineEvent,
  WorkflowFailureCode,
  WorkflowListFilters,
  AiWorkflowHooks,
  NewOrderWorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export {
  NEW_ORDER_WORKFLOW_TYPE,
  NEW_ORDER_WORKFLOW_STEPS,
  buildNewOrderWorkflowSteps,
  getNewOrderWorkflowStepOrder,
} from "@/components/workflowIntelligence/newOrderWorkflowCatalog";

export {
  buildWorkflowTimelineEvent,
  appendWorkflowTimelineEvent,
} from "@/components/workflowIntelligence/workflowTimelineEngine";

export {
  WORKFLOW_INTELLIGENCE_STORAGE_KEY,
  createWorkflow,
  startWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  completeWorkflow,
  failWorkflow,
  getWorkflowById,
  getWorkflowByOrderId,
  listWorkflows,
  saveWorkflowState,
  clearWorkflowIntelligenceStore,
} from "@/components/workflowIntelligence/workflowEngine";

export {
  canRunWorkflowStep,
  runWorkflowStep,
  runNextWorkflowStep,
  getNextRunnableStepId,
} from "@/components/workflowIntelligence/workflowStepRunner";

export {
  readOrderWorkflowContext,
  executeOrderWorkflowStep,
  detectOrderPaymentAttention,
} from "@/components/workflowIntelligence/workflowOrderBridge";

export { executeInventoryWorkflowStep } from "@/components/workflowIntelligence/workflowInventoryBridge";
export { executeDeliveryWorkflowStep } from "@/components/workflowIntelligence/workflowDeliveryBridge";
export { executeCourierWorkflowStep } from "@/components/workflowIntelligence/workflowCourierBridge";
export { executeNotificationWorkflowStep } from "@/components/workflowIntelligence/workflowNotificationBridge";

export {
  resolveWorkflowFailureRecovery,
  detectWorkflowFailure,
  shouldPauseWorkflowOnFailure,
  getExampleWorkflowFailure,
  type WorkflowFailureRecovery,
} from "@/components/workflowIntelligence/workflowFailureHandling";

export {
  retryStep,
  retryWorkflow,
  skipOptionalStep,
  markStepManualReview,
  getExampleWorkflowRetry,
} from "@/components/workflowIntelligence/workflowRetryFoundation";

export {
  listAdminWorkflows,
  filterWorkflowsByStatus,
  getAdminWorkflowDetails,
  restartWorkflow,
  pauseAdminWorkflow,
  resumeAdminWorkflow,
  markWorkflowManualReview,
  filterWorkflows,
  type AdminWorkflowListItem,
  type AdminWorkflowDetails,
} from "@/components/workflowIntelligence/workflowAdminFoundation";

export {
  registerAiWorkflowHooks,
  getAiWorkflowHooks,
  clearAiWorkflowHooks,
  detectWorkflowRisk,
  suggestNextWorkflowAction,
  explainWorkflowFailure,
  optimizeWorkflowSequence,
  summarizeWorkflowPerformance,
  AI_WORKFLOW_INTEGRATION_SLOTS,
} from "@/components/workflowIntelligence/aiWorkflowFoundation";

export {
  createNewOrderWorkflow,
  startNewOrderWorkflow,
  advanceWorkflow,
  runWorkflowUntilBlocked,
  getWorkflowIntelligenceExample,
  runWorkflowIntelligenceEngine,
} from "@/components/workflowIntelligence/workflowIntelligenceEngine";
