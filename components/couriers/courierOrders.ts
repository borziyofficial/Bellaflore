// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Order list filtering and status helpers for courier workspace.
//
// Назначение (RU):
// Фильтрация заказов и хелперы статусов для рабочего места курьера.
// ==================================================
import {
  getAllOrders,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import type { OrderStatusId } from "@/components/orders/orderStatus";

const ACTIVE_COURIER_ORDER_STATUSES: OrderStatusId[] = [
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
];

const ACTIVE_COURIER_STATUS_SORT_ORDER: Partial<Record<OrderStatusId, number>> =
  {
    COURIER_ASSIGNED: 0,
    OUT_FOR_DELIVERY: 1,
  };


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function getOrderSortTimestamp(order: AdminOrderRecord): number {
  const timestamp = new Date(order.updatedAt ?? order.createdAt).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortActiveCourierOrders(
  orders: AdminOrderRecord[],
): AdminOrderRecord[] {
  return [...orders].sort((firstOrder, secondOrder) => {
    const firstStatusOrder =
      ACTIVE_COURIER_STATUS_SORT_ORDER[firstOrder.status] ?? 99;
    const secondStatusOrder =
      ACTIVE_COURIER_STATUS_SORT_ORDER[secondOrder.status] ?? 99;

    if (firstStatusOrder !== secondStatusOrder) {
      return firstStatusOrder - secondStatusOrder;
    }

    return (
      getOrderSortTimestamp(secondOrder) - getOrderSortTimestamp(firstOrder)
    );
  });
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function getOrdersForCourier(courierId: string): AdminOrderRecord[] {
  const normalizedCourierId = courierId.trim();

  if (!normalizedCourierId) {
    return [];
  }

  return getAllOrders().filter(
    (order) => order.assignedCourierId === normalizedCourierId,
  );
}

export function isNewCourierAssignment(order: AdminOrderRecord): boolean {
  return order.status === "COURIER_ASSIGNED";
}

export function getActiveCourierOrders(courierId: string): AdminOrderRecord[] {
  const activeOrders = getOrdersForCourier(courierId).filter((order) =>
    ACTIVE_COURIER_ORDER_STATUSES.includes(order.status),
  );

  return sortActiveCourierOrders(activeOrders);
}

export function getDeliveredCourierOrders(
  courierId: string,
): AdminOrderRecord[] {
  return getOrdersForCourier(courierId)
    .filter((order) => order.status === "DELIVERED")
    .sort(
      (firstOrder, secondOrder) =>
        getOrderSortTimestamp(secondOrder) - getOrderSortTimestamp(firstOrder),
    );
}
