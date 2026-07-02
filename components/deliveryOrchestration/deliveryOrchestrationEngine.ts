// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import { buildLogisticsOrderFromCheckout } from "@/components/deliveryOrchestration/buildLogisticsOrderFromCheckout";
import {
  assignCourierToLogisticsOrder,
  markLogisticsCourierOnTheWay,
  unassignCourierFromLogisticsOrder,
} from "@/components/deliveryOrchestration/deliveryCourierAssignment";
import { getDeliveryOrchestrationConfig } from "@/components/deliveryOrchestration/deliveryOrchestrationConfig";
import { recalculateLogisticsOrderEta } from "@/components/deliveryOrchestration/deliveryEtaRecalculation";
import {
  groupLogisticsOrdersIntoQueue,
  getLogisticsOrderQueueCounts,
} from "@/components/deliveryOrchestration/deliveryOrderQueue";
import {
  createDeliveryRoutePlanDraft,
  attachRoutePlanToLogisticsOrders,
  buildRoutePlanFromAssignedOrders,
} from "@/components/deliveryOrchestration/deliveryRoutePlanner";
import {
  canTransitionDeliveryStatus,
  getNextDeliveryStatuses,
} from "@/components/deliveryOrchestration/deliveryStatusPipeline";
import {
  findLogisticsOrderById,
  readLogisticsOrders,
  saveLogisticsOrder,
  writeLogisticsOrders,
} from "@/components/deliveryOrchestration/deliveryOrchestrationStorage";
import type {
  AssignLogisticsCourierInput,
  DeliveryOrchestrationStatus,
  LogisticsOrder,
  RecalculateLogisticsEtaInput,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";

export {
  buildLogisticsOrderFromCheckout,
  assignCourierToLogisticsOrder,
  unassignCourierFromLogisticsOrder,
  markLogisticsCourierOnTheWay,
  recalculateLogisticsOrderEta,
  groupLogisticsOrdersIntoQueue,
  getLogisticsOrderQueueCounts,
  createDeliveryRoutePlanDraft,
  attachRoutePlanToLogisticsOrders,
  buildRoutePlanFromAssignedOrders,
  canTransitionDeliveryStatus,
  getNextDeliveryStatuses,
  findLogisticsOrderById,
  readLogisticsOrders,
  saveLogisticsOrder,
  writeLogisticsOrders,
};


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type UpdateLogisticsOrderStatusResult =
  | { ok: true; order: LogisticsOrder }
  | { ok: false; order: LogisticsOrder; error: string };


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createAndSaveLogisticsOrderFromCheckout(
  input: Parameters<typeof buildLogisticsOrderFromCheckout>[0],
): LogisticsOrder {
  const config = getDeliveryOrchestrationConfig();

  if (!config.enabled) {
    return buildLogisticsOrderFromCheckout(input);
  }

  const logisticsOrder = recalculateLogisticsOrderEta(
    buildLogisticsOrderFromCheckout(input),
    {
      deliveryInterval: input.payload.deliveryInterval,
      deliveryConfidence: input.deliveryConfidenceResult ?? undefined,
    },
  );

  saveLogisticsOrder(logisticsOrder);
  return logisticsOrder;
}

export function updateLogisticsOrderStatus(
  order: LogisticsOrder,
  nextStatus: DeliveryOrchestrationStatus,
): UpdateLogisticsOrderStatusResult {
  const config = getDeliveryOrchestrationConfig();

  if (!config.enabled) {
    return {
      ok: false,
      order,
      error: "Delivery orchestration is disabled.",
    };
  }

  if (!canTransitionDeliveryStatus(order.deliveryStatus, nextStatus)) {
    return {
      ok: false,
      order,
      error: `Cannot transition from ${order.deliveryStatus} to ${nextStatus}.`,
    };
  }

  const updatedOrder = recalculateLogisticsOrderEta(
    {
      ...order,
      deliveryStatus: nextStatus,
      courierStatus:
        nextStatus === "delivered"
          ? "delivered"
          : nextStatus === "cancelled"
            ? order.courierId
              ? "unavailable"
              : "unassigned"
            : order.courierStatus,
      updatedAt: new Date().toISOString(),
    },
    {
      deliveryStatus: nextStatus,
      courierAssigned: Boolean(order.courierId),
    },
  );

  return { ok: true, order: updatedOrder };
}

export function assignCourierWithEtaRecalculation(
  order: LogisticsOrder,
  input: AssignLogisticsCourierInput,
): ReturnType<typeof assignCourierToLogisticsOrder> {
  const assignmentResult = assignCourierToLogisticsOrder(order, input);

  if (!assignmentResult.ok) {
    return assignmentResult;
  }

  return {
    ok: true,
    order: recalculateLogisticsOrderEta(assignmentResult.order, {
      courierAssigned: true,
      deliveryStatus: assignmentResult.order.deliveryStatus,
    }),
  };
}

export function unassignCourierWithEtaRecalculation(
  order: LogisticsOrder,
): ReturnType<typeof unassignCourierFromLogisticsOrder> {
  const unassignmentResult = unassignCourierFromLogisticsOrder(order);

  if (!unassignmentResult.ok) {
    return unassignmentResult;
  }

  return {
    ok: true,
    order: recalculateLogisticsOrderEta(unassignmentResult.order, {
      courierAssigned: false,
      deliveryStatus: unassignmentResult.order.deliveryStatus,
    }),
  };
}

export function updateLogisticsOrderInterval(
  order: LogisticsOrder,
  deliveryInterval: string,
  input: RecalculateLogisticsEtaInput = {},
): LogisticsOrder {
  return recalculateLogisticsOrderEta(
    {
      ...order,
      deliveryInterval,
      updatedAt: new Date().toISOString(),
    },
    {
      ...input,
      deliveryInterval,
      courierAssigned: Boolean(order.courierId),
      deliveryStatus: order.deliveryStatus,
    },
  );
}

export function readLogisticsOrderQueue() {
  return groupLogisticsOrdersIntoQueue(readLogisticsOrders());
}
