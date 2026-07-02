// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import { detectOrderAlerts } from "@/components/orderIntelligence/orderAlertsFoundation";
import {
  getAdminOrderDetails,
  listAdminOrders,
  searchOrders,
} from "@/components/orderIntelligence/orderAdminFoundation";
import { getExampleOrderPayload } from "@/components/orderIntelligence/checkoutOrderBridge";
import {
  cancelOrder,
  getOrderById,
  listOrders,
} from "@/components/orderIntelligence/orderStoreEngine";
import type { OrderListFilters } from "@/components/orderIntelligence/orderIntelligenceTypes";

export function runOrderIntelligenceEngine(filters: OrderListFilters = {}) {
  const orders = listOrders();

  return {
    orders,
    adminOrders: listAdminOrders(filters),
    alerts: detectOrderAlerts(orders),
    generatedAt: new Date().toISOString(),
  };
}

export function getOrderIntelligenceSnapshot(orderId: string) {
  return {
    order: getOrderById(orderId),
    adminDetails: getAdminOrderDetails(orderId),
    alerts: getOrderById(orderId)
      ? detectOrderAlerts(listOrders()).filter((alert) => alert.orderId === orderId)
      : [],
  };
}

export function getOrderIntelligenceExample() {
  return getExampleOrderPayload();
}

export function searchOrderIntelligence(query: string) {
  return searchOrders(query);
}

export function cancelOrderIntelligence(orderId: string, reason?: string) {
  return cancelOrder(orderId, reason);
}
