// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Dashboard foundation
// ==================================================
import { calculateCourierAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCourierBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
import { readAnalyticsAiBrainSummary } from "@/components/analyticsIntelligence/analyticsAiBrainBridge";
import { comparePeriods } from "@/components/analyticsIntelligence/analyticsTrendEngine";
import type {
  AnalyticsDashboardCard,
  AnalyticsDashboardSummary,
  AnalyticsTimeRange,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

function resolveCardStatus(
  value: number,
  criticalThreshold: number,
  attentionThreshold: number,
): AnalyticsDashboardCard["status"] {
  if (value >= criticalThreshold) {
    return "critical";
  }

  if (value >= attentionThreshold) {
    return "attention";
  }

  return "healthy";
}

function buildCard(
  id: string,
  title: string,
  primaryValue: string,
  secondaryValue: string | null,
  status: AnalyticsDashboardCard["status"],
  trendDirection: AnalyticsDashboardCard["trendDirection"] = null,
): AnalyticsDashboardCard {
  return {
    id,
    title,
    primaryValue,
    secondaryValue,
    status,
    trendDirection,
  };
}

export function summarizeDashboardMetrics(
  range: AnalyticsTimeRange,
): AnalyticsDashboardSummary {
  const orders = calculateOrderAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const inventory = calculateInventoryAnalyticsMetrics(range);
  const couriers = calculateCourierAnalyticsMetrics(range);
  const notifications = calculateNotificationAnalyticsMetrics(range);
  const workflow = calculateWorkflowAnalyticsMetrics(range);
  const aiBrain = readAnalyticsAiBrainSummary(range);
  const comparison = comparePeriods(range);

  const revenueTrend = comparison.trends.find(
    (trend) => trend.metricId === "totalRevenue",
  );
  const ordersTrend = comparison.trends.find(
    (trend) => trend.metricId === "totalOrders",
  );

  return {
    generatedAt: new Date().toISOString(),
    timeRange: range,
    cards: {
      revenue: buildCard(
        "revenue",
        "Revenue",
        `${orders.totalRevenue.toLocaleString("ru-RU")} ₽`,
        `AOV ${orders.averageOrderValue.toLocaleString("ru-RU")} ₽`,
        orders.totalRevenue > 0 ? "healthy" : "attention",
        revenueTrend?.direction ?? null,
      ),
      orders: buildCard(
        "orders",
        "Orders",
        String(orders.totalOrders),
        `${orders.newOrders} new · ${orders.deliveredOrders} delivered`,
        resolveCardStatus(orders.newOrders, 5, 2),
        ordersTrend?.direction ?? null,
      ),
      delivery: buildCard(
        "delivery",
        "Delivery",
        String(delivery.activeDeliveries),
        `${delivery.delayedDeliveries} delayed · ETA ${delivery.averageEta}m`,
        resolveCardStatus(delivery.delayedDeliveries, 3, 1),
        null,
      ),
      inventory: buildCard(
        "inventory",
        "Inventory",
        String(inventory.lowStockItems),
        `${inventory.outOfStockItems} out of stock · risk ${inventory.stockRiskLevel}`,
        inventory.stockRiskLevel === "critical"
          ? "critical"
          : inventory.stockRiskLevel === "high"
            ? "attention"
            : "healthy",
        null,
      ),
      courier: buildCard(
        "courier",
        "Couriers",
        String(couriers.availableCouriers),
        `${couriers.overloadedCouriers} overloaded · load ${couriers.averageCourierLoad}`,
        resolveCardStatus(couriers.overloadedCouriers, 2, 1),
        null,
      ),
      notification: buildCard(
        "notification",
        "Notifications",
        String(notifications.pendingNotifications),
        `${notifications.failedNotifications} failed · ${notifications.notificationFailureRate}%`,
        resolveCardStatus(notifications.failedNotifications, 3, 1),
        null,
      ),
      workflow: buildCard(
        "workflow",
        "Workflow",
        String(workflow.activeWorkflows),
        `${workflow.failedWorkflows} failed · risk ${workflow.workflowRiskLevel}`,
        workflow.workflowRiskLevel === "critical"
          ? "critical"
          : workflow.workflowRiskLevel === "high"
            ? "attention"
            : "healthy",
        null,
      ),
      risk: buildCard(
        "risk",
        "Risk",
        String(aiBrain.riskCount),
        `${aiBrain.signalCount} signals · score ${aiBrain.attentionScore}`,
        resolveCardStatus(aiBrain.riskCount, 3, 1),
        null,
      ),
    },
  };
}
