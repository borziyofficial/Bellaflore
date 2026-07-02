// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Order bridge (read-only)
// ==================================================
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";
import { getCustomerProfile, getCustomerProfileByPhone } from "@/components/customerIntelligence/customerProfileEngine";

export type OrderCustomerSnapshotOrder = {
  orderId: string;
  status: string;
  totalRub: number;
  deliveryDate: string;
  itemsSummary: string;
  createdAt: string;
  customerPhone: string;
};

export type OrderCustomerSnapshot = {
  customerId: string | null;
  orders: OrderCustomerSnapshotOrder[];
  totalOrders: number;
  totalRevenue: number;
  generatedAt: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function readOrderCustomerSnapshot(
  customerIdOrPhone: string,
): OrderCustomerSnapshot {
  const profile =
    getCustomerProfile(customerIdOrPhone) ??
    getCustomerProfileByPhone(customerIdOrPhone);

  const phone = profile?.phone ?? customerIdOrPhone;
  const normalized = normalizePhone(phone);

  const orders = listOrders()
    .filter((order) => normalizePhone(order.customer.phone) === normalized)
    .map((order) => ({
      orderId: order.id,
      status: order.status,
      totalRub: order.payment.totalRub,
      deliveryDate: order.delivery.deliveryDate,
      itemsSummary: order.items.map((item) => item.title).join(", "),
      createdAt: order.createdAt,
      customerPhone: order.customer.phone,
    }));

  const delivered = orders.filter((order) => order.status === "delivered");
  const revenueSource = delivered.length > 0 ? delivered : orders;

  return {
    customerId: profile?.id ?? null,
    orders,
    totalOrders: orders.length,
    totalRevenue: revenueSource.reduce((sum, order) => sum + order.totalRub, 0),
    generatedAt: new Date().toISOString(),
  };
}

export function buildOrderCustomerInsight(customerId: string) {
  const snapshot = readOrderCustomerSnapshot(customerId);

  return {
    insight: snapshot.totalOrders > 0 ? "active_buyer" : "prospect",
    totalOrders: snapshot.totalOrders,
    totalRevenue: snapshot.totalRevenue,
    lastOrder: snapshot.orders[0] ?? null,
  };
}
