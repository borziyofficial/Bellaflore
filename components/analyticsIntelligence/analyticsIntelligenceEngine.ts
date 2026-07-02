// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { readAnalyticsAdminSnapshot } from "@/components/analyticsIntelligence/analyticsAdminBridge";
import { readAnalyticsAiBrainSnapshot } from "@/components/analyticsIntelligence/analyticsAiBrainBridge";
import { readAnalyticsCatalogSnapshot, calculateCatalogAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCatalogBridge";
import { readAnalyticsCourierSnapshot, calculateCourierAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCourierBridge";
import { readAnalyticsDeliverySnapshot, calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { readAnalyticsInventorySnapshot, calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { readAnalyticsNotificationSnapshot, calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import { readAnalyticsOrderSnapshot, calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { readAnalyticsWorkflowSnapshot, calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
import { buildAnalyticsAiBrainPayload } from "@/components/analyticsIntelligence/analyticsAiBrainFoundation";
import { summarizeDashboardMetrics } from "@/components/analyticsIntelligence/analyticsDashboardFoundation";
import { generateAnalyticsInsights, getExampleRiskInsight } from "@/components/analyticsIntelligence/analyticsInsightEngine";
import { calculateKpis } from "@/components/analyticsIntelligence/analyticsKpiEngine";
import {
  buildAnalyticsReport,
  dailySalesReport,
  generateAllAnalyticsReports,
} from "@/components/analyticsIntelligence/analyticsReportEngine";
import { comparePeriods, detectTrends } from "@/components/analyticsIntelligence/analyticsTrendEngine";
import { resolveAnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import type {
  AnalyticsModuleSummary,
  AnalyticsSnapshot,
  AnalyticsTimeRange,
  AnalyticsTimeRangeKind,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

function buildModuleSummaries(range: AnalyticsTimeRange): AnalyticsModuleSummary[] {
  const orders = calculateOrderAnalyticsMetrics(range);
  const inventory = calculateInventoryAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const couriers = calculateCourierAnalyticsMetrics(range);
  const notifications = calculateNotificationAnalyticsMetrics(range);
  const workflow = calculateWorkflowAnalyticsMetrics(range);
  const catalog = calculateCatalogAnalyticsMetrics(range);

  const now = new Date().toISOString();

  return [
    {
      moduleId: "orderIntelligence",
      title: "Orders",
      status: orders.newOrders >= 3 ? "attention" : "healthy",
      metricCount: 10,
      highlightMetricId: "kpi-total-orders",
      summary: `${orders.totalOrders} orders, revenue ${orders.totalRevenue} RUB`,
      generatedAt: now,
    },
    {
      moduleId: "catalogEngine",
      title: "Catalog",
      status: catalog.lowPerformingProducts.length > 3 ? "attention" : "healthy",
      metricCount: 7,
      highlightMetricId: "kpi-addon-attach-rate",
      summary: `Top product: ${catalog.topPurchasedProducts[0]?.title ?? "—"}`,
      generatedAt: now,
    },
    {
      moduleId: "inventoryIntelligence",
      title: "Inventory",
      status:
        inventory.stockRiskLevel === "critical"
          ? "critical"
          : inventory.stockRiskLevel === "high"
            ? "attention"
            : "healthy",
      metricCount: 6,
      highlightMetricId: "kpi-stock-risk",
      summary: `Low stock ${inventory.lowStockItems}, risk ${inventory.stockRiskLevel}`,
      generatedAt: now,
    },
    {
      moduleId: "courierIntelligence",
      title: "Couriers",
      status: couriers.overloadedCouriers > 0 ? "attention" : "healthy",
      metricCount: 6,
      highlightMetricId: "kpi-courier-load",
      summary: `Available ${couriers.availableCouriers}, overloaded ${couriers.overloadedCouriers}`,
      generatedAt: now,
    },
    {
      moduleId: "deliveryIntelligence",
      title: "Delivery",
      status: delivery.delayedDeliveries > 0 ? "attention" : "healthy",
      metricCount: 7,
      highlightMetricId: "kpi-delivery-delay-risk",
      summary: `Active ${delivery.activeDeliveries}, delayed ${delivery.delayedDeliveries}`,
      generatedAt: now,
    },
    {
      moduleId: "notificationIntelligence",
      title: "Notifications",
      status: notifications.failedNotifications > 0 ? "attention" : "healthy",
      metricCount: 6,
      highlightMetricId: "kpi-notification-failure-rate",
      summary: `Failed ${notifications.failedNotifications}, rate ${notifications.notificationFailureRate}%`,
      generatedAt: now,
    },
    {
      moduleId: "workflowIntelligence",
      title: "Workflow",
      status:
        workflow.workflowRiskLevel === "critical"
          ? "critical"
          : workflow.failedWorkflows > 0
            ? "attention"
            : "healthy",
      metricCount: 6,
      highlightMetricId: "kpi-workflow-risk",
      summary: `Failed ${workflow.failedWorkflows}, manual review ${workflow.manualReviewCount}`,
      generatedAt: now,
    },
    {
      moduleId: "adminIntelligence",
      title: "Admin",
      status: "healthy",
      metricCount: 2,
      highlightMetricId: null,
      summary: "Admin dashboard bridge snapshot",
      generatedAt: now,
    },
    {
      moduleId: "aiBrain",
      title: "AI Brain",
      status: readAnalyticsAiBrainSnapshot(range).analysis.risks.length > 0
        ? "attention"
        : "healthy",
      metricCount: 4,
      highlightMetricId: null,
      summary: `${readAnalyticsAiBrainSnapshot(range).analysis.risks.length} risks detected`,
      generatedAt: now,
    },
  ];
}

export function collectAnalyticsSnapshot(
  rangeKind: AnalyticsTimeRangeKind = "today",
): AnalyticsSnapshot {
  const timeRange = resolveAnalyticsTimeRange(rangeKind);
  const trends = detectTrends(timeRange);
  const kpis = calculateKpis(timeRange, trends);

  return {
    id: `analytics-snapshot-${Date.now()}`,
    timeRange,
    collectedAt: new Date().toISOString(),
    moduleSummaries: buildModuleSummaries(timeRange),
    metrics: kpis.map((kpi) => ({
      id: kpi.id,
      label: kpi.title,
      value: kpi.value,
      kind: kpi.kind,
      unit:
        kpi.kind === "currency" ? "RUB" : kpi.kind === "percentage" ? "%" : null,
      moduleId: kpi.moduleId,
      trendDirection: kpi.trend?.direction ?? null,
      previousValue: kpi.trend?.previousValue ?? null,
    })),
    kpis,
    events: [],
    rawModules: {
      orderIntelligence: readAnalyticsOrderSnapshot(timeRange) as unknown as Record<string, unknown>,
      catalogEngine: readAnalyticsCatalogSnapshot(timeRange) as unknown as Record<string, unknown>,
      inventoryIntelligence: readAnalyticsInventorySnapshot(timeRange) as unknown as Record<string, unknown>,
      courierIntelligence: readAnalyticsCourierSnapshot(timeRange) as unknown as Record<string, unknown>,
      deliveryIntelligence: readAnalyticsDeliverySnapshot(timeRange) as unknown as Record<string, unknown>,
      notificationIntelligence: readAnalyticsNotificationSnapshot(timeRange) as unknown as Record<string, unknown>,
      workflowIntelligence: readAnalyticsWorkflowSnapshot(timeRange) as unknown as Record<string, unknown>,
      adminIntelligence: readAnalyticsAdminSnapshot(timeRange) as unknown as Record<string, unknown>,
      aiBrain: readAnalyticsAiBrainSnapshot(timeRange) as unknown as Record<string, unknown>,
    },
  };
}

export function getAnalyticsIntelligenceExample(
  rangeKind: AnalyticsTimeRangeKind = "today",
) {
  const snapshot = collectAnalyticsSnapshot(rangeKind);
  const range = snapshot.timeRange;
  const dailyReport = dailySalesReport(range);
  const riskInsight = getExampleRiskInsight(range);
  const dashboard = summarizeDashboardMetrics(range);
  const aiBrainPayload = buildAnalyticsAiBrainPayload(range);

  return {
    snapshot,
    kpis: snapshot.kpis,
    dailyReport,
    riskInsight,
    dashboard,
    aiBrainPayload,
    periodComparison: comparePeriods(range),
    reports: generateAllAnalyticsReports(range),
  };
}

export function runAnalyticsIntelligenceEngine(
  rangeKind: AnalyticsTimeRangeKind = "today",
) {
  const snapshot = collectAnalyticsSnapshot(rangeKind);

  return {
    snapshot,
    dashboard: summarizeDashboardMetrics(snapshot.timeRange),
    insights: generateAnalyticsInsights(snapshot.timeRange),
    reports: generateAllAnalyticsReports(snapshot.timeRange),
    aiBrainPayload: buildAnalyticsAiBrainPayload(snapshot.timeRange),
    periodComparison: comparePeriods(snapshot.timeRange),
    generatedAt: new Date().toISOString(),
  };
}

// Re-export core API functions for foundation
export {
  calculateKpis,
  buildAnalyticsReport,
  comparePeriods,
  detectTrends,
  generateAnalyticsInsights,
  summarizeDashboardMetrics,
};
