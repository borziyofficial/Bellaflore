// ==================================================
// SECTION: STORAGE
// РАЗДЕЛ: Хранилище
//
// Purpose (EN): Persistence layer for deliveryOrchestration.
//
// Назначение (RU): Слой персистентности для deliveryOrchestration.
// ==================================================
import type { LogisticsOrder } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";

export const LOGISTICS_ORDERS_STORAGE_KEY = "bellaflore_logistics_orders_v1";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isLogisticsOrder(value: unknown): value is LogisticsOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LogisticsOrder>;

  return (
    typeof candidate.orderId === "string" &&
    candidate.orderId.trim().length > 0 &&
    typeof candidate.customerName === "string" &&
    typeof candidate.customerPhone === "string" &&
    typeof candidate.deliveryAddress === "string" &&
    typeof candidate.deliveryDate === "string" &&
    typeof candidate.deliveryInterval === "string" &&
    typeof candidate.deliveryStatus === "string" &&
    typeof candidate.courierStatus === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    candidate.deliveryConfidence !== undefined
  );
}

export function readLogisticsOrders(): LogisticsOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(LOGISTICS_ORDERS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isLogisticsOrder);
  } catch {
    return [];
  }
}

export function writeLogisticsOrders(orders: LogisticsOrder[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOGISTICS_ORDERS_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch {
    // In-memory logistics state still works if storage is blocked.
  }
}

export function saveLogisticsOrder(order: LogisticsOrder): LogisticsOrder[] {
  const existingOrders = readLogisticsOrders();
  const existingIndex = existingOrders.findIndex(
    (storedOrder) => storedOrder.orderId === order.orderId,
  );

  const nextOrders =
    existingIndex === -1
      ? [...existingOrders, order]
      : existingOrders.map((storedOrder, index) =>
          index === existingIndex ? order : storedOrder,
        );

  writeLogisticsOrders(nextOrders);
  return nextOrders;
}

export function findLogisticsOrderById(
  orderId: string,
  orders = readLogisticsOrders(),
): LogisticsOrder | null {
  return orders.find((order) => order.orderId === orderId) ?? null;
}
