// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN):
// Type definitions for Telegram order status update payloads.
//
// Назначение (RU):
// Типы payload обновления статуса заказа в Telegram.
// ==================================================
export type TelegramStatusUpdateInput = {
  orderId: string;
  bouquet: string;
  statusLabel: string;
  updatedAt: string;
  customer: string;
  phone: string;
};
