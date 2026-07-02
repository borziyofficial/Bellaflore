// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import type {
  DeliveryRoutePlan,
  DeliveryRouteStatus,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type CreateDeliveryRoutePlanInput = {
  routeId: string;
  courierId: string;
  orderIds: string[];
  estimatedRouteTimeMinutes?: number | null;
  routeStatus?: DeliveryRouteStatus;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createDeliveryRoutePlanDraft(
  input: CreateDeliveryRoutePlanInput,
): DeliveryRoutePlan {
  const now = new Date().toISOString();

  return {
    routeId: input.routeId,
    courierId: input.courierId,
    orderIds: [...input.orderIds],
    estimatedRouteTimeMinutes: input.estimatedRouteTimeMinutes ?? null,
    routeStatus: input.routeStatus ?? "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function attachRoutePlanToLogisticsOrders<
  T extends { orderId: string; routeId: string | null; updatedAt: string },
>(orders: T[], routePlan: DeliveryRoutePlan): T[] {
  const orderIdSet = new Set(routePlan.orderIds);
  const updatedAt = new Date().toISOString();

  return orders.map((order) =>
    orderIdSet.has(order.orderId)
      ? {
          ...order,
          routeId: routePlan.routeId,
          updatedAt,
        }
      : order,
  );
}

export function buildRoutePlanFromAssignedOrders<
  T extends { orderId: string; courierId: string | null },
>(orders: T[], routeId: string): DeliveryRoutePlan | null {
  const assignedOrders = orders.filter((order) => order.courierId);

  if (assignedOrders.length === 0) {
    return null;
  }

  const courierId = assignedOrders[0]?.courierId;
  if (!courierId) {
    return null;
  }

  const sameCourierOrders = assignedOrders.filter(
    (order) => order.courierId === courierId,
  );

  return createDeliveryRoutePlanDraft({
    routeId,
    courierId,
    orderIds: sameCourierOrders.map((order) => order.orderId),
  });
}
