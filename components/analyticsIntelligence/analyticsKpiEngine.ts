// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: KPI engine
// ==================================================
import { calculateCatalogAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCatalogBridge";
import { calculateCourierAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsCourierBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { calculateInventoryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsInventoryBridge";
import { calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { calculateWorkflowAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsWorkflowBridge";
import type {
  AnalyticsKpi,
  AnalyticsTimeRange,
  AnalyticsTrend,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

function formatCurrency(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function buildKpi(
  input: Omit<AnalyticsKpi, "formattedValue"> & { formattedValue?: string },
): AnalyticsKpi {
  let formattedValue = input.formattedValue ?? String(input.value);

  if (!input.formattedValue) {
    if (input.kind === "currency") {
      formattedValue = formatCurrency(input.value);
    } else if (input.kind === "percentage") {
      formattedValue = formatPercent(input.value);
    }
  }

  return {
    ...input,
    formattedValue,
  };
}

export function calculateKpis(
  range: AnalyticsTimeRange,
  trends: AnalyticsTrend[] = [],
): AnalyticsKpi[] {
  const orders = calculateOrderAnalyticsMetrics(range);
  const delivery = calculateDeliveryAnalyticsMetrics(range);
  const inventory = calculateInventoryAnalyticsMetrics(range);
  const notifications = calculateNotificationAnalyticsMetrics(range);
  const workflow = calculateWorkflowAnalyticsMetrics(range);
  const catalog = calculateCatalogAnalyticsMetrics(range);
  const couriers = calculateCourierAnalyticsMetrics(range);

  const trendByMetric = new Map(trends.map((trend) => [trend.metricId, trend]));

  return [
    buildKpi({
      id: "kpi-total-revenue",
      title: "Выручка",
      value: orders.totalRevenue,
      kind: "currency",
      priority: orders.totalRevenue > 0 ? "normal" : "low",
      moduleId: "orderIntelligence",
      trend: trendByMetric.get("totalRevenue") ?? null,
    }),
    buildKpi({
      id: "kpi-total-orders",
      title: "Заказы",
      value: orders.totalOrders,
      kind: "count",
      priority: orders.newOrders > 0 ? "high" : "normal",
      moduleId: "orderIntelligence",
      trend: trendByMetric.get("totalOrders") ?? null,
    }),
    buildKpi({
      id: "kpi-conversion",
      title: "Конверсия заказов",
      value: orders.conversionEstimate,
      kind: "percentage",
      priority: orders.conversionEstimate < 30 ? "high" : "normal",
      moduleId: "orderIntelligence",
      trend: trendByMetric.get("conversionEstimate") ?? null,
    }),
    buildKpi({
      id: "kpi-average-order-value",
      title: "Средний чек",
      value: orders.averageOrderValue,
      kind: "currency",
      priority: "normal",
      moduleId: "orderIntelligence",
      trend: trendByMetric.get("averageOrderValue") ?? null,
    }),
    buildKpi({
      id: "kpi-delivery-delay-risk",
      title: "Риск задержки доставки",
      value: delivery.deliveryDelayRisk,
      kind: "percentage",
      priority: delivery.deliveryDelayRisk >= 20 ? "critical" : "normal",
      moduleId: "deliveryIntelligence",
      trend: trendByMetric.get("deliveryDelayRisk") ?? null,
    }),
    buildKpi({
      id: "kpi-stock-risk",
      title: "Риск склада",
      value:
        inventory.stockRiskLevel === "critical"
          ? 100
          : inventory.stockRiskLevel === "high"
            ? 75
            : inventory.stockRiskLevel === "medium"
              ? 50
              : 10,
      kind: "score",
      priority:
        inventory.stockRiskLevel === "critical"
          ? "critical"
          : inventory.stockRiskLevel === "high"
            ? "high"
            : "normal",
      moduleId: "inventoryIntelligence",
      trend: null,
    }),
    buildKpi({
      id: "kpi-notification-failure-rate",
      title: "Ошибки уведомлений",
      value: notifications.notificationFailureRate,
      kind: "percentage",
      priority: notifications.notificationFailureRate > 10 ? "high" : "normal",
      moduleId: "notificationIntelligence",
      trend: trendByMetric.get("notificationFailureRate") ?? null,
    }),
    buildKpi({
      id: "kpi-addon-attach-rate",
      title: "Attach rate add-ons",
      value: catalog.addOnAttachRate,
      kind: "percentage",
      priority: "normal",
      moduleId: "catalogEngine",
      trend: null,
    }),
    buildKpi({
      id: "kpi-courier-load",
      title: "Средняя загрузка курьеров",
      value: couriers.averageCourierLoad,
      kind: "score",
      priority: couriers.overloadedCouriers > 0 ? "high" : "normal",
      moduleId: "courierIntelligence",
      trend: null,
    }),
    buildKpi({
      id: "kpi-workflow-risk",
      title: "Workflow risk",
      value:
        workflow.workflowRiskLevel === "critical"
          ? 100
          : workflow.workflowRiskLevel === "high"
            ? 75
            : workflow.workflowRiskLevel === "medium"
              ? 50
              : 10,
      kind: "score",
      priority:
        workflow.workflowRiskLevel === "critical" ? "critical" : "normal",
      moduleId: "workflowIntelligence",
      trend: null,
    }),
  ];
}
