// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for notificationEventBus.
//
// Назначение (RU): Пользовательские и служебные сообщения для notificationEventBus.
// ==================================================
import type { NotificationEventType } from "@/components/notificationEventBus/notificationEventTypes";

export type NotificationEventMessages = {
  title: string;
  customer: string;
  admin: string;
  courier: string;
  telegram: string;
  analytics: string;
};

export const NOTIFICATION_EVENT_MESSAGES: Record<
  NotificationEventType,
  NotificationEventMessages
> = {
  "order.created": {
    title: "Заказ создан",
    customer: "Ваш заказ создан и ожидает обработки",
    admin: "Новый заказ поступил в систему",
    courier: "Новый заказ пока не назначен",
    telegram: "🆕 Новый заказ создан",
    analytics: "order_created",
  },
  "order.accepted": {
    title: "Заказ принят",
    customer: "Заказ принят в работу",
    admin: "Заказ принят оператором",
    courier: "Заказ принят, ожидайте назначения",
    telegram: "✅ Заказ принят",
    analytics: "order_accepted",
  },
  "order.preparing": {
    title: "Сборка заказа",
    customer: "Букет собирается",
    admin: "Заказ на этапе сборки",
    courier: "Заказ готовится к передаче",
    telegram: "💐 Букет собирается",
    analytics: "order_preparing",
  },
  "order.ready_for_courier": {
    title: "Готов к передаче курьеру",
    customer: "Заказ готов к передаче курьеру",
    admin: "Можно назначить курьера",
    courier: "Заказ готов к получению",
    telegram: "📦 Заказ готов к передаче курьеру",
    analytics: "order_ready_for_courier",
  },
  "order.assigned_to_courier": {
    title: "Курьер назначен",
    customer: "Курьер назначен на ваш заказ",
    admin: "Курьер назначен на заказ",
    courier: "Вам назначен новый заказ",
    telegram: "🚚 Курьер назначен",
    analytics: "order_assigned_to_courier",
  },
  "order.courier_on_the_way": {
    title: "Курьер в пути",
    customer: "Курьер уже в пути",
    admin: "Курьер в пути к клиенту",
    courier: "Доставьте заказ клиенту",
    telegram: "🛵 Курьер в пути",
    analytics: "order_courier_on_the_way",
  },
  "order.delivered": {
    title: "Заказ доставлен",
    customer: "Заказ успешно доставлен",
    admin: "Заказ завершён",
    courier: "Заказ доставлен",
    telegram: "🎉 Заказ доставлен",
    analytics: "order_delivered",
  },
  "order.cancelled": {
    title: "Заказ отменён",
    customer: "Заказ отменён",
    admin: "Заказ отменён",
    courier: "Заказ отменён",
    telegram: "❌ Заказ отменён",
    analytics: "order_cancelled",
  },
  "order.failed": {
    title: "Ошибка заказа",
    customer: "При обработке заказа возникла ошибка",
    admin: "Заказ завершился с ошибкой",
    courier: "Заказ недоступен для доставки",
    telegram: "⚠️ Ошибка обработки заказа",
    analytics: "order_failed",
  },
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getNotificationEventTitle(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].title;
}

export function getNotificationEventCustomerMessage(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].customer;
}

export function getNotificationEventAdminMessage(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].admin;
}

export function getNotificationEventCourierMessage(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].courier;
}

export function getNotificationEventTelegramMessage(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].telegram;
}

export function getNotificationEventAnalyticsEventName(
  eventType: NotificationEventType,
): string {
  return NOTIFICATION_EVENT_MESSAGES[eventType].analytics;
}

export function getNotificationEventTypeFromOrderStatus(
  status: string,
): NotificationEventType | null {
  const eventType = `order.${status}`;

  if (eventType in NOTIFICATION_EVENT_MESSAGES) {
    return eventType as NotificationEventType;
  }

  return null;
}
