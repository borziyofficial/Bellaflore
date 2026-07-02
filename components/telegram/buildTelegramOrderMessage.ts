// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import type { CheckoutStoredOrder } from "@/components/checkout/checkoutOrderStorage";
import { getTelegramValidationLine } from "@/components/deliveryValidation/deliveryValidationMessages";
import type { DeliveryValidationStatus } from "@/components/deliveryValidation/deliveryValidationTypes";
import {
  TELEGRAM_ORDER_STATUS_CREATED,
  type TelegramCheckoutPayloadOrder,
  type TelegramOrderMessageInput,
  type TelegramOrderSource,
} from "@/components/telegram/telegramTypes";

type BouquetLineItem = {
  title: string;
  quantity: number;
  priceRub: number;
};


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

function formatBouquetSummary(items: BouquetLineItem[]): string {
  if (items.length === 0) {
    return "—";
  }

  return items
    .map((item) =>
      item.quantity > 1 ? `${item.title} × ${item.quantity}` : item.title,
    )
    .join(", ");
}

function calculateBouquetsTotalRub(items: BouquetLineItem[]): number {
  return items.reduce(
    (total, item) => total + item.priceRub * item.quantity,
    0,
  );
}

function formatTelegramComment({
  comment = "",
  cardMessage = "",
}: {
  comment?: string;
  cardMessage?: string;
}): string {
  const segments = [
    comment.trim(),
    cardMessage.trim() ? `Открытка: ${cardMessage.trim()}` : "",
  ].filter(Boolean);

  return segments.length > 0 ? segments.join("\n") : "—";
}

