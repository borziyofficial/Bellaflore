// ==================================================
// SECTION: STORAGE
// РАЗДЕЛ: Хранилище
//
// Purpose (EN): Persistence layer for orderLifecycle.
//
// Назначение (RU): Слой персистентности для orderLifecycle.
// ==================================================
import type { OrderLifecycle } from "@/components/orderLifecycle/orderLifecycleTypes";

export const ORDER_LIFECYCLE_STORAGE_KEY = "bellaflore_order_lifecycle_v1";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isOrderLifecycle(value: unknown): value is OrderLifecycle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<OrderLifecycle>;

  return (
    typeof candidate.lifecycleOrderId === "string" &&
    candidate.lifecycleOrderId.trim().length > 0 &&
    typeof candidate.orderId === "string" &&
    candidate.orderId.trim().length > 0 &&
    typeof candidate.logisticsOrderId === "string" &&
    candidate.logisticsOrderId.trim().length > 0 &&
    typeof candidate.currentStatus === "string" &&
    Array.isArray(candidate.events) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

export function readOrderLifecycles(): OrderLifecycle[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ORDER_LIFECYCLE_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isOrderLifecycle);
  } catch {
    return [];
  }
}

export function writeOrderLifecycles(lifecycles: OrderLifecycle[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ORDER_LIFECYCLE_STORAGE_KEY,
      JSON.stringify(lifecycles),
    );
  } catch {
    // In-memory lifecycle state still works if storage is blocked.
  }
}

export function saveOrderLifecycle(lifecycle: OrderLifecycle): OrderLifecycle[] {
  const existingLifecycles = readOrderLifecycles();
  const existingIndex = existingLifecycles.findIndex(
    (storedLifecycle) => storedLifecycle.orderId === lifecycle.orderId,
  );

  const nextLifecycles =
    existingIndex === -1
      ? [...existingLifecycles, lifecycle]
      : existingLifecycles.map((storedLifecycle, index) =>
          index === existingIndex ? lifecycle : storedLifecycle,
        );

  writeOrderLifecycles(nextLifecycles);
  return nextLifecycles;
}

export function findOrderLifecycleByOrderId(
  orderId: string,
  lifecycles = readOrderLifecycles(),
): OrderLifecycle | null {
  return lifecycles.find((lifecycle) => lifecycle.orderId === orderId) ?? null;
}
