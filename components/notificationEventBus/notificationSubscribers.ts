// ==================================================
// SECTION: NOTIFICATION EVENT BUS
// РАЗДЕЛ: Шина событий уведомлений
//
// Purpose (EN): Pub/sub event bus bridging order lifecycle to CRM and Telegram.
//
// Назначение (RU): Pub/sub шина, связывающая жизненный цикл заказа с CRM и Telegram.
// ==================================================
import { getNotificationEventConfig } from "@/components/notificationEventBus/notificationEventConfig";
import {
  getNotificationEventAdminMessage,
  getNotificationEventAnalyticsEventName,
  getNotificationEventCourierMessage,
  getNotificationEventCustomerMessage,
  getNotificationEventTelegramMessage,
  getNotificationEventTitle,
} from "@/components/notificationEventBus/notificationEventMessages";
import type {
  NotificationChannelTarget,
  NotificationEvent,
  NotificationSubscriberDispatchResult,
  NotificationSubscriberHandler,
} from "@/components/notificationEventBus/notificationEventTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildBasePreparedPayload(
  event: NotificationEvent,
  channel: NotificationChannelTarget,
): Record<string, unknown> {
  return {
    channel,
    eventId: event.eventId,
    eventType: event.eventType,
    orderId: event.orderId,
    logisticsOrderId: event.logisticsOrderId,
    lifecycleOrderId: event.lifecycleOrderId,
    status: event.status,
    priority: event.priority,
    createdAt: event.createdAt,
    payload: event.payload,
  };
}

function createChannelSubscriber(
  channel: NotificationChannelTarget,
  configKey:
    | "telegramEnabled"
    | "crmEnabled"
    | "adminEnabled"
    | "customerEnabled"
    | "courierEnabled"
    | "analyticsEnabled",
  buildPayload: (event: NotificationEvent) => Record<string, unknown>,
): NotificationSubscriberHandler {
  return (event) => {
    const config = getNotificationEventConfig();

    if (!config.enabled) {
      return { status: "disabled", channel };
    }

    if (!config[configKey]) {
      return { status: "disabled", channel };
    }

    if (!event.channelTargets.includes(channel)) {
      return {
        status: "skipped",
        channel,
        reason: "Channel is not targeted for this event.",
      };
    }

    return {
      status: "prepared",
      channel,
      payload: buildPayload(event),
    };
  };
}

export const telegramSubscriber: NotificationSubscriberHandler =
  createChannelSubscriber("telegram", "telegramEnabled", (event) => ({
    ...buildBasePreparedPayload(event, "telegram"),
    message: getNotificationEventTelegramMessage(event.eventType),
    title: getNotificationEventTitle(event.eventType),
    deliveryMode: "future_telegram_bot",
  }));

export const crmSubscriber: NotificationSubscriberHandler = createChannelSubscriber(
  "crm",
  "crmEnabled",
  (event) => ({
    ...buildBasePreparedPayload(event, "crm"),
    queueAction: "enqueue_order_event",
    title: getNotificationEventTitle(event.eventType),
    adminMessage: getNotificationEventAdminMessage(event.eventType),
  }),
);

export const adminSubscriber: NotificationSubscriberHandler =
  createChannelSubscriber("admin", "adminEnabled", (event) => ({
    ...buildBasePreparedPayload(event, "admin"),
    notificationType: "admin_panel_feed",
    title: getNotificationEventTitle(event.eventType),
    message: getNotificationEventAdminMessage(event.eventType),
  }));

export const customerSubscriber: NotificationSubscriberHandler =
  createChannelSubscriber("customer", "customerEnabled", (event) => ({
    ...buildBasePreparedPayload(event, "customer"),
    notificationType: "order_tracking_update",
    title: getNotificationEventTitle(event.eventType),
    message: getNotificationEventCustomerMessage(event.eventType),
  }));

export const courierSubscriber: NotificationSubscriberHandler =
  createChannelSubscriber("courier", "courierEnabled", (event) => ({
    ...buildBasePreparedPayload(event, "courier"),
    notificationType: "courier_app_update",
    title: getNotificationEventTitle(event.eventType),
    message: getNotificationEventCourierMessage(event.eventType),
  }));

export const analyticsSubscriber: NotificationSubscriberHandler =
  createChannelSubscriber("analytics", "analyticsEnabled", (event) => ({
    ...buildBasePreparedPayload(event, "analytics"),
    eventName: getNotificationEventAnalyticsEventName(event.eventType),
    trackingMode: "future_analytics_pipeline",
  }));

export const NOTIFICATION_SUBSCRIBERS: Record<
  NotificationChannelTarget,
  NotificationSubscriberHandler
> = {
  telegram: telegramSubscriber,
  crm: crmSubscriber,
  admin: adminSubscriber,
  customer: customerSubscriber,
  courier: courierSubscriber,
  analytics: analyticsSubscriber,
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function dispatchNotificationEventToSubscribers(
  event: NotificationEvent,
): NotificationSubscriberDispatchResult[] {
  return event.channelTargets.map((channel) =>
    NOTIFICATION_SUBSCRIBERS[channel](event),
  );
}
