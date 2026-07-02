// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Template engine
// ==================================================
import type {
  NotificationEventPayload,
  NotificationSourceEventKind,
  NotificationTemplate,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl-new-order",
    eventKind: "new_order",
    title: "Новый заказ {{orderId}}",
    body: "Новый заказ {{orderId}} от {{customerName}} ({{phone}}). Адрес: {{address}}. Интервал: {{deliveryInterval}}.",
    channels: ["telegram", "in_app", "admin_sound"],
    variables: ["orderId", "customerName", "phone", "address", "deliveryInterval"],
  },
  {
    id: "tpl-order-confirmed",
    eventKind: "order_confirmed",
    title: "Заказ {{orderId}} подтверждён",
    body: "Заказ {{orderId}} подтверждён. Статус: {{status}}.",
    channels: ["in_app", "telegram"],
    variables: ["orderId", "status"],
  },
  {
    id: "tpl-courier-assigned",
    eventKind: "order_courier_assigned",
    title: "Курьер назначен на {{orderId}}",
    body: "На заказ {{orderId}} назначен курьер {{courierName}}.",
    channels: ["in_app", "telegram"],
    variables: ["orderId", "courierName"],
  },
  {
    id: "tpl-order-in-delivery",
    eventKind: "order_in_delivery",
    title: "Заказ {{orderId}} в пути",
    body: "Заказ {{orderId}} передан курьеру {{courierName}} и уже в доставке.",
    channels: ["in_app", "push"],
    variables: ["orderId", "courierName"],
  },
  {
    id: "tpl-order-delivered",
    eventKind: "order_delivered",
    title: "Заказ {{orderId}} доставлен",
    body: "Заказ {{orderId}} успешно доставлен по адресу {{address}}.",
    channels: ["in_app", "telegram"],
    variables: ["orderId", "address"],
  },
  {
    id: "tpl-low-stock",
    eventKind: "low_stock",
    title: "Мало остатков: {{stockItemTitle}}",
    body: "На складе мало {{stockItemTitle}}. Остаток: {{stockQuantity}}.",
    channels: ["in_app", "email"],
    variables: ["stockItemTitle", "stockQuantity"],
  },
  {
    id: "tpl-telegram-failed",
    eventKind: "telegram_failed",
    title: "Ошибка Telegram для {{orderId}}",
    body: "Не удалось отправить Telegram-уведомление по заказу {{orderId}}: {{errorMessage}}.",
    channels: ["in_app", "admin_sound", "email"],
    variables: ["orderId", "errorMessage"],
  },
  {
    id: "tpl-delivery-delay",
    eventKind: "delivery_delay",
    title: "Задержка доставки {{orderId}}",
    body: "Доставка заказа {{orderId}} опаздывает. Курьер: {{courierName}}. Адрес: {{address}}.",
    channels: ["in_app", "telegram"],
    variables: ["orderId", "courierName", "address"],
  },
];

export function getTemplateForEvent(
  eventKind: NotificationSourceEventKind,
): NotificationTemplate | null {
  return NOTIFICATION_TEMPLATES.find((template) => template.eventKind === eventKind) ?? null;
}

export function renderNotificationTemplate(
  template: string,
  payload: NotificationEventPayload,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = payload[key];
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  });
}

export function renderNotificationFromTemplate(
  template: NotificationTemplate,
  payload: NotificationEventPayload,
): { title: string; message: string } {
  return {
    title: renderNotificationTemplate(template.title, payload),
    message: renderNotificationTemplate(template.body, payload),
  };
}
