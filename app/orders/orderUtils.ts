export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";

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

const LOCAL_BACKEND_API_BASE_URL = "http://127.0.0.1:8000";
const LAN_BACKEND_API_BASE_URL = "http://192.168.0.141:8000";

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

export function getBackendApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return LOCAL_BACKEND_API_BASE_URL;
  }

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_BACKEND_API_BASE_URL;
  }

  return LAN_BACKEND_API_BASE_URL;
}

export function getOrdersUrl(): string {
  return `${getBackendApiBaseUrl()}/orders`;
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
