// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import { assignOrderCourier } from "@/components/admin/assignOrderCourier";
import {
  findOrderById,
  patchStoredAdminOrder,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import { getOrderStatus, type OrderStatusId } from "@/components/orders/orderStatus";
import { updateOrderStatus } from "@/components/orders/updateOrderStatus";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type BulkAdminOrdersResult = {
  updatedCount: number;
  failedCount: number;
  errors: string[];
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function normalizeOrderIds(orderIds: string[]): string[] {
  return [...new Set(orderIds.map((orderId) => orderId.trim()).filter(Boolean))];
}

function resolveOrders(orderIds: string[]): AdminOrderRecord[] {
  return normalizeOrderIds(orderIds)
    .map((orderId) => findOrderById(orderId))
    .filter((order): order is AdminOrderRecord => order !== null);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function bulkUpdateOrderStatus(
  orderIds: string[],
  nextStatus: OrderStatusId,
): BulkAdminOrdersResult {
  const orders = resolveOrders(orderIds);
  const errors: string[] = [];
  let updatedCount = 0;
  let failedCount = 0;

  for (const order of orders) {
    const result = updateOrderStatus(order, nextStatus, {
      updatedBy: "Admin",
      source: "admin",
      visibleToCustomer: true,
    });

    if (!result.ok) {
      failedCount += 1;
      errors.push(`${order.orderId}: ${result.error}`);
      continue;
    }

    const saved = patchStoredAdminOrder(order.orderId, {
      status: result.order.status,
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
    });

    if (!saved) {
      failedCount += 1;
      errors.push(`${order.orderId}: Unable to save status update locally.`);
      continue;
    }

    updatedCount += 1;
  }

  return {
    updatedCount,
    failedCount,
    errors,
  };
}

export function bulkAssignCourier(
  orderIds: string[],
  courierId: string,
): BulkAdminOrdersResult {
  const orders = resolveOrders(orderIds);
  const errors: string[] = [];
  let updatedCount = 0;
  let failedCount = 0;

  for (const order of orders) {
    const result = assignOrderCourier(order, courierId);

    if (!result.ok) {
      failedCount += 1;
      errors.push(`${order.orderId}: ${result.error}`);
      continue;
    }

    const saved = patchStoredAdminOrder(order.orderId, {
      timeline: result.order.timeline,
      updatedAt: result.order.updatedAt,
      assignedCourierId: result.order.assignedCourierId,
      assignedCourierName: result.order.assignedCourierName,
      assignedCourierPhone: result.order.assignedCourierPhone,
    });

    if (!saved) {
      failedCount += 1;
      errors.push(`${order.orderId}: Unable to save courier assignment locally.`);
      continue;
    }

    updatedCount += 1;
  }

  return {
    updatedCount,
    failedCount,
    errors,
  };
}

export function bulkCancelOrders(orderIds: string[]): BulkAdminOrdersResult {
  const cancellableOrders = resolveOrders(orderIds).filter(
    (order) => getOrderStatus(order.status)?.id !== "CANCELLED",
  );

  if (cancellableOrders.length === 0) {
    return {
      updatedCount: 0,
      failedCount: orderIds.length,
      errors: ["No cancellable orders selected."],
    };
  }

  return bulkUpdateOrderStatus(
    cancellableOrders.map((order) => order.orderId),
    "CANCELLED",
  );
}
