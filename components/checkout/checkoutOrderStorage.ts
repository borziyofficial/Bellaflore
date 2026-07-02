// ==================================================
// SECTION: STORAGE
// РАЗДЕЛ: Хранилище
//
// Purpose (EN): Persistence layer for checkout.
//
// Назначение (RU): Слой персистентности для checkout.
// ==================================================
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";

export const CHECKOUT_ORDERS_STORAGE_KEY = "bellaflore-dev-orders";

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const CHECKOUT_LATEST_ORDER_ID_KEY = "bellaflore-latest-order-id";
export const CHECKOUT_ORDER_CREATED_STATUS = "Заказ создан";

export type CheckoutOrderItem = {
  bouquetId: string;
  bouquetName: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
  priceRub: number;
  lineTotalRub: number;
};

export type CheckoutStoredOrder = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  comment: string;
  customerComment: string;
  cardMessage: string;
  items: CheckoutOrderItem[];
  totalPriceRub: number;
  paymentMethod: string;
  paymentStatus: "PENDING";
  paymentProofFileName: null;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryZoneId?: string;
  deliveryZoneLabel?: string;
  deliveryZonePriceRub?: number;
  deliveryZoneDistanceKm?: number;
  deliveryZoneRoadDistanceKm?: number;
  deliveryZoneRoadDurationMinutes?: number;
  deliveryZoneStatus?: string;
  deliveryZoneDetectionMode?: string;
  deliveryZoneTitle?: string;
  deliveryStatus?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  validationStatus?: string;
  validationWarnings?: string[];
  validationVersion?: string;
  validatedAt?: string;
  checkoutSource: "bellaflore_checkout";
  status: "NEW";
  createdAt: string;
  createdAtDisplay: string;
};

type BuildCheckoutOrderInput = {
  orderId: string;
  payload: CheckoutOrderPayload;
  totalPriceRub: number;
  cardMessage?: string;
  paymentMethodLabel: string;
};

export function isCheckoutStoredOrder(
  order: unknown,
): order is CheckoutStoredOrder {
  if (!order || typeof order !== "object") {
    return false;
  }

  const candidate = order as Partial<CheckoutStoredOrder>;

  return (
    candidate.checkoutSource === "bellaflore_checkout" &&
    typeof candidate.orderId === "string" &&
    typeof candidate.customerName === "string" &&
    candidate.customerName.trim().length > 0 &&
    typeof candidate.customerPhone === "string" &&
    candidate.customerPhone.trim().length > 0 &&
    Array.isArray(candidate.items) &&
    candidate.items.length > 0
  );
}

export function buildCheckoutStoredOrder({
  orderId,
  payload,
  totalPriceRub,
  cardMessage = "",
  paymentMethodLabel,
}: BuildCheckoutOrderInput): CheckoutStoredOrder {
  const createdAt = new Date();
  const trimmedCardMessage = cardMessage.trim();

  return {
    orderId,
    customerName: payload.customerName,
    customerPhone: payload.phone,
    customerComment: payload.comment,
    cardMessage: trimmedCardMessage,
    comment: [
      `Адрес доставки: ${payload.deliveryAddress}`,
      `Дата доставки: ${payload.deliveryDate}`,
      `Время доставки: ${payload.deliveryInterval}`,
      trimmedCardMessage ? `Открытка: ${trimmedCardMessage}` : "",
      payload.comment ? `Комментарий: ${payload.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    items: payload.items.map((item) => ({
      bouquetId: item.bouquetId,
      bouquetName: item.title,
      sizeId: item.sizeId,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
      priceRub: item.priceRub,
      lineTotalRub: item.priceRub * item.quantity,
    })),
    totalPriceRub,
    paymentMethod: paymentMethodLabel,
    paymentStatus: "PENDING",
    paymentProofFileName: null,
    deliveryAddress: payload.deliveryAddress,
    deliveryDate: payload.deliveryDate,
    deliveryTime: payload.deliveryInterval,
    deliveryZoneId: payload.deliveryZoneId,
    deliveryZoneLabel: payload.deliveryZoneLabel,
    deliveryZonePriceRub: payload.deliveryZonePriceRub,
    deliveryZoneDistanceKm: payload.deliveryZoneDistanceKm,
    deliveryZoneRoadDistanceKm: payload.deliveryZoneRoadDistanceKm,
    deliveryZoneRoadDurationMinutes: payload.deliveryZoneRoadDurationMinutes,
    deliveryZoneStatus: payload.deliveryZoneStatus,
    deliveryZoneDetectionMode: payload.deliveryZoneDetectionMode,
    deliveryZoneTitle: payload.deliveryZoneTitle,
    deliveryStatus: payload.deliveryStatus,
    addressLatitude: payload.addressLatitude,
    addressLongitude: payload.addressLongitude,
    validationStatus: payload.validationStatus,
    validationWarnings: payload.validationWarnings,
    validationVersion: payload.validationVersion,
    validatedAt: payload.validatedAt,
    checkoutSource: "bellaflore_checkout",
    status: "NEW",
    createdAt: createdAt.toISOString(),
    createdAtDisplay: createdAt.toLocaleString("ru-RU"),
  };
}

export function readCheckoutOrders(): CheckoutStoredOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedOrders = window.localStorage.getItem(CHECKOUT_ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];

    if (!Array.isArray(parsedOrders)) {
      return [];
    }

    return parsedOrders.filter(isCheckoutStoredOrder);
  } catch {
    return [];
  }
}

export function writeCheckoutOrders(orders: CheckoutStoredOrder[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CHECKOUT_ORDERS_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch {
    // In-memory state still works if storage is blocked.
  }
}

export function readLatestCheckoutOrderId(orders: CheckoutStoredOrder[]) {
  if (typeof window === "undefined") {
    return orders[orders.length - 1]?.orderId ?? "";
  }

  try {
    const storedOrderId = window.localStorage.getItem(
      CHECKOUT_LATEST_ORDER_ID_KEY,
    );

    if (
      storedOrderId &&
      orders.some((order) => order.orderId === storedOrderId)
    ) {
      return storedOrderId;
    }
  } catch {
    // Fall back to the latest saved checkout order.
  }

  return orders[orders.length - 1]?.orderId ?? "";
}

export function writeLatestCheckoutOrderId(orderId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CHECKOUT_LATEST_ORDER_ID_KEY, orderId);
  } catch {
    // In-memory latest order id still works if storage is blocked.
  }
}
