// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Report engine
// ==================================================
import { calculateCatalogAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCatalogBridge";
import { calculateCourierAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCourierBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
import { generateAnalyticsInsights } from "@/components/analyticsIntelligence/analyticsInsightEngine";
import type {
  AnalyticsMetric,
  AnalyticsReport,
  AnalyticsTimeRange,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

let reportCounter = 0;

function nextReportId(kind: string): string {
  reportCounter += 1;
  return `analytics-report-${kind}-${reportCounter}`;
}

function metric(
  id: string,
  label: string,
  value: number,
  moduleId: AnalyticsMetric["moduleId"],
  kind: AnalyticsMetric["kind"] = "count",
): AnalyticsMetric {
  return {
    id,
    label,
    value,
    kind,
    unit: kind === "percentage" ? "%" : kind === "currency" ? "RUB" : null,
    moduleId,
    trendDirection: null,
    previousValue: null,
  };
}

function buildReport(
  input: Omit<AnalyticsReport, "id">,
  kind: string,
): AnalyticsReport {
  return { id: nextReportId(kind), ...input };
}

export function dailySalesReport(range: AnalyticsTimeRange): AnalyticsReport {
  const orders = calculateOrderAnalyticsMetrics(range);
  const insights = generateAnalyticsInsights(range).filter(
    (insight) => insight.category === "sales",
  );

  return buildReport(
    {
      kind: "daily_sales",
      title: "Daily Sales Report",
      timeRange: range,
      summary: `Заказов: ${orders.totalOrders}, выручка: ${orders.totalRevenue.toLocaleString("ru-RU")} ₽`,
      metrics: [
        metric("totalOrders", "Заказы", orders.totalOrders, "orderIntelligence"),
        metric("deliveredOrders", "Доставлено", orders.deliveredOrders, "orderIntelligence"),
        metric("totalRevenue", "Выручка", orders.totalRevenue, "orderIntelligence", "currency"),
        metric("averageOrderValue", "Средний чек", orders.averageOrderValue, "orderIntelligence", "currency"),
        metric("conversionEstimate", "Конверсия", orders.conversionEstimate, "orderIntelligence", "percentage"),
      ],
      insights,
      generatedAt: new Date().toISOString(),
    },
    "daily_sales",
  );
}

export function weeklyOperationsReport(range: AnalyticsTimeRange): AnalyticsReport {
  const orders = calculateOrderAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const workflow = calculateWorkflowAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "weekly_operations",
      title: "Weekly Operations Report",
      timeRange: range,
      summary: `Операции: ${orders.confirmedOrders} подтверждено, доставок: ${delivery.totalDeliveries}`,
      metrics: [
        metric("confirmedOrders", "Подтверждено", orders.confirmedOrders, "orderIntelligence"),
        metric("activeDeliveries", "Активные доставки", delivery.activeDeliveries, "deliveryIntelligence"),
        metric("activeWorkflows", "Active workflows", workflow.activeWorkflows, "workflowIntelligence"),
        metric("manualReviewCount", "Manual review", workflow.manualReviewCount, "workflowIntelligence"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.category === "operations",
      ),
      generatedAt: new Date().toISOString(),
    },
    "weekly_operations",
  );
}

export function inventoryRiskReport(range: AnalyticsTimeRange): AnalyticsReport {
  const inventory = calculateInventoryAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "inventory_risk",
      title: "Inventory Risk Report",
      timeRange: range,
      summary: `Stock risk: ${inventory.stockRiskLevel}, low stock: ${inventory.lowStockItems}`,
      metrics: [
        metric("lowStockItems", "Low stock", inventory.lowStockItems, "inventoryIntelligence"),
        metric("outOfStockItems", "Out of stock", inventory.outOfStockItems, "inventoryIntelligence"),
        metric("replacementUsage", "Replacement usage", inventory.replacementUsage, "inventoryIntelligence"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.moduleId === "inventoryIntelligence",
      ),
      generatedAt: new Date().toISOString(),
    },
    "inventory_risk",
  );
}

export function deliveryPerformanceReport(range: AnalyticsTimeRange): AnalyticsReport {
  const delivery = calculateDeliveryAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "delivery_performance",
      title: "Delivery Performance Report",
      timeRange: range,
      summary: `On time: ${delivery.deliveredOnTime}, delayed: ${delivery.delayedDeliveries}, avg ETA: ${delivery.averageEta} min`,
      metrics: [
        metric("totalDeliveries", "Total deliveries", delivery.totalDeliveries, "deliveryIntelligence"),
        metric("deliveredOnTime", "On time", delivery.deliveredOnTime, "deliveryIntelligence"),
        metric("delayedDeliveries", "Delayed", delivery.delayedDeliveries, "deliveryIntelligence"),
        metric("averageEta", "Average ETA", delivery.averageEta, "deliveryIntelligence", "duration"),
        metric("deliveryDelayRisk", "Delay risk", delivery.deliveryDelayRisk, "deliveryIntelligence", "percentage"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.category === "delivery",
      ),
      generatedAt: new Date().toISOString(),
    },
    "delivery_performance",
  );
}

