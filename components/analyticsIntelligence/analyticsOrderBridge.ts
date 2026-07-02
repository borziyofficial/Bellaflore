// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Order bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  OrderAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { isDateWithinAnalyticsRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";
import type { Order } from "@/components/orderIntelligence/orderIntelligenceTypes";

const CONFIRMED_STATUSES = new Set<Order["status"]>([
  "confirmed",
  "preparing",
  "ready",
  "courier_assigned",
  "in_delivery",
  "delivered",
]);

function filterOrdersByRange(
  orders: Order[],
  range: AnalyticsTimeRange,
): Order[] {
  return orders.filter((order) =>
    isDateWithinAnalyticsRange(order.createdAt, range),
  );
}

export function readAnalyticsOrderSnapshot(range: AnalyticsTimeRange) {
  const orders = filterOrdersByRange(listOrders(), range);

  return {
    orders,
    orderIds: orders.map((order) => order.id),
    generatedAt: new Date().toISOString(),
  };
}

export function calculateOrderAnalyticsMetrics(
  range: AnalyticsTimeRange,
): OrderAnalyticsMetrics {
  const orders = filterOrdersByRange(listOrders(), range);
  const delivered = orders.filter((order) => order.status === "delivered");
  const revenueOrders = delivered.length > 0 ? delivered : orders;

  const totalRevenue = revenueOrders.reduce(
    (sum, order) => sum + order.payment.totalRub,
    0,
  );

  const phoneCounts = new Map<string, number>();
  for (const order of orders) {
    const phone = order.customer.phone.replace(/\D/g, "");
    phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
  }

  const repeatCustomers = [...phoneCounts.values()].filter((count) => count > 1)
    .length;

  const averageOrderValue =
    revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

  const conversionEstimate =
    orders.length > 0 ? delivered.length / orders.length : 0;

  return {
    totalOrders: orders.length,
    newOrders: orders.filter((order) => order.status === "new").length,
    confirmedOrders: orders.filter((order) => CONFIRMED_STATUSES.has(order.status))
      .length,
    cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
    deliveredOrders: delivered.length,
    failedOrders: orders.filter((order) => order.status === "failed").length,
    averageOrderValue: Math.round(averageOrderValue),
    totalRevenue: Math.round(totalRevenue),
    conversionEstimate: Math.round(conversionEstimate * 1000) / 10,
    repeatCustomerEstimate: repeatCustomers,
  };
}
