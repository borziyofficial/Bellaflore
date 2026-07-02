// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Notification delivery bridge
// ==================================================
import { predictDeliveryDelay } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import type {
  DeliveryNotificationEventKind,
  DeliveryNotificationPayload,
  DeliveryStatus,
  DeliveryTask,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

const STATUS_TO_NOTIFICATION: Partial<
  Record<DeliveryStatus, DeliveryNotificationEventKind>
> = {
  pending: "delivery_created",
  scheduled: "delivery_created",
  courier_assigned: "delivery_courier_assigned",
  preparing_pickup: "delivery_started",
  picked_up: "delivery_started",
  in_transit: "delivery_started",
  near_recipient: "delivery_near_recipient",
  delivered: "delivery_delivered",
  failed: "delivery_failed",
  rescheduled: "delivery_rescheduled",
  cancelled: "delivery_failed",
};

function buildBasePayload(task: DeliveryTask): DeliveryNotificationPayload["payload"] {
  return {
    orderId: task.orderId,
    courierId: task.courierId,
    courierName: task.assignment?.courierName ?? "",
    address: task.address,
    deliveryInterval: task.deliveryInterval,
    deliveryDate: task.deliveryDate,
    status: task.status,
    deliveryZoneId: task.deliveryZoneId,
    etaLabel: task.eta?.estimatedArrivalLabel ?? "",
  };
}

export function buildDeliveryNotificationPayload(
  task: DeliveryTask,
  kind?: DeliveryNotificationEventKind,
): DeliveryNotificationPayload {
  const resolvedKind =
    kind ?? STATUS_TO_NOTIFICATION[task.status] ?? "delivery_created";

  return {
    kind: resolvedKind,
    orderId: task.orderId,
    courierId: task.courierId,
    address: task.address,
    deliveryInterval: task.deliveryInterval,
    status: task.status,
    message: `Delivery event ${resolvedKind} for ${task.orderId}`,
    payload: buildBasePayload(task),
  };
}

export function buildDeliveryDelayNotificationPayload(
  task: DeliveryTask,
): DeliveryNotificationPayload | null {
  const risk = predictDeliveryDelay(task);
  if (!risk.shouldNotify) {
    return null;
  }

  return {
    kind: "delivery_delay_detected",
    orderId: task.orderId,
    courierId: task.courierId,
    address: task.address,
    deliveryInterval: task.deliveryInterval,
    status: task.status,
    message: `Delivery delay risk: ${risk.reasons.join(", ")}`,
    payload: {
      ...buildBasePayload(task),
      delayLevel: risk.level,
      delayMinutesEstimate: risk.delayMinutesEstimate,
    },
  };
}

export function listDeliveryNotificationPayloads(
  task: DeliveryTask,
): DeliveryNotificationPayload[] {
  const payloads = [buildDeliveryNotificationPayload(task)];
  const delayPayload = buildDeliveryDelayNotificationPayload(task);

  if (delayPayload) {
    payloads.push(delayPayload);
  }

  return payloads;
}

export function mapDeliveryNotificationToOrderBridgePayload(
  payload: DeliveryNotificationPayload,
): Record<string, string | number | boolean | null> {
  return {
    orderId: payload.orderId,
    address: payload.address,
    deliveryInterval: payload.deliveryInterval,
    courierName: String(payload.payload.courierName ?? ""),
    status: payload.status,
    deliveryEventKind: payload.kind,
  };
}
