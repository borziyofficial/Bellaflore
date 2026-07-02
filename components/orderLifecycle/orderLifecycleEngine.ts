// ==================================================
// SECTION: ORDER LIFECYCLE
// РАЗДЕЛ: Жизненный цикл заказа
//
// Purpose (EN): Order status transitions, storage, and lifecycle messaging.
//
// Назначение (RU): Переходы статусов, хранилище и сообщения жизненного цикла заказа.
// ==================================================
import type { LogisticsOrder } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";
import {
  getOrderLifecycleAdminMessage,
  getOrderLifecycleCourierMessage,
  getOrderLifecycleCreatedEventMessage,
  getOrderLifecycleCustomerMessage,
  getOrderLifecycleStatusChangeTitle,
  getOrderLifecycleTelegramMessage,
} from "@/components/orderLifecycle/orderLifecycleMessages";
import {
  canTransitionOrderLifecycleStatus,
  getOrderLifecycleStatusLabel,
} from "@/components/orderLifecycle/orderLifecycleStatuses";
import {
  findOrderLifecycleByOrderId,
  readOrderLifecycles,
  saveOrderLifecycle,
} from "@/components/orderLifecycle/orderLifecycleStorage";
import {
  publishOrderLifecycleCreatedNotification,
  publishOrderLifecycleStatusChangeNotification,
} from "@/components/notificationEventBus/orderLifecycleNotificationBridge";
import type {
  AddLifecycleEventInput,
  AddLifecycleEventResult,
  ChangeOrderLifecycleStatusResult,
  OrderLifecycle,
  OrderLifecycleActor,
  OrderLifecycleEvent,
  OrderLifecycleStatus,
  OrderLifecycleTimelineEntry,
} from "@/components/orderLifecycle/orderLifecycleTypes";

const SYSTEM_ACTOR: OrderLifecycleActor = {
  actorType: "system",
  actorId: null,
  actorName: "Bellaflore",
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createLifecycleEventId(
  orderId: string,
  eventIndex: number,
  createdAt: string,
): string {
  return `LCE-${orderId}-${eventIndex}-${Date.parse(createdAt)}`;
}

function createLifecycleOrderId(orderId: string): string {
  return `LFC-${orderId}`;
}

function buildLifecycleEvent(
  lifecycle: OrderLifecycle,
  input: AddLifecycleEventInput,
): OrderLifecycleEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const currentStatus = input.currentStatus ?? lifecycle.currentStatus;
  const previousStatus =
    input.previousStatus === undefined
      ? lifecycle.currentStatus
      : input.previousStatus;

  return {
    lifecycleEventId: createLifecycleEventId(
      lifecycle.orderId,
      lifecycle.events.length,
      createdAt,
    ),
    eventType: input.eventType,
    eventTitle: input.eventTitle,
    eventMessage: input.eventMessage,
    currentStatus,
    previousStatus,
    actorType: input.actor.actorType,
    actorId: input.actor.actorId,
    actorName: input.actor.actorName,
    createdAt,
    metadata: input.metadata ?? {},
  };
}

function sortLifecycleEvents(
  events: OrderLifecycleEvent[],
): OrderLifecycleEvent[] {
  return [...events].sort(
    (leftEvent, rightEvent) =>
      Date.parse(leftEvent.createdAt) - Date.parse(rightEvent.createdAt),
  );
}

