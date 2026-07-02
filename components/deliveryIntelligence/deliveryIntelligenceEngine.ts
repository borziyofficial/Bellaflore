// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import { listAdminDeliveries } from "@/components/deliveryIntelligence/deliveryAdminFoundation";
import {
  getExampleDeliveryDelayRisk,
  getExampleDeliveryEta,
} from "@/components/deliveryIntelligence/deliveryEtaEngine";
import { listDeliveryNotificationPayloads } from "@/components/deliveryIntelligence/notificationDeliveryBridge";
import {
  createDeliveryTaskFromOrder,
  getExampleDeliveryTask,
} from "@/components/deliveryIntelligence/orderDeliveryBridge";
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";

export function runDeliveryIntelligenceEngine() {
  return {
    tasks: listDeliveryTasks(),
    adminDeliveries: listAdminDeliveries(),
    generatedAt: new Date().toISOString(),
  };
}

export function getDeliveryIntelligenceExample() {
  const task = getExampleDeliveryTask();
  const eta = getExampleDeliveryEta();
  const delayRisk = getExampleDeliveryDelayRisk();
  const notificationPayloads = listDeliveryNotificationPayloads(task);

  return {
    task,
    eta,
    delayRisk,
    notificationPayloads,
  };
}

export function bootstrapDeliveryTaskForOrder(orderId: string) {
  return createDeliveryTaskFromOrder(orderId);
}

export function getDeliveryIntelligenceSnapshot(orderId: string) {
  const task =
    bootstrapDeliveryTaskForOrder(orderId) ?? getExampleDeliveryTask();

  return {
    task,
    eta: task.eta,
    delayRisk: getExampleDeliveryDelayRisk(),
    notificationPayloads: listDeliveryNotificationPayloads(task),
  };
}
