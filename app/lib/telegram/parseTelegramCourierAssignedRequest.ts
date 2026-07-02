// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Server-side Telegram request parsing helpers for order notifications.
//
// Назначение (RU): Серверные хелперы Telegram для разбора запросов.
// ==================================================
import type { TelegramCourierAssignedInput } from "@/components/telegram/telegramCourierAssignedTypes";

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
export function parseTelegramCourierAssignedRequest(
  body: unknown,
): TelegramCourierAssignedInput | null {
  if (!isRecord(body)) {
    return null;
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const bouquetTitle =
    typeof body.bouquetTitle === "string" ? body.bouquetTitle.trim() : "";
  const priceRub = typeof body.priceRub === "number" ? body.priceRub : NaN;
  const customerName =
    typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const courierName =
    typeof body.courierName === "string" ? body.courierName.trim() : "";
  const courierPhone =
    typeof body.courierPhone === "string" ? body.courierPhone.trim() : "";
  const deliveryAddress =
    typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
  const deliveryDate =
    typeof body.deliveryDate === "string" ? body.deliveryDate.trim() : "";
  const deliveryInterval =
    typeof body.deliveryInterval === "string" ? body.deliveryInterval.trim() : "";

  if (
    !orderId ||
    !customerName ||
    !customerPhone ||
    !courierName ||
    !courierPhone ||
    !Number.isFinite(priceRub)
  ) {
    return null;
  }

  return {
    orderId,
    bouquetTitle,
    priceRub,
    customerName,
    customerPhone,
    courierName,
    courierPhone,
    deliveryAddress,
    deliveryDate,
    deliveryInterval,
  };
}
