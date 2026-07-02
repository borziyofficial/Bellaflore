// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import type { TelegramStatusUpdateInput } from "@/components/telegram/telegramStatusTypes";

function formatTelegramStatusTime(updatedAt: string): string {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildTelegramStatusMessage(
  input: TelegramStatusUpdateInput,
): string {
  return [
    "🔔 Обновление статуса BellaFlore",
    "",
    `№ заказа: ${input.orderId}`,
    `Букет: ${input.bouquet.trim() || "—"}`,
    `Новый статус: ${input.statusLabel}`,
    `Время: ${formatTelegramStatusTime(input.updatedAt)}`,
    `Клиент: ${input.customer}`,
    `Телефон: ${input.phone}`,
  ].join("\n");
}
