// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Delivery bridge (read-only)
// ==================================================
import { buildAdminDeliverySummary } from "@/components/adminIntelligence/adminDeliveryBridge";
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";
import { predictDeliveryDelay } from "@/components/deliveryIntelligence/deliveryEtaEngine";

export type AiDeliveryBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminDeliverySummary>;
  delayedTaskIds: string[];
  activeTaskIds: string[];
  generatedAt: string;
};

export function readAiDeliverySnapshot(): AiDeliveryBridgeSnapshot {
  const summary = buildAdminDeliverySummary(8);
  const tasks = listDeliveryTasks();

  const delayedTaskIds = tasks
    .filter((task) => {
      const risk = predictDeliveryDelay(task);
      return risk.level === "high" || risk.level === "critical";
    })
    .map((task) => task.id);

  const activeTaskIds = tasks
    .filter(
      (task) =>
        task.status !== "delivered" &&
        task.status !== "cancelled" &&
        task.status !== "failed",
    )
    .map((task) => task.id);

  return {
    summary,
    delayedTaskIds,
    activeTaskIds,
    generatedAt: new Date().toISOString(),
  };
}
