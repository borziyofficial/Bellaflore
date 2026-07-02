// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Delivery bridge
// ==================================================
import { buildDeliveryTaskFromOrder } from "@/components/deliveryIntelligence/orderDeliveryBridge";
import { detectDeliveryWindowRisk } from "@/components/deliveryIntelligence/deliveryWindowEngine";
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  WorkflowContext,
  WorkflowResult,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function executeDeliveryWorkflowStep(
  stepId: WorkflowStepId,
  context: WorkflowContext,
): WorkflowResult {
  const order = getOrderById(context.orderId);
  if (!order) {
    return {
      ok: false,
      stepId,
      output: null,
      failureCode: "delivery_window_unavailable",
      message: "Order not found",
      nextStepId: null,
    };
  }

  const windowRisk = detectDeliveryWindowRisk(
    order.delivery.deliveryDate,
    order.delivery.deliveryInterval,
  );

  switch (stepId) {
    case "delivery_task_created": {
      const task = buildDeliveryTaskFromOrder(context.orderId);
      if (!task) {
        return {
          ok: false,
          stepId,
          output: null,
          failureCode: "delivery_window_unavailable",
          message: "Could not build delivery task",
          nextStepId: null,
        };
      }

      if (windowRisk.shouldReschedule) {
        return {
          ok: false,
          stepId,
          output: { windowRisk },
          failureCode: "delivery_window_unavailable",
          message: windowRisk.reasons.join(", "),
          nextStepId: null,
        };
      }

      return {
        ok: true,
        stepId,
        output: {
          deliveryTask: task,
          createCommand: { orderId: context.orderId },
        },
        failureCode: null,
        message: "Delivery task prepared",
        nextStepId: "courier_suggestion",
      };
    }
    case "delivery_started":
      return {
        ok: true,
        stepId,
        output: { status: "in_transit" },
        failureCode: null,
        message: "Delivery started",
        nextStepId: "delivery_completed",
      };
    case "delivery_completed":
      return {
        ok: true,
        stepId,
        output: { status: "delivered" },
        failureCode: null,
        message: "Delivery completed",
        nextStepId: "inventory_confirm_usage",
      };
    default:
      return {
        ok: true,
        stepId,
        output: null,
        failureCode: null,
        message: "Delivery bridge: no-op",
        nextStepId: null,
      };
  }
}
