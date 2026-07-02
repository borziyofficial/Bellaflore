// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for telegram.
//
// Назначение (RU): Определения типов для telegram.
// ==================================================
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import type { CheckoutStoredOrder } from "@/components/checkout/checkoutOrderStorage";

export const TELEGRAM_ORDER_STATUS_CREATED = "Создан";

export type TelegramOrderMessageInput = {
  orderId: string;
  bouquetTitle: string;
  bouquetsPriceRub: number;
  deliveryZoneLabel?: string;
  deliveryZoneTitle?: string;
  deliveryPriceRub?: number;
  deliveryStatus?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  roadDistanceKm?: number | null;
  priceRub: number;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
  comment: string;
  status?: string;
  validationStatus?: string;
};

export type TelegramCheckoutPayloadOrder = {
  orderId: string;
  payload: CheckoutOrderPayload;
  totalPriceRub: number;
  cardMessage?: string;
};

export type TelegramOrderSource =
  | CheckoutStoredOrder
  | TelegramCheckoutPayloadOrder;
