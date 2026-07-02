// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import {
  getAllOrders,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import type { OrderStatusId } from "@/components/orders/orderStatus";

const NEW_ORDER_STATUSES: OrderStatusId[] = ["CREATED"];

const ACTIVE_ORDER_STATUSES: OrderStatusId[] = [
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
];

const IN_DELIVERY_ORDER_STATUSES: OrderStatusId[] = ["OUT_FOR_DELIVERY"];

const DELIVERED_ORDER_STATUSES: OrderStatusId[] = ["DELIVERED"];

const CANCELLED_ORDER_STATUSES: OrderStatusId[] = ["CANCELLED"];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function countOrdersByStatus(
  orders: AdminOrderRecord[],
  statuses: OrderStatusId[],
): number {
  const statusSet = new Set(statuses);

  return orders.filter((order) => statusSet.has(order.status)).length;
}

function getNonCancelledOrders(orders: AdminOrderRecord[]): AdminOrderRecord[] {
  return orders.filter((order) => order.status !== "CANCELLED");
}

function sumOrderRevenue(orders: AdminOrderRecord[]): number {
  return orders.reduce((total, order) => total + order.totalPriceRub, 0);
}

function isCreatedToday(
  order: AdminOrderRecord,
  referenceDate: Date = new Date(),
): boolean {
  const createdAt = new Date(order.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  return (
    createdAt.getFullYear() === referenceDate.getFullYear() &&
    createdAt.getMonth() === referenceDate.getMonth() &&
    createdAt.getDate() === referenceDate.getDate()
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getTotalOrders(): number {
  return getAllOrders().length;
}

export function getNewOrdersCount(): number {
  return countOrdersByStatus(getAllOrders(), NEW_ORDER_STATUSES);
}

export function getActiveOrdersCount(): number {
  return countOrdersByStatus(getAllOrders(), ACTIVE_ORDER_STATUSES);
}

export function getDeliveredOrdersCount(): number {
  return countOrdersByStatus(getAllOrders(), DELIVERED_ORDER_STATUSES);
}

export function getCancelledOrdersCount(): number {
  return countOrdersByStatus(getAllOrders(), CANCELLED_ORDER_STATUSES);
}

export function getOrdersInDeliveryCount(): number {
  return countOrdersByStatus(getAllOrders(), IN_DELIVERY_ORDER_STATUSES);
}

export function getTodayOrdersCount(): number {
  const orders = getAllOrders();

  return orders.filter((order) => isCreatedToday(order)).length;
}

export function getTodayRevenue(): number {
  const orders = getAllOrders();
  const todayOrders = orders.filter((order) => isCreatedToday(order));

  return sumOrderRevenue(getNonCancelledOrders(todayOrders));
}

export function getTotalRevenue(): number {
  return sumOrderRevenue(getNonCancelledOrders(getAllOrders()));
}

export function getAverageOrderValue(): number {
  const nonCancelledOrders = getNonCancelledOrders(getAllOrders());

  if (nonCancelledOrders.length === 0) {
    return 0;
  }

  return sumOrderRevenue(nonCancelledOrders) / nonCancelledOrders.length;
}
