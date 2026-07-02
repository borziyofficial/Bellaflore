// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Order notification bridge
// ==================================================
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  NotificationEvent,
  NotificationEventPayload,
  NotificationSourceEventKind,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

const ORDER_STATUS_TO_EVENT: Partial<Record<string, NotificationSourceEventKind>> = {
  new: "new_order",
  confirmed: "order_confirmed",
  preparing: "order_preparing",
  ready: "order_ready",
  courier_assigned: "order_courier_assigned",
  in_delivery: "order_in_delivery",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
  failed: "order_failed",
};

function buildOrderPayload(orderId: string): NotificationEventPayload | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    customerName: order.customer.name,
    phone: order.customer.phone,
    address: order.delivery.address,
    deliveryInterval: order.delivery.deliveryInterval,
    courierName: order.delivery.courierName ?? "",
    deliveryPrice: order.payment.deliveryRub,
    status: order.status,
  };
}

function buildNotificationEvent(
  kind: NotificationSourceEventKind,
  orderId: string,
  payload: NotificationEventPayload,
): NotificationEvent {
  const now = new Date().toISOString();

  return {
    id: `NEI-ORDER-${kind}-${orderId}-${Date.parse(now)}`,
    kind,
    source: "order",
    title: kind,
    payload,
    occurredAt: now,
    orderId,
  };
}

export function buildOrderNotificationEvent(
  orderId: string,
  kind?: NotificationSourceEventKind,
): NotificationEvent | null {
  const payload = buildOrderPayload(orderId);
  if (!payload) {
    return null;
  }

  const order = getOrderById(orderId);
  const resolvedKind =
    kind ?? ORDER_STATUS_TO_EVENT[order?.status ?? ""] ?? "new_order";

  return buildNotificationEvent(resolvedKind, orderId, payload);
}

export function buildNewOrderNotificationEvent(
  orderId: string,
): NotificationEvent | null {
  return buildOrderNotificationEvent(orderId, "new_order");
}

export function buildOrderNotConfirmedNotificationEvent(
  orderId: string,
): NotificationEvent | null {
  const payload = buildOrderPayload(orderId);
  if (!payload) {
    return null;
  }

  return buildNotificationEvent("order_not_confirmed", orderId, payload);
}

export function buildDeliveryDelayNotificationEvent(
  orderId: string,
): NotificationEvent | null {
  const payload = buildOrderPayload(orderId);
  if (!payload) {
    return null;
  }

  return buildNotificationEvent("delivery_delay", orderId, payload);
}