function enrichTimelineEntry(
  event: OrderLifecycleEvent,
): OrderLifecycleTimelineEntry {
  return {
    ...event,
    statusLabel: getOrderLifecycleStatusLabel(event.currentStatus),
    customerMessage: getOrderLifecycleCustomerMessage(event.currentStatus),
    adminMessage: getOrderLifecycleAdminMessage(event.currentStatus),
    courierMessage: getOrderLifecycleCourierMessage(event.currentStatus),
    telegramMessage: getOrderLifecycleTelegramMessage(event.currentStatus),
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createOrderLifecycle(
  logisticsOrder: LogisticsOrder,
): OrderLifecycle {
  const now = new Date().toISOString();
  const initialStatus: OrderLifecycleStatus = "created";

  const lifecycle: OrderLifecycle = {
    lifecycleOrderId: createLifecycleOrderId(logisticsOrder.orderId),
    orderId: logisticsOrder.orderId,
    logisticsOrderId: logisticsOrder.orderId,
    currentStatus: initialStatus,
    previousStatus: null,
    events: [],
    createdAt: now,
    updatedAt: now,
  };

  const createdEvent = buildLifecycleEvent(lifecycle, {
    eventType: "status_change",
    eventTitle: "Заказ создан",
    eventMessage: getOrderLifecycleCreatedEventMessage(),
    actor: SYSTEM_ACTOR,
    currentStatus: initialStatus,
    previousStatus: null,
    metadata: {
      source: "checkout",
      logisticsDeliveryStatus: logisticsOrder.deliveryStatus,
      deliveryZoneId: logisticsOrder.deliveryZoneId,
      deliveryDate: logisticsOrder.deliveryDate,
      deliveryInterval: logisticsOrder.deliveryInterval,
    },
    createdAt: now,
  });

  return {
    ...lifecycle,
    events: [createdEvent],
    updatedAt: createdEvent.createdAt,
  };
}

export function createAndSaveOrderLifecycleFromLogisticsOrder(
  logisticsOrder: LogisticsOrder,
): OrderLifecycle {
  const existingLifecycle = findOrderLifecycleByOrderId(logisticsOrder.orderId);

  if (existingLifecycle) {
    return existingLifecycle;
  }

  const lifecycle = createOrderLifecycle(logisticsOrder);
  saveOrderLifecycle(lifecycle);
  publishOrderLifecycleCreatedNotification(lifecycle, logisticsOrder);
  return lifecycle;
}

export function addLifecycleEvent(
  orderId: string,
  event: AddLifecycleEventInput,
): AddLifecycleEventResult {
  const lifecycle = findOrderLifecycleByOrderId(orderId);

  if (!lifecycle) {
    return {
      ok: false,
      lifecycle: null,
      error: `Order lifecycle not found for ${orderId}.`,
    };
  }

  const nextEvent = buildLifecycleEvent(lifecycle, event);
  const nextLifecycle: OrderLifecycle = {
    ...lifecycle,
    currentStatus: nextEvent.currentStatus,
    previousStatus: lifecycle.currentStatus,
    events: sortLifecycleEvents([...lifecycle.events, nextEvent]),
    updatedAt: nextEvent.createdAt,
  };

  saveOrderLifecycle(nextLifecycle);

  return {
    ok: true,
    lifecycle: nextLifecycle,
    event: nextEvent,
  };
}

export function changeOrderStatus(
  orderId: string,
  nextStatus: OrderLifecycleStatus,
  actor: OrderLifecycleActor,
  metadata: Record<string, unknown> = {},
): ChangeOrderLifecycleStatusResult {
  const lifecycle = findOrderLifecycleByOrderId(orderId);

  if (!lifecycle) {
    return {
      ok: false,
      lifecycle: null,
      error: `Order lifecycle not found for ${orderId}.`,
    };
  }

  if (!canTransitionOrderLifecycleStatus(lifecycle.currentStatus, nextStatus)) {
    return {
      ok: false,
      lifecycle,
      error: `Cannot transition from ${lifecycle.currentStatus} to ${nextStatus}.`,
    };
  }

  const result = addLifecycleEvent(orderId, {
    eventType: "status_change",
    eventTitle: getOrderLifecycleStatusChangeTitle(nextStatus),
    eventMessage: getOrderLifecycleCustomerMessage(nextStatus),
    actor,
    currentStatus: nextStatus,
    previousStatus: lifecycle.currentStatus,
    metadata: {
      ...metadata,
      adminMessage: getOrderLifecycleAdminMessage(nextStatus),
      courierMessage: getOrderLifecycleCourierMessage(nextStatus),
      telegramMessage: getOrderLifecycleTelegramMessage(nextStatus),
    },
  });

  if (result.ok) {
    publishOrderLifecycleStatusChangeNotification(
      result.lifecycle,
      nextStatus,
      actor,
      typeof metadata.deliveryStatus === "string" ? metadata.deliveryStatus : null,
      metadata,
    );
  }

  return result;
}

export function getOrderLifecycle(orderId: string): OrderLifecycle | null {
  return findOrderLifecycleByOrderId(orderId);
}

export function getOrderTimeline(orderId: string): OrderLifecycleTimelineEntry[] {
  const lifecycle = findOrderLifecycleByOrderId(orderId);

  if (!lifecycle) {
    return [];
  }

  return sortLifecycleEvents(lifecycle.events).map(enrichTimelineEntry);
}

export function readAllOrderLifecycles(): OrderLifecycle[] {
  return readOrderLifecycles();
}

export function replaceOrderLifecycle(lifecycle: OrderLifecycle): OrderLifecycle {
  saveOrderLifecycle(lifecycle);
  return lifecycle;
}
