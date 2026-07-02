// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for orderLifecycle.
//
// Назначение (RU): Пользовательские и служебные сообщения для orderLifecycle.
// ==================================================
import type { OrderLifecycleStatus } from "@/components/orderLifecycle/orderLifecycleTypes";

export type OrderLifecycleStatusMessages = {
  customer: string;
  admin: string;
  courier: string;
  telegram: string;
};

export const ORDER_LIFECYCLE_STATUS_MESSAGES: Record<
  OrderLifecycleStatus,
  OrderLifecycleStatusMessages
> = {
  created: {
    customer: "Заказ создан и ожидает обработки",
    admin: "Новый заказ в системе",
    courier: "Заказ ещё не назначен",
    telegram: "🆕 Новый заказ создан",
  },
  accepted: {
    customer: "Заказ принят в работу",
    admin: "Заказ принят оператором",
    courier: "Заказ принят, ожидайте назначения",
    telegram: "✅ Заказ принят",
  },
  preparing: {
    customer: "Букет собирается",
    admin: "Заказ на этапе сборки",
    courier: "Заказ готовится к передаче",
    telegram: "💐 Букет собирается",
  },
  ready_for_courier: {
    customer: "Заказ готов к передаче курьеру",
    admin: "Можно назначить курьера",
    courier: "Заказ готов к получению",
    telegram: "📦 Заказ готов к передаче курьеру",
  },
  assigned_to_courier: {
    customer: "Курьер назначен",
    admin: "Курьер назначен на заказ",
    courier: "Вам назначен новый заказ",
    telegram: "🚚 Курьер назначен",
  },
  courier_on_the_way: {
    customer: "Курьер уже в пути",
    admin: "Курьер в пути к клиенту",
    courier: "Доставьте заказ клиенту",
    telegram: "🛵 Курьер в пути",
  },
  delivered: {
    customer: "Заказ доставлен",
    admin: "Заказ успешно завершён",
    courier: "Заказ доставлен",
    telegram: "🎉 Заказ доставлен",
  },
  cancelled: {
    customer: "Заказ отменён",
    admin: "Заказ отменён",
    courier: "Заказ отменён",
    telegram: "❌ Заказ отменён",
  },
  failed: {
    customer: "При обработке заказа возникла ошибка",
    admin: "Заказ завершился с ошибкой",
    courier: "Заказ недоступен для доставки",
    telegram: "⚠️ Ошибка обработки заказа",
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
export function getOrderLifecycleCustomerMessage(
  status: OrderLifecycleStatus,
): string {
  return ORDER_LIFECYCLE_STATUS_MESSAGES[status].customer;
}

export function getOrderLifecycleAdminMessage(
  status: OrderLifecycleStatus,
): string {
  return ORDER_LIFECYCLE_STATUS_MESSAGES[status].admin;
}

export function getOrderLifecycleCourierMessage(
  status: OrderLifecycleStatus,
): string {
  return ORDER_LIFECYCLE_STATUS_MESSAGES[status].courier;
}

export function getOrderLifecycleTelegramMessage(
  status: OrderLifecycleStatus,
): string {
  return ORDER_LIFECYCLE_STATUS_MESSAGES[status].telegram;
}

export function getOrderLifecycleStatusChangeTitle(
  status: OrderLifecycleStatus,
): string {
  switch (status) {
    case "created":
      return "Заказ создан";
    case "accepted":
      return "Заказ принят";
    case "preparing":
      return "Сборка заказа";
    case "ready_for_courier":
      return "Готов к передаче курьеру";
    case "assigned_to_courier":
      return "Курьер назначен";
    case "courier_on_the_way":
      return "Курьер в пути";
    case "delivered":
      return "Заказ доставлен";
    case "cancelled":
      return "Заказ отменён";
    case "failed":
    default:
      return "Ошибка заказа";
  }
}

export function getOrderLifecycleCreatedEventMessage(): string {
  return "Заказ успешно создан и ожидает обработки";
}
