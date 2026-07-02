// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Order store foundation
// ==================================================
import {
  appendTimelineEvent,
  buildTimelineEvent,
  seedInitialOrderTimeline,
  timelineKindForStatus,
} from "@/components/orderIntelligence/orderTimelineEngine";
import {
  handleOrderInventoryOnCancel,
  handleOrderInventoryOnDelivered,
} from "@/components/orderIntelligence/orderInventoryBridge";
import type {
  Order,
  OrderStatus,
  OrderTimelineEvent,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

export const ORDER_INTELLIGENCE_STORAGE_KEY = "bellaflore_order_intelligence_v1";

const TERMINAL_STATUSES = new Set<OrderStatus>([
  "delivered",
  "cancelled",
  "failed",
]);

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["new", "confirmed", "cancelled"],
  new: ["confirmed", "preparing", "cancelled", "failed"],
  confirmed: ["preparing", "cancelled", "failed"],
  preparing: ["ready", "cancelled", "failed"],
  ready: ["courier_assigned", "cancelled", "failed"],
  courier_assigned: ["in_delivery", "cancelled", "failed"],
  in_delivery: ["delivered", "cancelled", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

let inMemoryOrders: Order[] | null = null;

function readOrdersFromStorage(): Order[] {
  if (typeof window === "undefined") {
    return inMemoryOrders ?? [];
  }

  try {
    const raw = window.localStorage.getItem(ORDER_INTELLIGENCE_STORAGE_KEY);
    if (!raw) {
      return inMemoryOrders ?? [];
    }

    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return inMemoryOrders ?? [];
  }
}

function writeOrdersToStorage(orders: Order[]): void {
  inMemoryOrders = orders;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ORDER_INTELLIGENCE_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function saveOrderRecord(order: Order): Order {
  const orders = readOrdersFromStorage();
  const index = orders.findIndex((entry) => entry.id === order.id);
  const nextOrders =
    index === -1
      ? [...orders, order]
      : orders.map((entry, entryIndex) => (entryIndex === index ? order : entry));

  writeOrdersToStorage(nextOrders);
  return order;
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export function createOrder(order: Order): Order {
  const existing = getOrderById(order.id);
  if (existing) {
    return existing;
  }

  const seeded = seedInitialOrderTimeline({
    ...order,
    timeline: order.timeline ?? [],
    updatedAt: order.updatedAt ?? new Date().toISOString(),
  });

  return saveOrderRecord(seeded);
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message?: string,
): Order | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  if (!canTransitionOrderStatus(order.status, status)) {
    throw new Error(
      `Cannot transition order ${orderId} from ${order.status} to ${status}`,
    );
  }

  const now = new Date().toISOString();
  const event = buildTimelineEvent({
    orderId,
    kind: timelineKindForStatus(status),
    status,
    message: message ?? `Статус изменён на «${status}»`,
  });

  let nextOrder = appendTimelineEvent(
    {
      ...order,
      status,
      updatedAt: now,
      confirmedAt:
        status === "confirmed" ? now : order.confirmedAt ?? null,
      deliveredAt: status === "delivered" ? now : order.deliveredAt ?? null,
      cancelledAt: status === "cancelled" ? now : order.cancelledAt ?? null,
    },
    event,
  );

  if (status === "courier_assigned" && order.delivery.courierId) {
    nextOrder = {
      ...nextOrder,
      delivery: {
        ...nextOrder.delivery,
        assignedAt: nextOrder.delivery.assignedAt ?? now,
      },
    };
  }

  const saved = saveOrderRecord(nextOrder);

  if (status === "delivered") {
    handleOrderInventoryOnDelivered(orderId);
  }

  return saved;
}

export function addOrderTimelineEvent(
  orderId: string,
  event: Omit<OrderTimelineEvent, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): Order | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  const createdAt = event.createdAt ?? new Date().toISOString();
  const timelineEvent: OrderTimelineEvent = {
    id:
      event.id ??
      `OTE-${orderId}-${event.kind}-${Date.parse(createdAt)}`,
    kind: event.kind,
    status: event.status,
    title: event.title,
    message: event.message,
    createdAt,
    actorType: event.actorType,
    actorName: event.actorName,
    metadata: event.metadata,
  };

  const nextOrder = appendTimelineEvent(order, timelineEvent);
  return saveOrderRecord(nextOrder);
}

export function getOrderById(orderId: string): Order | null {
  return readOrdersFromStorage().find((order) => order.id === orderId) ?? null;
}

export function listOrders(): Order[] {
  return readOrdersFromStorage().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function cancelOrder(
  orderId: string,
  reason = "Заказ отменён",
): Order | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  if (TERMINAL_STATUSES.has(order.status)) {
    return order;
  }

  const cancelled = updateOrderStatus(orderId, "cancelled", reason);
  if (cancelled) {
    handleOrderInventoryOnCancel(orderId);
  }

  return cancelled;
}

export function patchOrder(orderId: string, patch: Partial<Order>): Order | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  return saveOrderRecord({
    ...order,
    ...patch,
    id: order.id,
    updatedAt: new Date().toISOString(),
  });
}

export function clearOrderIntelligenceStore(): void {
  inMemoryOrders = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(ORDER_INTELLIGENCE_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
  }
}
