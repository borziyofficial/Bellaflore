// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: Order bridge
// ==================================================
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  WorkflowContext,
  WorkflowFailureCode,
  WorkflowResult,
  WorkflowStepId,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

export function readOrderWorkflowContext(orderId: string): WorkflowContext | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    workflowType: "new_order_workflow",
    metadata: {
      status: order.status,
      customerName: order.customer.name,
      phone: order.customer.phone,
      totalRub: order.payment.totalRub,
      paymentStatus: order.payment.status,
    },
  };
}

export function executeOrderWorkflowStep(
  stepId: WorkflowStepId,
  context: WorkflowContext,
): WorkflowResult {
  const order = getOrderById(context.orderId);

  if (!order) {
    return {
      ok: false,
      stepId,
      output: null,
      failureCode: "order_cancelled",
      message: "Заказ не найден",
      nextStepId: null,
    };
  }

  if (order.status === "cancelled") {
    return {
      ok: false,
      stepId,
      output: null,
      failureCode: "order_cancelled",
      message: "Заказ отменён",
      nextStepId: null,
    };
  }

  switch (stepId) {
    case "order_created":
      return {
        ok: true,
        stepId,
        output: {
          orderId: order.id,
          status: order.status,
          source: order.source,
        },
        failureCode: null,
        message: "Заказ доступен для workflow",
        nextStepId: "inventory_check",
      };
    case "wait_admin_confirmation":
      return {
        ok: order.status === "new" || order.status === "confirmed",
        stepId,
        output: { awaitingConfirmation: order.status === "new" },
        failureCode: order.status === "new" ? null : null,
        message:
          order.status === "new"
            ? "Ожидание подтверждения администратора"
            : "Подтверждение уже получено",
        nextStepId: order.status === "confirmed" ? "order_confirmed" : null,
      };
    case "order_confirmed":
      return {
        ok: order.status === "confirmed" || order.status === "preparing",
        stepId,
        output: { status: order.status },
        failureCode: null,
        message: "Статус заказа проверен",
        nextStepId: "courier_assigned",
      };
    case "order_closed":
      return {
        ok: order.status === "delivered",
        stepId,
        output: { finalStatus: order.status },
        failureCode: null,
        message: "Workflow завершён",
        nextStepId: null,
      };
    default:
      return {
        ok: true,
        stepId,
        output: { orderId: order.id, status: order.status },
        failureCode: null,
        message: "Order bridge: read-only pass-through",
        nextStepId: null,
      };
  }
}

export function detectOrderPaymentAttention(
  context: WorkflowContext,
): WorkflowFailureCode | null {
  const order = getOrderById(context.orderId);
  if (!order) {
    return null;
  }

  if (order.payment.status === "pending" && order.payment.totalRub >= 20000) {
    return "payment_attention";
  }

  return null;
}