function formatRoadDistanceLine(roadDistanceKm: number | null | undefined): string {
  if (roadDistanceKm === null || roadDistanceKm === undefined) {
    return "—";
  }

  return `${roadDistanceKm.toFixed(1)} km`;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
function formatCoordinatesLine(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return "—";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function buildTelegramOrderMessage(
  input: TelegramOrderMessageInput,
): string {
  const status = input.status?.trim() || TELEGRAM_ORDER_STATUS_CREATED;
  const comment = input.comment.trim() || "—";
  const deliveryZoneLabel = input.deliveryZoneLabel?.trim() || "—";
  const deliveryZoneTitle = input.deliveryZoneTitle?.trim() || deliveryZoneLabel;
  const deliveryPriceLine =
    typeof input.deliveryPriceRub === "number"
      ? formatTelegramPrice(input.deliveryPriceRub)
      : "—";

  return [
    "🌸 Новый заказ BellaFlore",
    "",
    "🧾 Заказ:",
    `№ заказа: ${input.orderId}`,
    `Статус: ${status}`,
    "",
    "💐 Букет:",
    `Название: ${input.bouquetTitle}`,
    `Цена букетов: ${formatTelegramPrice(input.bouquetsPriceRub)}`,
    "",
    "🚚 Доставка:",
    `Адрес: ${input.deliveryAddress}`,
    `Дата: ${input.deliveryDate}`,
    `Интервал: ${input.deliveryInterval}`,
    `Зона доставки: ${deliveryZoneTitle}`,
    `Стоимость доставки: ${deliveryPriceLine}`,
    `Статус доставки: ${input.deliveryStatus?.trim() || "—"}`,
    `Координаты: ${formatCoordinatesLine(input.addressLatitude, input.addressLongitude)}`,
    `Дорога от МКАД: ${formatRoadDistanceLine(input.roadDistanceKm)}`,
    getTelegramValidationLine(
      input.validationStatus as DeliveryValidationStatus | undefined,
    ),
    "",
    "💰 Итого:",
    formatTelegramPrice(input.priceRub),
    "",
    "👤 Клиент:",
    `Имя: ${input.customerName}`,
    `Телефон: ${input.phone}`,
    "",
    "💬 Комментарий:",
    comment,
  ].join("\n");
}

export function toTelegramOrderMessageInputFromStoredOrder(
  order: CheckoutStoredOrder,
): TelegramOrderMessageInput {
  const bouquetItems = order.items.map((item) => ({
    title: item.bouquetName,
    quantity: item.quantity,
    priceRub: item.priceRub,
  }));
  const bouquetsPriceRub = bouquetItems.reduce(
    (total, item) => total + item.priceRub * item.quantity,
    0,
  );

  return {
    orderId: order.orderId,
    bouquetTitle: formatBouquetSummary(bouquetItems),
    bouquetsPriceRub,
    deliveryZoneLabel: order.deliveryZoneLabel,
    deliveryZoneTitle: order.deliveryZoneTitle,
    deliveryPriceRub: order.deliveryZonePriceRub,
    deliveryStatus: order.deliveryStatus,
    addressLatitude: order.addressLatitude,
    addressLongitude: order.addressLongitude,
    roadDistanceKm: order.deliveryZoneRoadDistanceKm ?? null,
    priceRub: order.totalPriceRub,
    customerName: order.customerName,
    phone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,
    deliveryInterval: order.deliveryTime,
    comment: formatTelegramComment({
      comment: order.customerComment,
      cardMessage: order.cardMessage,
    }),
    status: TELEGRAM_ORDER_STATUS_CREATED,
    validationStatus: order.validationStatus,
  };
}

export function toTelegramOrderMessageInputFromCheckoutPayload({
  orderId,
  payload,
  totalPriceRub,
  cardMessage = "",
}: TelegramCheckoutPayloadOrder): TelegramOrderMessageInput {
  const bouquetItems = payload.items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    priceRub: item.priceRub,
  }));

  return {
    orderId,
    bouquetTitle: formatBouquetSummary(bouquetItems),
    bouquetsPriceRub: calculateBouquetsTotalRub(bouquetItems),
    deliveryZoneLabel: payload.deliveryZoneLabel,
    deliveryZoneTitle: payload.deliveryZoneTitle,
    deliveryPriceRub: payload.deliveryZonePriceRub,
    deliveryStatus: payload.deliveryStatus,
    addressLatitude: payload.addressLatitude,
    addressLongitude: payload.addressLongitude,
    roadDistanceKm: payload.deliveryZoneRoadDistanceKm ?? null,
    priceRub: totalPriceRub,
    customerName: payload.customerName,
    phone: payload.phone,
    deliveryAddress: payload.deliveryAddress,
    deliveryDate: payload.deliveryDate,
    deliveryInterval: payload.deliveryInterval,
    comment: formatTelegramComment({
      comment: payload.comment,
      cardMessage,
    }),
    status: TELEGRAM_ORDER_STATUS_CREATED,
    validationStatus: payload.validationStatus,
  };
}

export function toTelegramOrderMessageInput(
  source: TelegramOrderSource,
): TelegramOrderMessageInput {
  if ("checkoutSource" in source) {
    return toTelegramOrderMessageInputFromStoredOrder(source);
  }

  return toTelegramOrderMessageInputFromCheckoutPayload(source);
}

export function buildTelegramOrderMessageFromStoredOrder(
  order: CheckoutStoredOrder,
): string {
  return buildTelegramOrderMessage(
    toTelegramOrderMessageInputFromStoredOrder(order),
  );
}

export function buildTelegramOrderMessageFromCheckoutPayload(
  order: TelegramCheckoutPayloadOrder,
): string {
  return buildTelegramOrderMessage(
    toTelegramOrderMessageInputFromCheckoutPayload(order),
  );
}

export function buildTelegramOrderMessageFromCheckoutOrderPayload(
  orderId: string,
  payload: CheckoutOrderPayload,
  totalPriceRub: number,
  cardMessage = "",
): string {
  return buildTelegramOrderMessageFromCheckoutPayload({
    orderId,
    payload,
    totalPriceRub,
    cardMessage,
  });
}
