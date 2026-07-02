// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Заказы
//
// Purpose (EN):
// Customer-facing order timeline event builders and labels.
//
// Назначение (RU):
// Сборка событий и подписей таймлайна заказа для клиента.
// ==================================================
import {
  getOrderStatus,
  type OrderStatusId,
} from "@/components/orders/orderStatus";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type OrderTimelineSource =
  | "customer"
  | "admin"
  | "courier"
  | "system"
  | "robot";

export type OrderTimelineEvent = {
  status: OrderStatusId;
  createdAt: string;
  updatedBy: string;
  note: string;
  source: OrderTimelineSource;
  visibleToCustomer: boolean;
};

export type CreateTimelineEventInput = {
  status: string;
  updatedBy: string;
  note?: string;
  source: OrderTimelineSource;
  visibleToCustomer?: boolean;
  createdAt?: string | Date;
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
function normalizeTimelineTimestamp(createdAt: string | Date = new Date()): string {
  const timestamp =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(timestamp.getTime())) {
    return new Date().toISOString();
  }

  return timestamp.toISOString();
}

function isOrderTimelineEvent(
  event: OrderTimelineEvent | CreateTimelineEventInput,
): event is OrderTimelineEvent {
  return (
    typeof event.createdAt === "string" &&
    typeof event.visibleToCustomer === "boolean" &&
    getOrderStatus(event.status) !== null
  );
}

function compareTimelineEvents(
  firstEvent: OrderTimelineEvent,
  secondEvent: OrderTimelineEvent,
): number {
  return (
    new Date(firstEvent.createdAt).getTime() -
    new Date(secondEvent.createdAt).getTime()
  );
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
export function sortTimelineEvents(
  timeline: OrderTimelineEvent[],
): OrderTimelineEvent[] {
  return [...timeline].sort(compareTimelineEvents);
}

export function createTimelineEvent(
  input: CreateTimelineEventInput,
): OrderTimelineEvent | null {
  const statusDefinition = getOrderStatus(input.status);

  if (!statusDefinition) {
    return null;
  }

  const updatedBy = input.updatedBy.trim();

  if (!updatedBy) {
    return null;
  }

  return {
    status: statusDefinition.id,
    createdAt: normalizeTimelineTimestamp(input.createdAt),
    updatedBy,
    note: input.note?.trim() ?? "",
    source: input.source,
    visibleToCustomer: input.visibleToCustomer ?? true,
  };
}

export function appendTimelineEvent(
  timeline: OrderTimelineEvent[],
  event: OrderTimelineEvent | CreateTimelineEventInput,
): OrderTimelineEvent[] {
  const nextEvent = isOrderTimelineEvent(event)
    ? event
    : createTimelineEvent(event);

  if (!nextEvent) {
    return timeline;
  }

  return sortTimelineEvents([...timeline, nextEvent]);
}

export function getLatestTimelineStatus(
  timeline: OrderTimelineEvent[],
): OrderStatusId | null {
  if (timeline.length === 0) {
    return null;
  }

  const latestEvent = sortTimelineEvents(timeline).at(-1);

  return latestEvent?.status ?? null;
}

export function getVisibleTimeline(
  timeline: OrderTimelineEvent[],
): OrderTimelineEvent[] {
  return sortTimelineEvents(timeline).filter(
    (event) => event.visibleToCustomer,
  );
}
