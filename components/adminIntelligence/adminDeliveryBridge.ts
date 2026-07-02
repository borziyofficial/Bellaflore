// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Delivery bridge (read-only)
// ==================================================
import { listAdminDeliveries } from "@/components/deliveryIntelligence/deliveryAdminFoundation";
import { predictDeliveryDelay } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";
import type { DeliveryStatus } from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export type AdminDeliveryBridgeSummary = {
  totalTasks: number;
  activeTasks: number;
  delayedTasks: number;
  completedToday: number;
  recentTasks: ReturnType<typeof listAdminDeliveries>;
  generatedAt: string;
};

const ACTIVE_DELIVERY_STATUSES = new Set<DeliveryStatus>([
  "scheduled",
  "courier_assigned",
  "preparing_pickup",
  "picked_up",
  "in_transit",
  "near_recipient",
]);

export function buildAdminDeliverySummary(
  limit = 5,
): AdminDeliveryBridgeSummary {
  const tasks = listDeliveryTasks();
  const today = new Date().toISOString().slice(0, 10);

  const activeTasks = tasks.filter((task) =>
    ACTIVE_DELIVERY_STATUSES.has(task.status),
  ).length;

  const delayedTasks = tasks.filter((task) => {
    const risk = predictDeliveryDelay(task);
    return risk.level === "high" || risk.level === "critical";
  }).length;

  const completedToday = tasks.filter(
    (task) =>
      task.status === "delivered" &&
      task.updatedAt.slice(0, 10) === today,
  ).length;

  return {
    totalTasks: tasks.length,
    activeTasks,
    delayedTasks,
    completedToday,
    recentTasks: listAdminDeliveries().slice(0, limit),
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminDeliveryAttentionCount(): number {
  const summary = buildAdminDeliverySummary(0);
  return summary.activeTasks + summary.delayedTasks;
}
