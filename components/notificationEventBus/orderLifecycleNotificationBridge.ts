// ==================================================
// SECTION: NOTIFICATION EVENT BUS
// РАЗДЕЛ: Шина событий уведомлений
//
// Purpose (EN): Pub/sub event bus bridging order lifecycle to CRM and Telegram.
//
// Назначение (RU): Pub/sub шина, связывающая жизненный цикл заказа с CRM и Telegram.
// ==================================================
import type { LogisticsOrder } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";
import { createAndPublishOrderStatusNotificationEvent } from "@/components/notificationEventBus/notificationEventBus";
import type {
  NotificationChannelTarget,
  PublishNotificationEventResult,
} from "@/components/notificationEventBus/notificationEventTypes";
import type {
  OrderLifecycle,
  OrderLifecycleActor,
  OrderLifecycleStatus,
} from "@/components/orderLifecycle/orderLifecycleTypes";

const CREATED_CHANNEL_TARGETS: NotificationChannelTarget[] = [
  "crm",
  "admin",
  "customer",
  "analytics",
];

const COURIER_CHANNEL_TARGETS: NotificationChannelTarget[] = [
  "crm",
  "admin",
  "customer",
  "courier",
  "analytics",
];

const DEFAULT_CHANNEL_TARGETS: NotificationChannelTarget[] = [
  "crm",
  "admin",
  "customer",
  "analytics",
];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getChannelTargetsForLifecycleStatus(
  status: OrderLifecycleStatus,
): NotificationChannelTarget[] {
  switch (status) {
    case "created":
      return CREATED_CHANNEL_TARGETS;
    case "assigned_to_courier":
    case "courier_on_the_way":
      return COURIER_CHANNEL_TARGETS;
    default:
      return DEFAULT_CHANNEL_TARGETS;
  }
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function publishOrderLifecycleCreatedNotification(
  lifecycle: OrderLifecycle,
  logisticsOrder?: LogisticsOrder | null,
): PublishNotificationEventResult | null {
  return createAndPublishOrderStatusNotificationEvent({
    status: "created",
    sourceModule: "orderLifecycle",
    orderId: lifecycle.orderId,
    logisticsOrderId: lifecycle.logisticsOrderId,
    lifecycleOrderId: lifecycle.lifecycleOrderId,
    actorType: "system",
    actorId: null,
    actorName: "Bellaflore",
    deliveryStatus: logisticsOrder?.deliveryStatus ?? null,
    priority: "normal",
    channelTargets: CREATED_CHANNEL_TARGETS,
    payload: {
      lifecycleEventId: lifecycle.events[0]?.lifecycleEventId ?? null,
      deliveryDate: logisticsOrder?.deliveryDate ?? null,
      deliveryInterval: logisticsOrder?.deliveryInterval ?? null,
      deliveryZoneId: logisticsOrder?.deliveryZoneId ?? null,
    },
  });
}

export function publishOrderLifecycleStatusChangeNotification(
  lifecycle: OrderLifecycle,
  status: OrderLifecycleStatus,
  actor: OrderLifecycleActor,
  deliveryStatus?: string | null,
  metadata: Record<string, unknown> = {},
): PublishNotificationEventResult | null {
  return createAndPublishOrderStatusNotificationEvent({
    status,
    sourceModule: "orderLifecycle",
    orderId: lifecycle.orderId,
    logisticsOrderId: lifecycle.logisticsOrderId,
    lifecycleOrderId: lifecycle.lifecycleOrderId,
    actorType: actor.actorType,
    actorId: actor.actorId,
    actorName: actor.actorName,
    deliveryStatus: deliveryStatus ?? null,
    priority: status === "failed" || status === "cancelled" ? "high" : "normal",
    channelTargets: getChannelTargetsForLifecycleStatus(status),
    payload: metadata,
  });
}
