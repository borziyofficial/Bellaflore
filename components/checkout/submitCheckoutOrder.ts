import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";

export type CheckoutPaymentMethodUi = "online" | "cash";
export type CheckoutOrderPaymentMethod = "cardTransfer" | "cashOnDelivery";

export type CheckoutOrderApiRequest = {
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryDate: string;
  deliveryInterval: string;
  paymentMethod: CheckoutOrderPaymentMethod;
  customerComment: string;
  items: {
    productId: string;
    size: "S" | "M" | "L" | "XL";
    quantity: number;
  }[];
};

export type CheckoutServerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  currency: "RUB";
  deliveryZoneId: string;
  createdAt: string;
  items: {
    productId: string;
    productSlug: string;
    name: string;
    size: "S" | "M" | "L" | "XL";
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

export type CheckoutOrderApiResult = {
  order: CheckoutServerOrder;
  replayed: boolean;
};

export type CheckoutOrderAttempt = {
  idempotencyKey: string;
  requestFingerprint: string;
};

type OrderApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

const ORDER_SIZE_IDS = ["S", "M", "L", "XL"] as const;
const CHECKOUT_ORDER_ATTEMPT_STORAGE_KEY =
  "bellaflore-checkout-order-attempt";

type CheckoutOrderAttemptStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export class CheckoutOrderSubmitError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CheckoutOrderSubmitError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOrderSizeId(value: unknown): value is (typeof ORDER_SIZE_IDS)[number] {
  return (
    typeof value === "string" &&
    ORDER_SIZE_IDS.includes(value as (typeof ORDER_SIZE_IDS)[number])
  );
}

function parseCheckoutServerOrder(value: unknown): CheckoutServerOrder | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const items = value.items.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.productId !== "string" ||
      typeof item.productSlug !== "string" ||
      typeof item.name !== "string" ||
      !isOrderSizeId(item.size) ||
      !isFiniteNumber(item.unitPrice) ||
      !isFiniteNumber(item.quantity) ||
      !isFiniteNumber(item.lineTotal)
    ) {
      return [];
    }

    return [
      {
        productId: item.productId,
        productSlug: item.productSlug,
        name: item.name,
        size: item.size,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      },
    ];
  });

  if (
    items.length !== value.items.length ||
    items.length === 0 ||
    typeof value.id !== "string" ||
    typeof value.orderNumber !== "string" ||
    typeof value.status !== "string" ||
    !isFiniteNumber(value.subtotal) ||
    !isFiniteNumber(value.deliveryCost) ||
    !isFiniteNumber(value.total) ||
    value.currency !== "RUB" ||
    typeof value.deliveryZoneId !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    orderNumber: value.orderNumber,
    status: value.status,
    subtotal: value.subtotal,
    deliveryCost: value.deliveryCost,
    total: value.total,
    currency: value.currency,
    deliveryZoneId: value.deliveryZoneId,
    createdAt: value.createdAt,
    items,
  };
}

function getOrderApiErrorMessage(status: number, code?: string): string {
  if (status === 400) {
    return "Проверьте данные заказа и заполните обязательные поля.";
  }
  if (status === 404) {
    return "Один из товаров больше не доступен. Обновите корзину и попробуйте снова.";
  }
  if (status === 409 && code === "SIZE_UNAVAILABLE") {
    return "Выбранный размер товара больше недоступен. Выберите другой размер.";
  }
  if (status === 409) {
    return "Данные заказа изменились во время повторной попытки. Проверьте корзину и повторите оформление.";
  }
  if (status === 422) {
    return "Доставка по выбранному адресу недоступна. Проверьте адрес.";
  }
  if (status === 503) {
    return "Сервис оформления временно недоступен. Попробуйте ещё раз через несколько минут.";
  }
  if (status >= 500) {
    return "Не удалось сохранить заказ. Попробуйте ещё раз через несколько минут.";
  }
  return "Не удалось оформить заказ. Проверьте данные и попробуйте снова.";
}

export function mapCheckoutPaymentMethod(
  paymentMethod: CheckoutPaymentMethodUi,
): CheckoutOrderPaymentMethod {
  return paymentMethod === "cash" ? "cashOnDelivery" : "cardTransfer";
}

