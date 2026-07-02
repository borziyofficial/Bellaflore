// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Timeline engine
// ==================================================
import type {
  WorkflowStatus,
  WorkflowTimelineEvent,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function buildWorkflowTimelineEvent(input: {
  workflowId: string;
  title: string;
  message: string;
  status: WorkflowStatus;
  createdAt?: string;
}): WorkflowTimelineEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `WTE-${input.workflowId}-${Date.parse(createdAt)}`,
    workflowId: input.workflowId,
    title: input.title,
    message: input.message,
    status: input.status,
    createdAt,
  };
}

export function appendWorkflowTimelineEvent(
  timeline: WorkflowTimelineEvent[],
  event: WorkflowTimelineEvent,
): WorkflowTimelineEvent[] {
  return [...timeline, event];
}
