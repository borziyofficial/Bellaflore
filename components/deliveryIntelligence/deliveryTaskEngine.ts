// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Delivery task engine
// ==================================================
import {
  appendDeliveryTimelineEvent,
  buildDeliveryTimelineEvent,
  timelineKindForStatus,
} from "@/components/deliveryIntelligence/deliveryTimelineEngine";
import { calculateDeliveryEta } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import type {
  DeliveryAssignment,
  DeliveryPriority,
  DeliveryStatus,
  DeliveryTask,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export const DELIVERY_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_delivery_intelligence_v1";

const TERMINAL_STATUSES = new Set<DeliveryStatus>([
  "delivered",
  "failed",
  "cancelled",
]);

let inMemoryTasks: DeliveryTask[] = [];

function readTasksFromStorage(): DeliveryTask[] {
  if (typeof window === "undefined") {
    return inMemoryTasks;
  }

  try {
    const raw = window.localStorage.getItem(DELIVERY_INTELLIGENCE_STORAGE_KEY);
    if (!raw) {
      return inMemoryTasks;
    }

    const parsed = JSON.parse(raw) as DeliveryTask[];
    return Array.isArray(parsed) ? parsed : inMemoryTasks;
  } catch {
    return inMemoryTasks;
  }
}

function writeTasksToStorage(tasks: DeliveryTask[]): void {
  inMemoryTasks = tasks;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      DELIVERY_INTELLIGENCE_STORAGE_KEY,
      JSON.stringify(tasks),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function saveTask(task: DeliveryTask): DeliveryTask {
  const tasks = readTasksFromStorage();
  const index = tasks.findIndex((entry) => entry.id === task.id);
  const nextTasks =
    index === -1
      ? [...tasks, task]
      : tasks.map((entry, entryIndex) => (entryIndex === index ? task : entry));

  writeTasksToStorage(nextTasks);
  return task;
}

function createTaskId(orderId: string): string {
  return `DLV-${orderId}`;
}

function seedTimeline(task: DeliveryTask): DeliveryTask {
  const event = buildDeliveryTimelineEvent({
    taskId: task.id,
    kind: "delivery_created",
    status: task.status,
    message: `Доставка создана для заказа ${task.orderId}`,
  });

  return {
    ...task,
    timeline: appendDeliveryTimelineEvent(task.timeline, event),
  };
}

export function createDeliveryTask(task: DeliveryTask): DeliveryTask {
  const existing = getDeliveryTaskByOrderId(task.orderId);
  if (existing) {
    return existing;
  }

  const withEta = {
    ...task,
    eta:
      task.eta ??
      calculateDeliveryEta({
        coordinates: task.coordinates,
        courierId: task.courierId,
        deliveryZoneId: task.deliveryZoneId,
        deliveryInterval: task.deliveryInterval,
        priority: task.priority,
      }),
  };

  return saveTask(seedTimeline(withEta));
}

export function updateDeliveryStatus(
  taskId: string,
  status: DeliveryStatus,
  message?: string,
): DeliveryTask | null {
  const task = readTasksFromStorage().find((entry) => entry.id === taskId);
  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  const event = buildDeliveryTimelineEvent({
    taskId,
    kind: timelineKindForStatus(status),
    status,
    message,
  });

  const nextTask: DeliveryTask = {
    ...task,
    status,
    updatedAt: now,
    deliveredAt: status === "delivered" ? now : task.deliveredAt,
    cancelledAt: status === "cancelled" ? now : task.cancelledAt,
    timeline: appendDeliveryTimelineEvent(task.timeline, event),
  };

  return saveTask(nextTask);
}

export function getDeliveryTaskByOrderId(orderId: string): DeliveryTask | null {
  return readTasksFromStorage().find((task) => task.orderId === orderId) ?? null;
}

export function getDeliveryTaskById(taskId: string): DeliveryTask | null {
  return readTasksFromStorage().find((task) => task.id === taskId) ?? null;
}

export function listDeliveryTasks(): DeliveryTask[] {
  return readTasksFromStorage().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function cancelDeliveryTask(
  taskId: string,
  reason = "Доставка отменена",
): DeliveryTask | null {
  const task = getDeliveryTaskById(taskId);
  if (!task || TERMINAL_STATUSES.has(task.status)) {
    return task;
  }

  return updateDeliveryStatus(taskId, "cancelled", reason);
}

export function rescheduleDeliveryTask(
  taskId: string,
  deliveryDate: string,
  deliveryInterval: string,
): DeliveryTask | null {
  const task = getDeliveryTaskById(taskId);
  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  const event = buildDeliveryTimelineEvent({
    taskId,
    kind: "rescheduled",
    status: "rescheduled",
    message: `Доставка перенесена на ${deliveryDate} ${deliveryInterval}`,
    actorType: "admin",
    actorName: "Admin",
  });

  const nextTask: DeliveryTask = {
    ...task,
    deliveryDate,
    deliveryInterval,
    status: "rescheduled",
    updatedAt: now,
    eta: calculateDeliveryEta({
      coordinates: task.coordinates,
      courierId: task.courierId,
      deliveryZoneId: task.deliveryZoneId,
      deliveryInterval,
      priority: task.priority,
    }),
    timeline: appendDeliveryTimelineEvent(task.timeline, event),
  };

  return saveTask(nextTask);
}

export function assignDeliveryCourier(
  taskId: string,
  assignment: DeliveryAssignment,
): DeliveryTask | null {
  const task = getDeliveryTaskById(taskId);
  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  const event = buildDeliveryTimelineEvent({
    taskId,
    kind: "courier_assigned",
    status: "courier_assigned",
    message: `Курьер ${assignment.courierName} назначен`,
    actorType: "admin",
    actorName: "Admin",
  });

  const nextTask: DeliveryTask = {
    ...task,
    courierId: assignment.courierId,
    status: "courier_assigned",
    assignment,
    updatedAt: now,
    eta: assignment.deliveryEta ?? task.eta,
    timeline: appendDeliveryTimelineEvent(task.timeline, event),
  };

  return saveTask(nextTask);
}

export function clearDeliveryIntelligenceStore(): void {
  inMemoryTasks = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(DELIVERY_INTELLIGENCE_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
  }
}

export function buildDeliveryTaskId(orderId: string): string {
  return createTaskId(orderId);
}

export function mapOrderPriorityToDeliveryPriority(
  totalRub: number,
): DeliveryPriority {
  if (totalRub >= 30000) {
    return "urgent";
  }

  if (totalRub >= 20000) {
    return "high";
  }

  if (totalRub < 10000) {
    return "low";
  }

  return "normal";
}
