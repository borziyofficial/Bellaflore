// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Insight engine
// ==================================================
import { calculateCatalogAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCatalogBridge";
import { calculateCourierAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCourierBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
import type {
  AnalyticsInsight,
  AnalyticsTimeRange,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

let insightCounter = 0;

function nextInsightId(category: string): string {
  insightCounter += 1;
  return `insight-${category}-${insightCounter}`;
}

export function generateAnalyticsInsights(
  range: AnalyticsTimeRange,
): AnalyticsInsight[] {
  const now = new Date().toISOString();
  const insights: AnalyticsInsight[] = [];

  const orders = calculateOrderAnalyticsMetrics(range);
  const inventory = calculateInventoryAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const couriers = calculateCourierAnalyticsMetrics(range);
  const notifications = calculateNotificationAnalyticsMetrics(range);
  const workflow = calculateWorkflowAnalyticsMetrics(range);
  const catalog = calculateCatalogAnalyticsMetrics(range);

  if (orders.newOrders > 0) {
    insights.push({
      id: nextInsightId("sales"),
      category: "sales",
      priority: orders.newOrders >= 3 ? "high" : "normal",
      title: "Новые заказы ждут обработки",
      summary: `${orders.newOrders} заказ(ов) в статусе new за ${range.label.toLowerCase()}`,
      moduleId: "orderIntelligence",
      metricIds: ["kpi-total-orders"],
      createdAt: now,
    });
  }

  if (orders.totalRevenue > 0) {
    insights.push({
      id: nextInsightId("sales"),
      category: "sales",
      priority: "normal",
      title: "Выручка за период",
      summary: `Выручка ${orders.totalRevenue.toLocaleString("ru-RU")} ₽, средний чек ${orders.averageOrderValue.toLocaleString("ru-RU")} ₽`,
      moduleId: "orderIntelligence",
      metricIds: ["kpi-total-revenue", "kpi-average-order-value"],
      createdAt: now,
    });
  }

  if (inventory.stockRiskLevel === "critical" || inventory.stockRiskLevel === "high") {
    insights.push({
      id: nextInsightId("risk"),
      category: "risk",
      priority: inventory.stockRiskLevel === "critical" ? "critical" : "high",
      title: "Склад требует внимания",
      summary: `Low stock: ${inventory.lowStockItems}, out of stock: ${inventory.outOfStockItems}`,
      moduleId: "inventoryIntelligence",
      metricIds: ["kpi-stock-risk"],
      createdAt: now,
    });
  }

  if (delivery.delayedDeliveries > 0) {
    insights.push({
      id: nextInsightId("delivery"),
      category: "delivery",
      priority: "high",
      title: "Задержки доставки",
      summary: `${delivery.delayedDeliveries} доставок с высоким риском задержки`,
      moduleId: "deliveryIntelligence",
      metricIds: ["kpi-delivery-delay-risk"],
      createdAt: now,
    });
  }

  if (couriers.overloadedCouriers > 0) {
    insights.push({
      id: nextInsightId("operations"),
      category: "operations",
      priority: "high",
      title: "Перегрузка курьеров",
      summary: `${couriers.overloadedCouriers} курьер(ов) на лимите загрузки`,
      moduleId: "courierIntelligence",
      metricIds: ["kpi-courier-load"],
      createdAt: now,
    });
  }

  if (notifications.failedNotifications > 0) {
    insights.push({
      id: nextInsightId("risk"),
      category: "risk",
      priority: "high",
      title: "Ошибки уведомлений",
      summary: `Failed: ${notifications.failedNotifications}, failure rate ${notifications.notificationFailureRate}%`,
      moduleId: "notificationIntelligence",
      metricIds: ["kpi-notification-failure-rate"],
      createdAt: now,
    });
  }

  if (workflow.failedWorkflows > 0 || workflow.manualReviewCount > 0) {
    insights.push({
      id: nextInsightId("operations"),
      category: "operations",
      priority: workflow.failedWorkflows > 0 ? "critical" : "high",
      title: "Workflow требует review",
      summary: `Failed: ${workflow.failedWorkflows}, manual review: ${workflow.manualReviewCount}`,
      moduleId: "workflowIntelligence",
      metricIds: ["kpi-workflow-risk"],
      createdAt: now,
    });
  }

  if (catalog.topPurchasedProducts.length > 0) {
    insights.push({
      id: nextInsightId("growth"),
      category: "growth",
      priority: "normal",
      title: "Топ продаж",
      summary: `Лидер: ${catalog.topPurchasedProducts[0]?.title ?? "—"}`,
      moduleId: "catalogEngine",
      metricIds: ["kpi-addon-attach-rate"],
      createdAt: now,
    });
  }

  return insights;
}

export function resetAnalyticsInsightCounter(): void {
  insightCounter = 0;
}

export function getExampleRiskInsight(
  range: AnalyticsTimeRange,
): AnalyticsInsight | null {
  return (
    generateAnalyticsInsights(range).find((insight) => insight.category === "risk") ??
    null
  );
}