export function buildCheckoutOrderApiRequest(
  payload: CheckoutOrderPayload,
  paymentMethod: CheckoutPaymentMethodUi,
): CheckoutOrderApiRequest {
  if (
    !isFiniteNumber(payload.addressLatitude) ||
    !isFiniteNumber(payload.addressLongitude)
  ) {
    throw new CheckoutOrderSubmitError(
      "Не удалось определить координаты адреса. Выберите адрес из подсказок и попробуйте снова.",
      422,
      "DELIVERY_COORDINATES_MISSING",
    );
  }

  const items = payload.items.map((item) => {
    if (!isOrderSizeId(item.sizeId)) {
      throw new CheckoutOrderSubmitError(
        "Выбран некорректный размер товара. Обновите корзину и попробуйте снова.",
        400,
        "INVALID_SIZE",
      );
    }

    return {
      productId: item.bouquetId,
      size: item.sizeId,
      quantity: item.quantity,
    };
  });

  return {
    customerName: payload.customerName,
    customerPhone: payload.phone,
    recipientName: payload.customerName,
    recipientPhone: payload.phone,
    deliveryAddress: payload.deliveryAddress,
    deliveryLatitude: payload.addressLatitude,
    deliveryLongitude: payload.addressLongitude,
    deliveryDate: payload.deliveryDate,
    deliveryInterval: payload.deliveryInterval,
    paymentMethod: mapCheckoutPaymentMethod(paymentMethod),
    customerComment: payload.comment,
    items,
  };
}

export function createCheckoutIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `checkout-${globalThis.crypto.randomUUID()}`;
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export function resolveCheckoutOrderAttempt(
  request: CheckoutOrderApiRequest,
  currentAttempt: CheckoutOrderAttempt | null,
  createKey: () => string = createCheckoutIdempotencyKey,
): CheckoutOrderAttempt {
  const requestFingerprint = JSON.stringify(request);

  if (currentAttempt?.requestFingerprint === requestFingerprint) {
    return currentAttempt;
  }

  return {
    idempotencyKey: createKey(),
    requestFingerprint,
  };
}

function getCheckoutOrderAttemptStorage(): CheckoutOrderAttemptStorage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function readCheckoutOrderAttempt(
  storage: CheckoutOrderAttemptStorage | null = getCheckoutOrderAttemptStorage(),
): CheckoutOrderAttempt | null {
  if (!storage) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(
      storage.getItem(CHECKOUT_ORDER_ATTEMPT_STORAGE_KEY) ?? "null",
    );
    if (
      !isRecord(value) ||
      typeof value.idempotencyKey !== "string" ||
      typeof value.requestFingerprint !== "string"
    ) {
      return null;
    }

    return {
      idempotencyKey: value.idempotencyKey,
      requestFingerprint: value.requestFingerprint,
    };
  } catch {
    return null;
  }
}

export function writeCheckoutOrderAttempt(
  attempt: CheckoutOrderAttempt,
  storage: CheckoutOrderAttemptStorage | null = getCheckoutOrderAttemptStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(CHECKOUT_ORDER_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // The in-memory ref still protects retries when sessionStorage is blocked.
  }
}

export function clearCheckoutOrderAttempt(
  storage: CheckoutOrderAttemptStorage | null = getCheckoutOrderAttemptStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(CHECKOUT_ORDER_ATTEMPT_STORAGE_KEY);
  } catch {
    // The completed checkout is already cleared from React state.
  }
}

export async function submitCheckoutOrder(
  request: CheckoutOrderApiRequest,
  idempotencyKey: string,
  fetcher: typeof fetch = fetch,
): Promise<CheckoutOrderApiResult> {
  let response: Response;

  try {
    response = await fetcher("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(request),
    });
  } catch {
    throw new CheckoutOrderSubmitError(
      "Не удалось связаться с сервером. Проверьте интернет и повторите попытку.",
      null,
      "NETWORK_ERROR",
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorBody = isRecord(data) ? (data as OrderApiErrorBody) : {};
    const code = errorBody.error?.code;
    throw new CheckoutOrderSubmitError(
      getOrderApiErrorMessage(response.status, code),
      response.status,
      code,
    );
  }

  if (!isRecord(data)) {
    throw new CheckoutOrderSubmitError(
      "Сервер вернул неполный ответ. Заказ мог быть сохранён — повторите попытку, чтобы проверить его.",
      503,
      "INVALID_ORDER_RESPONSE",
    );
  }

  const order = parseCheckoutServerOrder(data.order);
  if (!order || typeof data.replayed !== "boolean") {
    throw new CheckoutOrderSubmitError(
      "Сервер вернул неполный ответ. Заказ мог быть сохранён — повторите попытку, чтобы проверить его.",
      503,
      "INVALID_ORDER_RESPONSE",
    );
  }

  return { order, replayed: data.replayed };
}

export function buildServerConfirmedCheckoutPayload(
  originalPayload: CheckoutOrderPayload,
  serverOrder: CheckoutServerOrder,
): CheckoutOrderPayload {
  return {
    ...originalPayload,
    items: serverOrder.items.map((item) => ({
      bouquetId: item.productId,
      title: item.name,
      sizeId: item.size,
      sizeLabel: getProductSizeRuLabel(item.size),
      priceRub: item.unitPrice,
      quantity: item.quantity,
    })),
    deliveryZoneId: serverOrder.deliveryZoneId,
    deliveryZonePriceRub: serverOrder.deliveryCost,
  };
}
