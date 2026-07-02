// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Заказы
//
// Purpose (EN): Order formatting, lookup, and utility helpers for the app layer.
//
// Назначение (RU): Форматирование, поиск и утилиты заказов на уровне приложения.
// ==================================================
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "COURIER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type BackendOrderItem = {
  bouquetId?: string;
  bouquetName?: string;
  quantity?: number;
  priceRub?: number;
  lineTotalRub?: number;
};

export type BackendOrder = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  comment: string;
  items: BackendOrderItem[];
  total_price: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_proof_file_name: string | null;
  payment_proof_uploaded_at?: string | null;
  order_status: OrderStatus;
  created_at: string;
};

export type BackendOrderCreatePayload = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  comment: string;
  items: BackendOrderItem[];
  total_price: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_proof_file_name: string | null;
  order_status: OrderStatus;
  created_at: string;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const BACKEND_REQUEST_TIMEOUT_MS = 10_000;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const DEVELOPMENT_BACKEND_API_BASE_URL = "http://127.0.0.1:8000";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачено",
  REFUNDED: "Возврат выполнен",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: "Новый заказ",
  CONFIRMED: "Заказ подтверждён",
  PREPARING: "Букет собирается",
  COURIER_ASSIGNED: "Курьер назначен",
  OUT_FOR_DELIVERY: "Курьер в пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

function normalizeBackendBaseUrl(url: string): string {
  const trimmedUrl = url.trim();

  try {
    return new URL(trimmedUrl).origin.replace(/\/+$/, "");
  } catch {
    return trimmedUrl.replace(/\/+$/, "");
  }
}

function isLocalDevelopmentHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getBackendApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL?.trim();

  if (configuredUrl) {
    return normalizeBackendBaseUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    if (isLocalDevelopmentHostname(window.location.hostname)) {
      return DEVELOPMENT_BACKEND_API_BASE_URL;
    }
  }

  if (process.env.NODE_ENV === "development") {
    return DEVELOPMENT_BACKEND_API_BASE_URL;
  }

  return DEVELOPMENT_BACKEND_API_BASE_URL;
}

export function getOrdersUrl(): string {
  return `${getBackendApiBaseUrl()}/orders`;
}

export async function postOrderToBackend(
  payload: BackendOrderCreatePayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, BACKEND_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getOrdersUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Сервер вернул ошибку ${response.status}`,
      };
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        reason: "Превышено время ожидания сервера",
      };
    }

    return {
      ok: false,
      reason: "Не удалось связаться с сервером заказов",
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function sortNewestFirst(orders: BackendOrder[]): BackendOrder[] {
  return [...orders].sort(
    (firstOrder, secondOrder) =>
      new Date(secondOrder.created_at).getTime() -
      new Date(firstOrder.created_at).getTime(),
  );
}

export function formatPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

export function formatDate(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString("ru-RU");
}
