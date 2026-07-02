// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Order bridge (read-only)
// ==================================================
import { listAdminOrders } from "@/components/orderIntelligence/orderAdminFoundation";
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";
import type { OrderStatus } from "@/components/orderIntelligence/orderIntelligenceTypes";

export type AdminOrderBridgeSummary = {
  totalOrders: number;
  newOrders: number;
  inProgressOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  recentOrders: ReturnType<typeof listAdminOrders>;
  generatedAt: string;
};

const IN_PROGRESS_STATUSES = new Set<OrderStatus>([
  "confirmed",
  "preparing",
  "ready",
  "courier_assigned",
  "in_delivery",
]);

export function buildAdminOrderSummary(limit = 5): AdminOrderBridgeSummary {
  const orders = listOrders();
  const recentOrders = listAdminOrders().slice(0, limit);

  return {
    totalOrders: orders.length,
    newOrders: orders.filter((order) => order.status === "new").length,
    inProgressOrders: orders.filter((order) =>
      IN_PROGRESS_STATUSES.has(order.status),
    ).length,
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
    cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
    recentOrders,
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminOrderAttentionCount(): number {
  const summary = buildAdminOrderSummary(0);
  return summary.newOrders + summary.inProgressOrders;
}
