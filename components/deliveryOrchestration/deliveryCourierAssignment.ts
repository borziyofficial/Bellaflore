// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import { getDeliveryOrchestrationConfig } from "@/components/deliveryOrchestration/deliveryOrchestrationConfig";
import type {
  AssignLogisticsCourierInput,
  LogisticsOrder,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AssignLogisticsCourierResult =
  | { ok: true; order: LogisticsOrder }
  | { ok: false; order: LogisticsOrder; error: string };

export type UnassignLogisticsCourierResult =
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
export function assignCourierToLogisticsOrder(
  order: LogisticsOrder,
  input: AssignLogisticsCourierInput,
): AssignLogisticsCourierResult {
  const config = getDeliveryOrchestrationConfig();

  if (!config.enabled) {
    return {
      ok: false,
      order,
      error: "Delivery orchestration is disabled.",
    };
  }

  const assignmentMode = input.assignmentMode ?? "manual";

  if (assignmentMode === "manual" && !config.manualAssignmentEnabled) {
    return {
      ok: false,
      order,
      error: "Manual courier assignment is disabled.",
    };
  }

  if (assignmentMode === "auto" && !config.autoAssignmentEnabled) {
    return {
      ok: false,
      order,
      error: "Automatic courier assignment is not enabled yet.",
    };
  }

  if (order.deliveryStatus === "delivered" || order.deliveryStatus === "cancelled") {
    return {
      ok: false,
      order,
      error: "Cannot assign courier to a closed order.",
    };
  }

  const updatedAt = new Date().toISOString();

  return {
    ok: true,
    order: {
      ...order,
      courierId: input.courierId,
      courierName: input.courierName,
      courierPhone: input.courierPhone,
      courierStatus: "assigned",
      deliveryStatus:
        order.deliveryStatus === "new" ||
        order.deliveryStatus === "accepted" ||
        order.deliveryStatus === "preparing" ||
        order.deliveryStatus === "ready_for_courier"
          ? "assigned_to_courier"
          : order.deliveryStatus,
      updatedAt,
    },
  };
}

export function unassignCourierFromLogisticsOrder(
  order: LogisticsOrder,
): UnassignLogisticsCourierResult {
  const config = getDeliveryOrchestrationConfig();

  if (!config.enabled) {
    return {
      ok: false,
      order,
      error: "Delivery orchestration is disabled.",
    };
  }

  if (!order.courierId) {
    return {
      ok: false,
      order,
      error: "Courier is not assigned to this order.",
    };
  }

  const updatedAt = new Date().toISOString();

  return {
    ok: true,
    order: {
      ...order,
      courierId: null,
      courierName: null,
      courierPhone: null,
      courierStatus: "unassigned",
      deliveryStatus:
        order.deliveryStatus === "assigned_to_courier" ||
        order.deliveryStatus === "courier_on_the_way"
          ? "ready_for_courier"
          : order.deliveryStatus,
      routeId: null,
      updatedAt,
    },
  };
}

export function markLogisticsCourierOnTheWay(
  order: LogisticsOrder,
): LogisticsOrder {
  if (!order.courierId) {
    return order;
  }

  return {
    ...order,
    courierStatus: "on_the_way",
    deliveryStatus: "courier_on_the_way",
    updatedAt: new Date().toISOString(),
  };
}
