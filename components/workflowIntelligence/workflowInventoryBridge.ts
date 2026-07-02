// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Inventory bridge
// ==================================================
import { resolveProductAvailability } from "@/components/inventoryIntelligence/productAvailabilityEngine";
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  WorkflowContext,
  WorkflowResult,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function executeInventoryWorkflowStep(
  stepId: WorkflowStepId,
  context: WorkflowContext,
): WorkflowResult {
  const order = getOrderById(context.orderId);
  if (!order) {
    return {
      ok: false,
      stepId,
      output: null,
      failureCode: "inventory_not_available",
      message: "Order not found for inventory check",
      nextStepId: null,
    };
  }

  const primaryItem = order.items[0];
  const availability = primaryItem
    ? resolveProductAvailability(primaryItem.productId, primaryItem.sizeId ?? "S")
    : null;

  switch (stepId) {
    case "inventory_check":
      if (!availability?.composition.canAssemble) {
        return {
          ok: false,
          stepId,
          output: {
            missingItems: availability?.composition.missingItems ?? [],
          },
          failureCode: "inventory_not_available",
          message: availability?.composition.reasonSummary ?? "Inventory unavailable",
          nextStepId: null,
        };
      }

      return {
        ok: true,
        stepId,
        output: {
          status: availability.status,
          reasonSummary: availability.composition.reasonSummary,
        },
        failureCode: null,
        message: "Inventory check passed",
        nextStepId: "inventory_reservation",
      };
    case "inventory_reservation":
      return {
        ok: true,
        stepId,
        output: {
          reservationCommand: {
            orderId: context.orderId,
            items: order.items.map((item) => ({
              productId: item.productId,
              sizeId: item.sizeId ?? "S",
              quantity: item.quantity,
            })),
            reserveOnCreate: false,
          },
        },
        failureCode: null,
        message: "Inventory reservation command prepared",
        nextStepId: "delivery_task_created",
      };
    case "inventory_confirm_usage":
      return {
        ok: true,
        stepId,
        output: {
          confirmCommand: {
            orderId: context.orderId,
            confirmOnDeliver: true,
          },
        },
        failureCode: null,
        message: "Inventory confirm command prepared",
        nextStepId: "order_closed",
      };
    default:
      return {
        ok: true,
        stepId,
        output: null,
        failureCode: null,
        message: "Inventory bridge: no-op",
        nextStepId: null,
      };
  }
}
