// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Notification bridge
// ==================================================
import { buildNewOrderNotificationEvent } from "@/components/notificationIntelligence/orderNotificationBridge";
import { buildNotificationsFromEvent } from "@/components/notificationIntelligence/notificationRuleEngine";
import type {
  WorkflowContext,
  WorkflowResult,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function executeNotificationWorkflowStep(
  stepId: WorkflowStepId,
  context: WorkflowContext,
): WorkflowResult {
  switch (stepId) {
    case "notification_admin_new_order": {
      const event = buildNewOrderNotificationEvent(context.orderId);

      if (!event) {
        return {
          ok: false,
          stepId,
          output: null,
          failureCode: "notification_failed",
          message: "Could not build notification event",
          nextStepId: null,
        };
      }

      const queueItems = buildNotificationsFromEvent(event);

      return {
        ok: true,
        stepId,
        output: {
          notificationEvent: event,
          queueItemCount: queueItems.length,
          ingestCommand: { eventId: event.id, dryRun: true },
        },
        failureCode: null,
        message: "Admin notification payload prepared",
        nextStepId: "wait_admin_confirmation",
      };
    }
    default:
      return {
        ok: true,
        stepId,
        output: null,
        failureCode: null,
        message: "Notification bridge: no-op",
        nextStepId: null,
      };
  }
}