export function courierPerformanceReport(range: AnalyticsTimeRange): AnalyticsReport {
  const couriers = calculateCourierAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "courier_performance",
      title: "Courier Performance Report",
      timeRange: range,
      summary: `Active: ${couriers.activeCouriers}, overloaded: ${couriers.overloadedCouriers}, avg load: ${couriers.averageCourierLoad}`,
      metrics: [
        metric("activeCouriers", "Active couriers", couriers.activeCouriers, "courierIntelligence"),
        metric("availableCouriers", "Available", couriers.availableCouriers, "courierIntelligence"),
        metric("overloadedCouriers", "Overloaded", couriers.overloadedCouriers, "courierIntelligence"),
        metric("averageCourierLoad", "Average load", couriers.averageCourierLoad, "courierIntelligence", "score"),
        metric("courierDelayRisk", "Delay risk", couriers.courierDelayRisk, "courierIntelligence", "percentage"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.moduleId === "courierIntelligence",
      ),
      generatedAt: new Date().toISOString(),
    },
    "courier_performance",
  );
}

export function notificationHealthReport(range: AnalyticsTimeRange): AnalyticsReport {
  const notifications = calculateNotificationAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "notification_health",
      title: "Notification Health Report",
      timeRange: range,
      summary: `Sent: ${notifications.sentNotifications}, failed: ${notifications.failedNotifications}, failure rate: ${notifications.notificationFailureRate}%`,
      metrics: [
        metric("sentNotifications", "Sent", notifications.sentNotifications, "notificationIntelligence"),
        metric("failedNotifications", "Failed", notifications.failedNotifications, "notificationIntelligence"),
        metric("pendingNotifications", "Pending", notifications.pendingNotifications, "notificationIntelligence"),
        metric("retryCount", "Retries", notifications.retryCount, "notificationIntelligence"),
        metric("escalationCount", "Escalations", notifications.escalationCount, "notificationIntelligence"),
        metric("notificationFailureRate", "Failure rate", notifications.notificationFailureRate, "notificationIntelligence", "percentage"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.moduleId === "notificationIntelligence",
      ),
      generatedAt: new Date().toISOString(),
    },
    "notification_health",
  );
}

export function workflowHealthReport(range: AnalyticsTimeRange): AnalyticsReport {
  const workflow = calculateWorkflowAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "workflow_health",
      title: "Workflow Health Report",
      timeRange: range,
      summary: `Active: ${workflow.activeWorkflows}, failed: ${workflow.failedWorkflows}, risk: ${workflow.workflowRiskLevel}`,
      metrics: [
        metric("activeWorkflows", "Active", workflow.activeWorkflows, "workflowIntelligence"),
        metric("failedWorkflows", "Failed", workflow.failedWorkflows, "workflowIntelligence"),
        metric("completedWorkflows", "Completed", workflow.completedWorkflows, "workflowIntelligence"),
        metric("manualReviewCount", "Manual review", workflow.manualReviewCount, "workflowIntelligence"),
        metric("averageWorkflowDuration", "Avg duration (min)", workflow.averageWorkflowDuration, "workflowIntelligence", "duration"),
      ],
      insights: generateAnalyticsInsights(range).filter(
        (insight) => insight.moduleId === "workflowIntelligence",
      ),
      generatedAt: new Date().toISOString(),
    },
    "workflow_health",
  );
}

export function executiveSummaryReport(range: AnalyticsTimeRange): AnalyticsReport {
  const orders = calculateOrderAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const inventory = calculateInventoryAnalyticsMetrics(range);
  const catalog = calculateCatalogAnalyticsMetrics(range);

  return buildReport(
    {
      kind: "executive_summary",
      title: "Executive Summary Report",
      timeRange: range,
      summary: `Revenue ${orders.totalRevenue.toLocaleString("ru-RU")} ₽ · Orders ${orders.totalOrders} · Stock risk ${inventory.stockRiskLevel}`,
      metrics: [
        metric("totalRevenue", "Revenue", orders.totalRevenue, "orderIntelligence", "currency"),
        metric("totalOrders", "Orders", orders.totalOrders, "orderIntelligence"),
        metric("conversionEstimate", "Conversion", orders.conversionEstimate, "orderIntelligence", "percentage"),
        metric("deliveryDelayRisk", "Delivery delay risk", delivery.deliveryDelayRisk, "deliveryIntelligence", "percentage"),
        metric("addOnAttachRate", "Add-on attach", catalog.addOnAttachRate, "catalogEngine", "percentage"),
      ],
      insights: generateAnalyticsInsights(range),
      generatedAt: new Date().toISOString(),
    },
    "executive_summary",
  );
}

export function buildAnalyticsReport(
  range: AnalyticsTimeRange,
  kind: AnalyticsReport["kind"] = "daily_sales",
): AnalyticsReport {
  switch (kind) {
    case "weekly_operations":
      return weeklyOperationsReport(range);
    case "inventory_risk":
      return inventoryRiskReport(range);
    case "delivery_performance":
      return deliveryPerformanceReport(range);
    case "courier_performance":
      return courierPerformanceReport(range);
    case "notification_health":
      return notificationHealthReport(range);
    case "workflow_health":
      return workflowHealthReport(range);
    case "executive_summary":
      return executiveSummaryReport(range);
    case "daily_sales":
    default:
      return dailySalesReport(range);
  }
}

export function generateAllAnalyticsReports(
  range: AnalyticsTimeRange,
): AnalyticsReport[] {
  return [
    dailySalesReport(range),
    weeklyOperationsReport(range),
    inventoryRiskReport(range),
    deliveryPerformanceReport(range),
    courierPerformanceReport(range),
    notificationHealthReport(range),
    workflowHealthReport(range),
    executiveSummaryReport(range),
  ];
}

export function resetAnalyticsReportCounter(): void {
  reportCounter = 0;
}
