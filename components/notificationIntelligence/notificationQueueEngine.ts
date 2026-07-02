// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Notification queue
// ==================================================
import type {
  NotificationPriority,
  NotificationQueueItem,
  NotificationStatus,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export const NOTIFICATION_QUEUE_STORAGE_KEY =
  "bellaflore_notification_intelligence_queue_v1";

let inMemoryQueue: NotificationQueueItem[] = [];

function readQueueFromStorage(): NotificationQueueItem[] {
  if (typeof window === "undefined") {
    return inMemoryQueue;
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_QUEUE_STORAGE_KEY);
    if (!raw) {
      return inMemoryQueue;
    }

    const parsed = JSON.parse(raw) as NotificationQueueItem[];
    return Array.isArray(parsed) ? parsed : inMemoryQueue;
  } catch {
    return inMemoryQueue;
  }
}

function writeQueueToStorage(items: NotificationQueueItem[]): void {
  inMemoryQueue = items;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(NOTIFICATION_QUEUE_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // In-memory fallback remains active.
  }
}

function saveQueueItem(item: NotificationQueueItem): NotificationQueueItem {
  const queue = readQueueFromStorage();
  const index = queue.findIndex((entry) => entry.id === item.id);
  const nextQueue =
    index === -1
      ? [...queue, item]
      : queue.map((entry, entryIndex) => (entryIndex === index ? item : entry));

  writeQueueToStorage(nextQueue);
  return item;
}

export function createNotification(item: NotificationQueueItem): NotificationQueueItem {
  const existing = readQueueFromStorage().find((entry) => entry.id === item.id);
  if (existing) {
    return existing;
  }

  return saveQueueItem(item);
}

export function createNotifications(items: NotificationQueueItem[]): NotificationQueueItem[] {
  return items.map((item) => createNotification(item));
}

export function markAsSent(notificationId: string): NotificationQueueItem | null {
  const item = readQueueFromStorage().find((entry) => entry.id === notificationId);
  if (!item) {
    return null;
  }

  const now = new Date().toISOString();
  return saveQueueItem({
    ...item,
    status: "sent",
    sentAt: now,
    updatedAt: now,
    lastError: null,
  });
}

export function markAsFailed(
  notificationId: string,
  errorMessage: string,
): NotificationQueueItem | null {
  const item = readQueueFromStorage().find((entry) => entry.id === notificationId);
  if (!item) {
    return null;
  }

  const now = new Date().toISOString();
  return saveQueueItem({
    ...item,
    status: "failed",
    failedAt: now,
    updatedAt: now,
    lastError: errorMessage,
  });
}

export function cancelNotification(notificationId: string): NotificationQueueItem | null {
  const item = readQueueFromStorage().find((entry) => entry.id === notificationId);
  if (!item) {
    return null;
  }

  const now = new Date().toISOString();
  return saveQueueItem({
    ...item,
    status: "cancelled",
    cancelledAt: now,
    updatedAt: now,
  });
}

export function listPendingNotifications(now: Date = new Date()): NotificationQueueItem[] {
  const timestamp = now.getTime();

  return readQueueFromStorage()
    .filter(
      (item) =>
        item.status === "pending" && Date.parse(item.scheduledAt) <= timestamp,
    )
    .sort(
      (left, right) => Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt),
    );
}

export function listAllNotifications(): NotificationQueueItem[] {
  return readQueueFromStorage().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function retryNotification(notificationId: string): NotificationQueueItem | null {
  const item = readQueueFromStorage().find((entry) => entry.id === notificationId);
  if (!item) {
    return null;
  }

  const now = new Date().toISOString();
  return saveQueueItem({
    ...item,
    status: "pending",
    scheduledAt: now,
    retryCount: item.retryCount + 1,
    updatedAt: now,
    lastError: null,
    failedAt: null,
  });
}

export function filterNotificationsByStatus(
  status: NotificationStatus,
): NotificationQueueItem[] {
  return listAllNotifications().filter((item) => item.status === status);
}

export function filterNotificationsByPriority(
  priority: NotificationPriority,
): NotificationQueueItem[] {
  return listAllNotifications().filter((item) => item.priority === priority);
}

export function clearNotificationQueue(): void {
  inMemoryQueue = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(NOTIFICATION_QUEUE_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
  }
}

export function getNotificationById(
  notificationId: string,
): NotificationQueueItem | null {
  return readQueueFromStorage().find((item) => item.id === notificationId) ?? null;
}
