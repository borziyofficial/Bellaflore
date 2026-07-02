// ==================================================
// SECTION: NOTIFICATION EVENT BUS
// РАЗДЕЛ: Шина событий уведомлений
//
// Purpose (EN): Pub/sub event bus bridging order lifecycle to CRM and Telegram.
//
// Назначение (RU): Pub/sub шина, связывающая жизненный цикл заказа с CRM и Telegram.
// ==================================================
import { getNotificationEventConfig } from "@/components/notificationEventBus/notificationEventConfig";
import {
  getNotificationEventAdminMessage,
  getNotificationEventCustomerMessage,
  getNotificationEventTitle,
  getNotificationEventTypeFromOrderStatus,
} from "@/components/notificationEventBus/notificationEventMessages";
import {
  dispatchNotificationEventToSubscribers,
} from "@/components/notificationEventBus/notificationSubscribers";
import {
  findNotificationEventById,
  getNotificationEventsByOrderIdFromStorage,
  readNotificationEvents,
  saveNotificationEvent,
  writeNotificationEvents,
} from "@/components/notificationEventBus/notificationEventStorage";
import { processCrmNotificationEvent } from "@/components/crmCore/crmNotificationBridge";
import type {
  CreateNotificationEventInput,
  NotificationEvent,
  PublishNotificationEventResult,
} from "@/components/notificationEventBus/notificationEventTypes";

let notificationEventCounter = 0;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createNotificationEventId(orderId: string, createdAt: string): string {
  notificationEventCounter += 1;
  return `NEV-${orderId}-${Date.parse(createdAt)}-${notificationEventCounter}`;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createNotificationEvent(
  input: CreateNotificationEventInput,
): NotificationEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    eventId: createNotificationEventId(input.orderId, createdAt),
    eventType: input.eventType,
    sourceModule: input.sourceModule,
    orderId: input.orderId,
    logisticsOrderId: input.logisticsOrderId ?? null,
    lifecycleOrderId: input.lifecycleOrderId ?? null,
    status: input.status,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    payload: input.payload ?? {},
    createdAt,
    processedAt: null,
    deliveryStatus: input.deliveryStatus ?? null,
    priority: input.priority ?? "normal",
    channelTargets: [...input.channelTargets],
  };
}

export function publishNotificationEvent(
  event: NotificationEvent,
): PublishNotificationEventResult {
  const config = getNotificationEventConfig();

  if (!config.enabled) {
    return {
      event,
      subscriberResults: [],
    };
  }

  const storedEvent =
    config.persistEvents && typeof window !== "undefined"
      ? saveNotificationEvent(event).find(
          (stored) => stored.eventId === event.eventId,
        ) ?? event
      : event;

  if (storedEvent.channelTargets.includes("crm")) {
    processCrmNotificationEvent(storedEvent);
  }

  const subscriberResults = config.autoProcessEvents
    ? dispatchNotificationEventToSubscribers(storedEvent)
    : [];

  if (config.autoProcessEvents && subscriberResults.length > 0) {
    const processedEvent: NotificationEvent = {
      ...storedEvent,
      processedAt: new Date().toISOString(),
    };
    if (config.persistEvents && typeof window !== "undefined") {
      saveNotificationEvent(processedEvent);
    }

    return {
      event: processedEvent,
      subscriberResults,
    };
  }

  return {
    event: storedEvent,
    subscriberResults,
  };
}

export function getNotificationEvents(): NotificationEvent[] {
  return readNotificationEvents().sort(
    (leftEvent, rightEvent) =>
      Date.parse(rightEvent.createdAt) - Date.parse(leftEvent.createdAt),
  );
}

export function getNotificationEventsByOrderId(
  orderId: string,
): NotificationEvent[] {
  return getNotificationEventsByOrderIdFromStorage(orderId);
}

export function markNotificationEventProcessed(
  eventId: string,
): NotificationEvent | null {
  const existingEvent = findNotificationEventById(eventId);

  if (!existingEvent) {
    return null;
  }

  const processedEvent: NotificationEvent = {
    ...existingEvent,
    processedAt: new Date().toISOString(),
  };

  saveNotificationEvent(processedEvent);
  return processedEvent;
}

export function clearNotificationEvents(): void {
  writeNotificationEvents([]);
}

export function createAndPublishOrderStatusNotificationEvent(input: {
  status: string;
  sourceModule: CreateNotificationEventInput["sourceModule"];
  orderId: string;
  logisticsOrderId?: string | null;
  lifecycleOrderId?: string | null;
  actorType: CreateNotificationEventInput["actorType"];
  actorId?: string | null;
  actorName?: string | null;
  deliveryStatus?: string | null;
  priority?: CreateNotificationEventInput["priority"];
  channelTargets: CreateNotificationEventInput["channelTargets"];
  payload?: Record<string, unknown>;
}): PublishNotificationEventResult | null {
  const eventType = getNotificationEventTypeFromOrderStatus(input.status);

  if (!eventType) {
    return null;
  }

  const event = createNotificationEvent({
    eventType,
    sourceModule: input.sourceModule,
    orderId: input.orderId,
    logisticsOrderId: input.logisticsOrderId,
    lifecycleOrderId: input.lifecycleOrderId,
    status: input.status,
    actorType: input.actorType,
    actorId: input.actorId,
    actorName: input.actorName,
    deliveryStatus: input.deliveryStatus,
    priority: input.priority,
    channelTargets: input.channelTargets,
    payload: {
      title: getNotificationEventTitle(eventType),
      customerMessage: getNotificationEventCustomerMessage(eventType),
      adminMessage: getNotificationEventAdminMessage(eventType),
      ...input.payload,
    },
  });

  return publishNotificationEvent(event);
}
