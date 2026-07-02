// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Courier notification bridge
// ==================================================
import { getCourierProfileById } from "@/components/courierIntelligence/courierAdminFoundation";
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import type {
  NotificationEvent,
  NotificationEventPayload,
  NotificationSourceEventKind,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

function buildCourierPayload(
  courierId: string,
  orderId?: string | null,
): NotificationEventPayload {
  const courier = getCourierProfileById(courierId);
  const order = orderId ? getOrderById(orderId) : null;

  return {
    courierId,
    courierName: courier?.fullName ?? courierId,
    courierPhone: courier?.phone ?? "",
    orderId: order?.id ?? orderId ?? "",
    address: order?.delivery.address ?? "",
    status: courier?.status ?? "offline",
  };
}

export function buildCourierNotificationEvent(
  kind: NotificationSourceEventKind,
  courierId: string,
  orderId?: string | null,
): NotificationEvent {
  const now = new Date().toISOString();
  const payload = buildCourierPayload(courierId, orderId);

  return {
    id: `NEI-COURIER-${kind}-${courierId}-${Date.parse(now)}`,
    kind,
    source: "courier",
    title: kind,
    payload,
    occurredAt: now,
    orderId: orderId ?? null,
    courierId,
  };
}

export function buildCourierAssignedNotificationEvent(
  courierId: string,
  orderId: string,
): NotificationEvent {
  return buildCourierNotificationEvent("courier_assigned", courierId, orderId);
}

export function buildCourierDelayNotificationEvent(
  courierId: string,
  orderId: string,
): NotificationEvent {
  return buildCourierNotificationEvent("courier_delay_detected", courierId, orderId);
}
