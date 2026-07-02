// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Delivery bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  DeliveryAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { isDateWithinAnalyticsRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { readAiDeliverySnapshot } from "@/components/aiBrain/aiDeliveryBridge";
import { predictDeliveryDelay } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";

export function readAnalyticsDeliverySnapshot(range: AnalyticsTimeRange) {
  const snapshot = readAiDeliverySnapshot();
  const tasks = listDeliveryTasks().filter((task) =>
    isDateWithinAnalyticsRange(task.createdAt, range),
  );

  return {
    ...snapshot,
    tasksInRange: tasks.length,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateDeliveryAnalyticsMetrics(
  range: AnalyticsTimeRange,
): DeliveryAnalyticsMetrics {
  const snapshot = readAiDeliverySnapshot();
  const tasks = listDeliveryTasks().filter((task) =>
    isDateWithinAnalyticsRange(task.createdAt, range),
  );

  const delayedDeliveries = tasks.filter((task) => {
    const risk = predictDeliveryDelay(task);
    return risk.level === "high" || risk.level === "critical";
  }).length;

  const deliveredOnTime = tasks.filter(
    (task) => task.status === "delivered" && !snapshot.delayedTaskIds.includes(task.id),
  ).length;

  const etaValues = tasks
    .map((task) => task.eta?.estimatedMinutesMax ?? null)
    .filter((value): value is number => value != null);

  const averageEta =
    etaValues.length > 0
      ? Math.round(etaValues.reduce((sum, value) => sum + value, 0) / etaValues.length)
      : 45;

  const zoneMap = new Map<string, { taskCount: number; delayedCount: number }>();
  for (const task of tasks) {
    const zoneId = task.deliveryZoneId ?? "unknown";
    const entry = zoneMap.get(zoneId) ?? { taskCount: 0, delayedCount: 0 };
    entry.taskCount += 1;
    if (snapshot.delayedTaskIds.includes(task.id)) {
      entry.delayedCount += 1;
    }
    zoneMap.set(zoneId, entry);
  }

  const deliveryDelayRisk =
    tasks.length > 0
      ? Math.round((delayedDeliveries / tasks.length) * 1000) / 10
      : 0;

  return {
    totalDeliveries: tasks.length,
    activeDeliveries: snapshot.summary.activeTasks,
    deliveredOnTime,
    delayedDeliveries,
    averageEta,
    deliveryDelayRisk,
    zonePerformance: [...zoneMap.entries()].map(([zoneId, stats]) => ({
      zoneId,
      taskCount: stats.taskCount,
      delayedCount: stats.delayedCount,
    })),
  };
}
