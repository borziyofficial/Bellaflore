// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import type {
  DeliveryOrchestrationStatus,
  LogisticsOrder,
  LogisticsOrderQueueBuckets,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const ACTIVE_DELIVERY_STATUSES = new Set<DeliveryOrchestrationStatus>([
  "accepted",
  "preparing",
  "ready_for_courier",
  "assigned_to_courier",
  "courier_on_the_way",
]);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isActiveDeliveryStatus(
  status: DeliveryOrchestrationStatus,
): boolean {
  return ACTIVE_DELIVERY_STATUSES.has(status);
}

export function isCompletedDeliveryStatus(
  status: DeliveryOrchestrationStatus,
): boolean {
  return status === "delivered";
}

export function isCancelledDeliveryStatus(
  status: DeliveryOrchestrationStatus,
): boolean {
  return status === "cancelled";
}

export function isNewDeliveryStatus(status: DeliveryOrchestrationStatus): boolean {
  return status === "new";
}

export function groupLogisticsOrdersIntoQueue(
  orders: LogisticsOrder[],
): LogisticsOrderQueueBuckets {
  const newOrders: LogisticsOrder[] = [];
  const activeOrders: LogisticsOrder[] = [];
  const completedOrders: LogisticsOrder[] = [];
  const cancelledOrders: LogisticsOrder[] = [];

  for (const order of orders) {
    if (isNewDeliveryStatus(order.deliveryStatus)) {
      newOrders.push(order);
      continue;
    }

    if (isCompletedDeliveryStatus(order.deliveryStatus)) {
      completedOrders.push(order);
      continue;
    }

    if (isCancelledDeliveryStatus(order.deliveryStatus)) {
      cancelledOrders.push(order);
      continue;
    }

    if (isActiveDeliveryStatus(order.deliveryStatus)) {
      activeOrders.push(order);
    }
  }

  const sortByCreatedAtDesc = (left: LogisticsOrder, right: LogisticsOrder) =>
    Date.parse(right.createdAt) - Date.parse(left.createdAt);

  return {
    newOrders: newOrders.sort(sortByCreatedAtDesc),
    activeOrders: activeOrders.sort(sortByCreatedAtDesc),
    completedOrders: completedOrders.sort(sortByCreatedAtDesc),
    cancelledOrders: cancelledOrders.sort(sortByCreatedAtDesc),
  };
}

export function getLogisticsOrderQueueCounts(
  orders: LogisticsOrder[],
): Record<keyof LogisticsOrderQueueBuckets, number> {
  const buckets = groupLogisticsOrdersIntoQueue(orders);

  return {
    newOrders: buckets.newOrders.length,
    activeOrders: buckets.activeOrders.length,
    completedOrders: buckets.completedOrders.length,
    cancelledOrders: buckets.cancelledOrders.length,
  };
}
