// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import {
  createNotifications,
  listPendingNotifications,
} from "@/components/notificationIntelligence/notificationQueueEngine";
import {
  describeEscalationFlow,
  getExampleNewOrderEscalation,
} from "@/components/notificationIntelligence/notificationEscalationEngine";
import { processNotificationEvent } from "@/components/notificationIntelligence/notificationRuleEngine";
import { buildNewOrderNotificationEvent } from "@/components/notificationIntelligence/orderNotificationBridge";
import type { NotificationEvent } from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export function ingestNotificationEvent(event: NotificationEvent) {
  const queueItems = processNotificationEvent(event);
  const created = createNotifications(queueItems);

  return {
    event,
    queueItems: created,
    pendingCount: listPendingNotifications().length,
    generatedAt: new Date().toISOString(),
  };
}

export function runNotificationIntelligenceForOrder(orderId: string) {
  const event = buildNewOrderNotificationEvent(orderId);
  if (!event) {
    return null;
  }

  return ingestNotificationEvent(event);
}

export function getNotificationIntelligenceNewOrderExample() {
  const event = buildNewOrderNotificationEvent("BF-1001") ?? {
    id: "NEI-ORDER-new_order-BF-1001-example",
    kind: "new_order" as const,
    source: "order" as const,
    title: "new_order",
    payload: {
      orderId: "BF-1001",
      customerName: "Анна Иванова",
      phone: "+7 900 123-45-67",
      address: "Москва, ул. Тверская, 12",
      deliveryInterval: "14:00–16:00",
      deliveryPrice: 1890,
      status: "new",
    },
    occurredAt: new Date().toISOString(),
    orderId: "BF-1001",
  };

  const ingested = ingestNotificationEvent(event);

  return {
    event,
    queueItems: ingested.queueItems,
    escalation: getExampleNewOrderEscalation(),
    escalationFlow: describeEscalationFlow("new_order"),
  };
}

export function getNotificationIntelligenceSnapshot() {
  return {
    pending: listPendingNotifications(),
    generatedAt: new Date().toISOString(),
  };
}
