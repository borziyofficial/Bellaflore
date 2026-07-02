// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import {
  TELEGRAM_COURIER_ASSIGNED_STATUS,
  type TelegramCourierAssignedInput,
} from "@/components/telegram/telegramCourierAssignedTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function formatTelegramPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildTelegramCourierAssignedMessage(
  input: TelegramCourierAssignedInput,
): string {
  return [
    "🚚 Курьер назначен",
    "",
    "🧾 Заказ:",
    `№ заказа: ${input.orderId}`,
    "",
    "💐 Букет:",
    `Название: ${input.bouquetTitle.trim() || "—"}`,
    `Цена: ${formatTelegramPrice(input.priceRub)}`,
    "",
    "👤 Клиент:",
    `Имя: ${input.customerName}`,
    `Телефон: ${input.customerPhone}`,
    "",
    "🚚 Курьер:",
    `Имя: ${input.courierName}`,
    `Телефон: ${input.courierPhone}`,
    "",
    "📍 Доставка:",
    `Адрес: ${input.deliveryAddress.trim() || "—"}`,
    `Дата: ${input.deliveryDate.trim() || "—"}`,
    `Интервал: ${input.deliveryInterval.trim() || "—"}`,
    "",
    "Статус:",
    TELEGRAM_COURIER_ASSIGNED_STATUS,
  ].join("\n");
}
