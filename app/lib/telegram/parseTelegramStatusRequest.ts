// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Server-side Telegram request parsing helpers for order notifications.
//
// Назначение (RU): Серверные хелперы Telegram для разбора запросов.
// ==================================================
import { getOrderStatus } from "@/components/orders/orderStatus";

export type TelegramStatusUpdateRequest = {
  orderId: string;
  bouquet: string;
  status: string;
  updatedAt: string;
  customer: string;
  phone: string;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function parseTelegramStatusRequest(
  body: unknown,
): TelegramStatusUpdateRequest | null {
  if (!isRecord(body)) {
    return null;
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const bouquet = typeof body.bouquet === "string" ? body.bouquet.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const updatedAt =
    typeof body.updatedAt === "string" ? body.updatedAt.trim() : "";
  const customer =
    typeof body.customer === "string" ? body.customer.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (
    !orderId ||
    !status ||
    !updatedAt ||
    !customer ||
    !phone ||
    !getOrderStatus(status)
  ) {
    return null;
  }

  return {
    orderId,
    bouquet,
    status,
    updatedAt,
    customer,
    phone,
  };
}
