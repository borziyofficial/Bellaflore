// ==================================================
// SECTION: STORAGE
// РАЗДЕЛ: Хранилище
//
// Purpose (EN): Persistence layer for notificationEventBus.
//
// Назначение (RU): Слой персистентности для notificationEventBus.
// ==================================================
import type { NotificationEvent } from "@/components/notificationEventBus/notificationEventTypes";

export const NOTIFICATION_EVENTS_STORAGE_KEY =
  "bellaflore_notification_events_v1";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isNotificationEvent(value: unknown): value is NotificationEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NotificationEvent>;

  return (
    typeof candidate.eventId === "string" &&
    candidate.eventId.trim().length > 0 &&
    typeof candidate.eventType === "string" &&
    typeof candidate.sourceModule === "string" &&
    typeof candidate.orderId === "string" &&
    candidate.orderId.trim().length > 0 &&
    typeof candidate.status === "string" &&
    typeof candidate.actorType === "string" &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.channelTargets) &&
    candidate.payload !== undefined
  );
}

export function readNotificationEvents(): NotificationEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(NOTIFICATION_EVENTS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isNotificationEvent);
  } catch {
    return [];
  }
}

export function writeNotificationEvents(events: NotificationEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      NOTIFICATION_EVENTS_STORAGE_KEY,
      JSON.stringify(events),
    );
  } catch {
    // In-memory notification queue still works if storage is blocked.
  }
}

export function saveNotificationEvent(event: NotificationEvent): NotificationEvent[] {
  const existingEvents = readNotificationEvents();
  const existingIndex = existingEvents.findIndex(
    (storedEvent) => storedEvent.eventId === event.eventId,
  );

  const nextEvents =
    existingIndex === -1
      ? [...existingEvents, event]
      : existingEvents.map((storedEvent, index) =>
          index === existingIndex ? event : storedEvent,
        );

  writeNotificationEvents(nextEvents);
  return nextEvents;
}

export function findNotificationEventById(
  eventId: string,
  events = readNotificationEvents(),
): NotificationEvent | null {
  return events.find((event) => event.eventId === eventId) ?? null;
}

export function getNotificationEventsByOrderIdFromStorage(
  orderId: string,
  events = readNotificationEvents(),
): NotificationEvent[] {
  return events
    .filter((event) => event.orderId === orderId)
    .sort(
      (leftEvent, rightEvent) =>
        Date.parse(leftEvent.createdAt) - Date.parse(rightEvent.createdAt),
    );
}
