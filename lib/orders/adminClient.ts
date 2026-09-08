import type { OrderPaymentStatus, OrderStatus } from "@/lib/orders/types";

export type AdminOrderItem = {
  id: string;
  productSource: string;
  productId: string;
  productSlug: string;
  name: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string };
  recipient: { name: string; phone: string };
  delivery: {
    address: string;
    latitude: number;
    longitude: number;
    zoneId: string;
    date: string;
    interval: string;
  };
  paymentMethod: string;
  paymentStatus: OrderPaymentStatus;
  cancellationReason: string | null;
  customerComment: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  currency: "RUB";
  items: AdminOrderItem[];
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтверждён",
  PREPARING: "Собирается",
  COURIER_ASSIGNED: "Курьер назначен",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export const paymentStatusLabels: Record<OrderPaymentStatus, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  REFUNDED: "Возвращён",
};

export function paymentMethodLabel(value: string): string {
  if (value === "cashOnDelivery") return "При получении";
  if (value === "cardTransfer") return "Переводом";
  return value;
}

export function formatOrderPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function sortAdminOrdersNewestFirst(orders: AdminOrder[]): AdminOrder[] {
  return [...orders].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

export async function fetchAdminOrders(limit = 100): Promise<AdminOrder[]> {
  const response = await fetch(`/api/admin/orders?limit=${limit}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | { orders?: AdminOrder[]; error?: { message?: string }; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      body?.error?.message ?? body?.message ?? "Не удалось загрузить заказы.",
    );
  }

  return Array.isArray(body?.orders) ? body.orders : [];
}

async function readAdminOrderResponse(
  response: Response,
  fallbackMessage: string,
): Promise<AdminOrder> {
  const body = (await response.json().catch(() => null)) as
    | { order?: AdminOrder; error?: { message?: string }; message?: string }
    | null;
  if (!response.ok || !body?.order) {
    throw new Error(body?.error?.message ?? body?.message ?? fallbackMessage);
  }
  return body.order;
}

export async function fetchAdminOrder(identifier: string): Promise<AdminOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(identifier)}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  return readAdminOrderResponse(response, "Не удалось загрузить детали заказа.");
}

export async function updateAdminOrderStatus(
  identifier: string,
  status: OrderStatus,
  cancellationReason?: string,
): Promise<AdminOrder> {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(identifier)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, cancellationReason }),
    cache: "no-store",
    credentials: "same-origin",
  });
  return readAdminOrderResponse(response, "Не удалось обновить статус заказа.");
}

export type DashboardOrderMetrics = {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  newOrders: number;
  statusCounts: Record<OrderStatus, number>;
};

export function buildDashboardOrderMetrics(
  orders: AdminOrder[],
  now = new Date(),
): DashboardOrderMetrics {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const statusCounts: Record<OrderStatus, number> = {
    NEW: 0,
    CONFIRMED: 0,
    PREPARING: 0,
    COURIER_ASSIGNED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  let todayOrders = 0;
  let todayRevenue = 0;

  for (const order of orders) {
    statusCounts[order.status] += 1;
    const orderDateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(order.createdAt));
    if (orderDateKey === todayKey) {
      todayOrders += 1;
      if (order.status !== "CANCELLED") todayRevenue += order.total;
    }
  }

  return {
    totalOrders: orders.length,
    todayOrders,
    todayRevenue,
    newOrders: statusCounts.NEW,
    statusCounts,
  };
}
