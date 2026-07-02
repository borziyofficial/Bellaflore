// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Admin orders foundation
// ==================================================
import {
  getOrderById,
  listOrders,
  patchOrder,
  updateOrderStatus,
  addOrderTimelineEvent,
} from "@/components/orderIntelligence/orderStoreEngine";
import { getOrderStatusLabel } from "@/components/orderIntelligence/orderTimelineEngine";
import type {
  Order,
  OrderListFilters,
  OrderStatus,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

export type AdminOrderListItem = {
  id: string;
  status: OrderStatus;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
  totalRub: number;
  courierName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetails = Order & {
  statusLabel: string;
  itemCount: number;
  hasCourier: boolean;
};

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function matchesStatus(order: Order, status?: OrderListFilters["status"]): boolean {
  if (!status) {
    return true;
  }

  if (Array.isArray(status)) {
    return status.includes(order.status);
  }

  return order.status === status;
}

function matchesQuery(order: Order, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const phoneQuery = normalizePhone(query);

  const haystack = [
    order.id,
    order.customer.name,
    order.customer.phone,
    order.recipient.name ?? "",
    order.recipient.phone ?? "",
    order.delivery.address,
    order.delivery.comment ?? "",
    order.delivery.cardMessage ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  if (phoneQuery.length >= 4) {
    return (
      normalizePhone(order.customer.phone).includes(phoneQuery) ||
      normalizePhone(order.recipient.phone ?? "").includes(phoneQuery)
    );
  }

  return false;
}

function matchesDateRange(
  order: Order,
  fromDate?: string,
  toDate?: string,
): boolean {
  const createdDay = order.createdAt.slice(0, 10);

  if (fromDate && createdDay < fromDate) {
    return false;
  }

  if (toDate && createdDay > toDate) {
    return false;
  }

  return true;
}

export function filterOrders(
  orders: Order[],
  filters: OrderListFilters = {},
): Order[] {
  return orders.filter((order) => {
    if (!matchesStatus(order, filters.status)) {
      return false;
    }

    if (!matchesQuery(order, filters.query)) {
      return false;
    }

    if (!matchesDateRange(order, filters.fromDate, filters.toDate)) {
      return false;
    }

    if (
      filters.courierId &&
      order.delivery.courierId !== filters.courierId
    ) {
      return false;
    }

    return true;
  });
}

export function listAdminOrders(
  filters: OrderListFilters = {},
): AdminOrderListItem[] {
  return filterOrders(listOrders(), filters).map((order) => ({
    id: order.id,
    status: order.status,
    statusLabel: getOrderStatusLabel(order.status),
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    deliveryAddress: order.delivery.address,
    deliveryDate: order.delivery.deliveryDate,
    deliveryInterval: order.delivery.deliveryInterval,
    totalRub: order.payment.totalRub,
    courierName: order.delivery.courierName ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
}

export function filterOrdersByStatus(status: OrderStatus | OrderStatus[]): Order[] {
  return filterOrders(listOrders(), { status });
}

export function searchOrders(query: string): Order[] {
  return filterOrders(listOrders(), { query });
}

export function getAdminOrderDetails(orderId: string): AdminOrderDetails | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  return {
    ...order,
    statusLabel: getOrderStatusLabel(order.status),
    itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
    hasCourier: Boolean(order.delivery.courierId),
  };
}

export function changeAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  message?: string,
): AdminOrderDetails | null {
  const updated = updateOrderStatus(orderId, status, message);
  if (!updated) {
    return null;
  }

  return getAdminOrderDetails(orderId);
}

export function assignCourierToOrder(
  orderId: string,
  courier: {
    courierId: string;
    courierName: string;
    courierPhone?: string | null;
    deliveryEta?: string | null;
  },
): AdminOrderDetails | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  const assignedAt = new Date().toISOString();

  patchOrder(orderId, {
    delivery: {
      ...order.delivery,
      courierId: courier.courierId,
      courierName: courier.courierName,
      courierPhone: courier.courierPhone ?? null,
      deliveryEta: courier.deliveryEta ?? order.delivery.deliveryEta ?? null,
      assignedAt,
    },
  });

  if (
    order.status === "ready" ||
    order.status === "confirmed" ||
    order.status === "preparing"
  ) {
    updateOrderStatus(
      orderId,
      "courier_assigned",
      `Курьер назначен: ${courier.courierName}`,
    );
  } else {
    addOrderTimelineEvent(orderId, {
      kind: "courier_assigned",
      status: order.status,
      title: "Курьер назначен",
      message: `Курьер назначен: ${courier.courierName}`,
      actorType: "admin",
      actorName: "Admin",
    });
  }

  return getAdminOrderDetails(orderId);
}
