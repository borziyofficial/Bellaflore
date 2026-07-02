// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Server-side Telegram request parsing helpers for order notifications.
//
// Назначение (RU): Серверные хелперы Telegram для разбора запросов.
// ==================================================
import { isCheckoutStoredOrder } from "@/components/checkout/checkoutOrderStorage";
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import type { TelegramOrderSource } from "@/components/telegram/telegramTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isCheckoutOrderPayloadItem(
  value: unknown,
): value is CheckoutOrderPayload["items"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.bouquetId === "string" &&
    value.bouquetId.trim().length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.priceRub === "number" &&
    Number.isFinite(value.priceRub) &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    value.quantity > 0
  );
}

function isCheckoutOrderPayload(value: unknown): value is CheckoutOrderPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isCheckoutOrderPayloadItem) &&
    typeof value.customerName === "string" &&
    value.customerName.trim().length > 0 &&
    typeof value.phone === "string" &&
    value.phone.trim().length > 0 &&
    typeof value.deliveryAddress === "string" &&
    value.deliveryAddress.trim().length > 0 &&
    typeof value.deliveryDate === "string" &&
    value.deliveryDate.trim().length > 0 &&
    typeof value.deliveryInterval === "string" &&
    value.deliveryInterval.trim().length > 0 &&
    typeof value.comment === "string"
  );
}

function parseCheckoutPayloadOrder(
  body: Record<string, unknown>,
): TelegramOrderSource | null {
  if (
    typeof body.orderId !== "string" ||
    body.orderId.trim().length === 0 ||
    typeof body.totalPriceRub !== "number" ||
    !Number.isFinite(body.totalPriceRub) ||
    !isCheckoutOrderPayload(body.payload)
  ) {
    return null;
  }

  return {
    orderId: body.orderId.trim(),
    payload: body.payload,
    totalPriceRub: body.totalPriceRub,
    cardMessage:
      typeof body.cardMessage === "string" ? body.cardMessage : undefined,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function parseTelegramOrderRequest(body: unknown): TelegramOrderSource | null {
  if (!isRecord(body)) {
    return null;
  }

  const nestedOrder = body.order;

  if (isCheckoutStoredOrder(nestedOrder)) {
    return nestedOrder;
  }

  if (isCheckoutStoredOrder(body)) {
    return body;
  }

  return parseCheckoutPayloadOrder(body);
}
