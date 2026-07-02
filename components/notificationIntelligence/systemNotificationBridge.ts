// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: System notification bridge
// ==================================================
import type {
  NotificationEvent,
  NotificationSourceEventKind,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export function buildSystemNotificationEvent(
  kind: NotificationSourceEventKind,
  payload: Record<string, string | number | boolean | null>,
): NotificationEvent {
  const now = new Date().toISOString();

  return {
    id: `NEI-SYS-${kind}-${Date.parse(now)}`,
    kind,
    source: "system",
    title: kind,
    payload,
    occurredAt: now,
  };
}

export function buildTelegramFailedNotificationEvent(input: {
  orderId: string;
  errorMessage: string;
}): NotificationEvent {
  return buildSystemNotificationEvent("telegram_failed", {
    orderId: input.orderId,
    errorMessage: input.errorMessage,
  });
}

export function buildPaymentAttentionNotificationEvent(input: {
  orderId: string;
  customerName: string;
  phone: string;
  status: string;
}): NotificationEvent {
  return buildSystemNotificationEvent("payment_attention", {
    orderId: input.orderId,
    customerName: input.customerName,
    phone: input.phone,
    status: input.status,
  });
}

export function buildSystemDeliveryDelayNotificationEvent(input: {
  orderId: string;
  address: string;
  deliveryInterval: string;
}): NotificationEvent {
  return buildSystemNotificationEvent("delivery_delay", {
    orderId: input.orderId,
    address: input.address,
    deliveryInterval: input.deliveryInterval,
  });
}
