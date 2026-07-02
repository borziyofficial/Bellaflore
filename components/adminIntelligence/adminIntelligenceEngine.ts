// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Main orchestrator
// ==================================================
import { buildAdminOrderSummary, getAdminOrderAttentionCount } from "@/components/adminIntelligence/adminOrderBridge";
import { buildAdminInventorySummary, getAdminInventoryAttentionCount } from "@/components/adminIntelligence/adminInventoryBridge";
import { buildAdminDeliverySummary, getAdminDeliveryAttentionCount } from "@/components/adminIntelligence/adminDeliveryBridge";
import { buildAdminCourierSummary, getAdminCourierAttentionCount } from "@/components/adminIntelligence/adminCourierBridge";
import { buildAdminNotificationSummary, getAdminNotificationAttentionCount } from "@/components/adminIntelligence/adminNotificationBridge";
import { buildAdminWorkflowSummary, getAdminWorkflowAttentionCount } from "@/components/adminIntelligence/adminWorkflowBridge";
import {
  ADMIN_ENTRY_POINTS,
  getEntryPointsForRole,
} from "@/components/adminIntelligence/adminEntryPointsCatalog";
import {
  getExampleAdminSession,
  getCurrentAdminSession,
} from "@/components/adminIntelligence/adminAuthFoundation";
import { getAdminModuleRegistrySnapshot } from "@/components/adminIntelligence/adminModuleRegistry";
import { getAdminNavigationForRole } from "@/components/adminIntelligence/adminNavigationCatalog";
import { listAdminAuditEvents } from "@/components/adminIntelligence/adminAuditFoundation";
import type { AdminDashboardSummary } from "@/components/adminIntelligence/adminIntelligenceTypes";

export function buildAdminDashboardSummary(): AdminDashboardSummary {
  const orderSummary = buildAdminOrderSummary(0);
  const deliverySummary = buildAdminDeliverySummary(0);
  const notificationSummary = buildAdminNotificationSummary(0);
  const workflowSummary = buildAdminWorkflowSummary(0);
  const inventorySummary = buildAdminInventorySummary(0);

  const attentionItemsCount =
    getAdminOrderAttentionCount() +
    getAdminInventoryAttentionCount() +
    getAdminDeliveryAttentionCount() +
    getAdminCourierAttentionCount() +
    getAdminNotificationAttentionCount() +
    getAdminWorkflowAttentionCount();

  return {
    ordersCount: orderSummary.totalOrders,
    activeDeliveriesCount: deliverySummary.activeTasks,
    pendingNotificationsCount: notificationSummary.pendingNotifications,
    runningWorkflowsCount: workflowSummary.runningWorkflows,
    lowStockItemsCount: inventorySummary.lowStockItems,
    attentionItemsCount,
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminIntelligenceSnapshot() {
  const session = getCurrentAdminSession();
  const role = session?.role ?? "manager";

  return {
    session,
    entryPoints: ADMIN_ENTRY_POINTS,
    accessibleEntryPoints: getEntryPointsForRole(role),
    navigation: getAdminNavigationForRole(role),
    moduleRegistry: getAdminModuleRegistrySnapshot(),
    dashboard: buildAdminDashboardSummary(),
    bridges: {
      orders: buildAdminOrderSummary(5),
      inventory: buildAdminInventorySummary(8),
      delivery: buildAdminDeliverySummary(5),
      couriers: buildAdminCourierSummary(6),
      notifications: buildAdminNotificationSummary(5),
      workflow: buildAdminWorkflowSummary(5),
    },
    recentAuditEvents: listAdminAuditEvents(10),
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminIntelligenceExample() {
  const session = getExampleAdminSession("manager");

  return {
    session,
    entryPoints: ADMIN_ENTRY_POINTS,
    navigation: getAdminNavigationForRole(session.role),
    permissions: session.permissions,
    dashboard: buildAdminDashboardSummary(),
    moduleRegistry: getAdminModuleRegistrySnapshot(),
    bridges: {
      orders: buildAdminOrderSummary(3),
      inventory: buildAdminInventorySummary(5),
      delivery: buildAdminDeliverySummary(3),
      couriers: buildAdminCourierSummary(4),
      notifications: buildAdminNotificationSummary(3),
      workflow: buildAdminWorkflowSummary(3),
    },
  };
}

export function runAdminIntelligenceEngine() {
  return getAdminIntelligenceSnapshot();
}
