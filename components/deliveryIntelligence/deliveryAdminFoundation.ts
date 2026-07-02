// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Admin foundation
// ==================================================
import {
  assignDeliveryCourier,
  cancelDeliveryTask,
  getDeliveryTaskById,
  getDeliveryTaskByOrderId,
  listDeliveryTasks,
  rescheduleDeliveryTask,
  updateDeliveryStatus,
} from "@/components/deliveryIntelligence/deliveryTaskEngine";
import { getDeliveryStatusLabel } from "@/components/deliveryIntelligence/deliveryTimelineEngine";
import { predictDeliveryDelay } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import type {
  DeliveryListFilters,
  DeliveryStatus,
  DeliveryTask,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export type AdminDeliveryListItem = {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  statusLabel: string;
  courierId: string | null;
  address: string;
  deliveryDate: string;
  deliveryInterval: string;
  etaLabel: string | null;
  delayRiskLevel: string;
};

export type AdminDeliveryDetails = DeliveryTask & {
  statusLabel: string;
  delayRisk: ReturnType<typeof predictDeliveryDelay>;
};

function matchesStatus(
  task: DeliveryTask,
  status?: DeliveryListFilters["status"],
): boolean {
  if (!status) {
    return true;
  }

  if (Array.isArray(status)) {
    return status.includes(task.status);
  }

  return task.status === status;
}

export function filterDeliveries(
  tasks: DeliveryTask[],
  filters: DeliveryListFilters = {},
): DeliveryTask[] {
  return tasks.filter((task) => {
    if (!matchesStatus(task, filters.status)) {
      return false;
    }

    if (filters.courierId && task.courierId !== filters.courierId) {
      return false;
    }

    if (filters.deliveryDate && task.deliveryDate !== filters.deliveryDate) {
      return false;
    }

    if (filters.zoneId && task.deliveryZoneId !== filters.zoneId) {
      return false;
    }

    return true;
  });
}

export function listAdminDeliveries(
  filters: DeliveryListFilters = {},
): AdminDeliveryListItem[] {
  return filterDeliveries(listDeliveryTasks(), filters).map((task) => ({
    id: task.id,
    orderId: task.orderId,
    status: task.status,
    statusLabel: getDeliveryStatusLabel(task.status),
    courierId: task.courierId,
    address: task.address,
    deliveryDate: task.deliveryDate,
    deliveryInterval: task.deliveryInterval,
    etaLabel: task.eta?.estimatedArrivalLabel ?? null,
    delayRiskLevel: predictDeliveryDelay(task).level,
  }));
}

export function filterDeliveriesByStatus(
  status: DeliveryStatus | DeliveryStatus[],
): DeliveryTask[] {
  return filterDeliveries(listDeliveryTasks(), { status });
}

export function filterDeliveriesByCourier(courierId: string): DeliveryTask[] {
  return filterDeliveries(listDeliveryTasks(), { courierId });
}

export function getAdminDeliveryDetails(
  taskId: string,
): AdminDeliveryDetails | null {
  const task = getDeliveryTaskById(taskId);
  if (!task) {
    return null;
  }

  return {
    ...task,
    statusLabel: getDeliveryStatusLabel(task.status),
    delayRisk: predictDeliveryDelay(task),
  };
}

export function manuallyAssignDeliveryCourier(
  taskId: string,
  courierId: string,
  courierName: string,
): AdminDeliveryDetails | null {
  const assigned = assignDeliveryCourier(taskId, {
    courierId,
    courierName,
    assignedAt: new Date().toISOString(),
    deliveryEta: null,
  });

  return assigned ? getAdminDeliveryDetails(taskId) : null;
}

export function manuallyRescheduleDelivery(
  taskId: string,
  deliveryDate: string,
  deliveryInterval: string,
): AdminDeliveryDetails | null {
  const rescheduled = rescheduleDeliveryTask(taskId, deliveryDate, deliveryInterval);
  return rescheduled ? getAdminDeliveryDetails(taskId) : null;
}

export function markDeliveryDelivered(taskId: string): AdminDeliveryDetails | null {
  const updated = updateDeliveryStatus(taskId, "delivered", "Доставка завершена");
  return updated ? getAdminDeliveryDetails(taskId) : null;
}

export function markDeliveryFailed(
  taskId: string,
  reason = "Доставка не выполнена",
): AdminDeliveryDetails | null {
  const updated = updateDeliveryStatus(taskId, "failed", reason);
  return updated ? getAdminDeliveryDetails(taskId) : null;
}

export function getAdminDeliveryDetailsByOrderId(
  orderId: string,
): AdminDeliveryDetails | null {
  const task = getDeliveryTaskByOrderId(orderId);
  return task ? getAdminDeliveryDetails(task.id) : null;
}

export function cancelAdminDelivery(taskId: string, reason?: string) {
  return cancelDeliveryTask(taskId, reason);
}
