// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Trend engine
// ==================================================
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { calculateDeliveryAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsDeliveryBridge";
import { calculateNotificationAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsNotificationBridge";
import type {
  AnalyticsPeriodComparison,
  AnalyticsTimeRange,
  AnalyticsTrend,
  AnalyticsTrendDirection,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { getPreviousAnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";

function computeTrendDirection(
  current: number,
  previous: number,
): AnalyticsTrendDirection {
  if (current === previous) {
    return "flat";
  }

  return current > previous ? "up" : "down";
}

function computeChangePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildTrend(
  metricId: string,
  label: string,
  currentValue: number,
  previousValue: number,
  periodLabel: string,
): AnalyticsTrend {
  return {
    metricId,
    label,
    direction: computeTrendDirection(currentValue, previousValue),
    changePercent: computeChangePercent(currentValue, previousValue),
    currentValue,
    previousValue,
    periodLabel,
  };
}

export function comparePeriods(
  currentRange: AnalyticsTimeRange,
): AnalyticsPeriodComparison {
  const previousRange = getPreviousAnalyticsTimeRange(currentRange);
  const trends = detectTrends(currentRange, previousRange);

  const revenueTrend = trends.find((trend) => trend.metricId === "totalRevenue");
  const ordersTrend = trends.find((trend) => trend.metricId === "totalOrders");

  const summary = [
    revenueTrend
      ? `Выручка ${revenueTrend.direction === "up" ? "↑" : revenueTrend.direction === "down" ? "↓" : "→"} ${Math.abs(revenueTrend.changePercent)}%`
      : null,
    ordersTrend
      ? `Заказы ${ordersTrend.direction === "up" ? "↑" : ordersTrend.direction === "down" ? "↓" : "→"} ${Math.abs(ordersTrend.changePercent)}%`
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    currentRange,
    previousRange,
    trends,
    summary: summary || "Изменений между периодами не обнаружено",
  };
}

export function detectTrends(
  currentRange: AnalyticsTimeRange,
  previousRange: AnalyticsTimeRange = getPreviousAnalyticsTimeRange(currentRange),
): AnalyticsTrend[] {
  const currentOrders = calculateOrderAnalyticsMetrics(currentRange);
  const previousOrders = calculateOrderAnalyticsMetrics(previousRange);
  const currentDelivery = calculateDeliveryAnalyticsMetrics(currentRange);
  const previousDelivery = calculateDeliveryAnalyticsMetrics(previousRange);
  const currentNotifications = calculateNotificationAnalyticsMetrics(currentRange);
  const previousNotifications = calculateNotificationAnalyticsMetrics(previousRange);

  return [
    buildTrend(
      "totalRevenue",
      "Выручка",
      currentOrders.totalRevenue,
      previousOrders.totalRevenue,
      previousRange.label,
    ),
    buildTrend(
      "totalOrders",
      "Заказы",
      currentOrders.totalOrders,
      previousOrders.totalOrders,
      previousRange.label,
    ),
    buildTrend(
      "conversionEstimate",
      "Конверсия",
      currentOrders.conversionEstimate,
      previousOrders.conversionEstimate,
      previousRange.label,
    ),
    buildTrend(
      "averageOrderValue",
      "Средний чек",
      currentOrders.averageOrderValue,
      previousOrders.averageOrderValue,
      previousRange.label,
    ),
    buildTrend(
      "deliveryDelayRisk",
      "Риск задержки",
      currentDelivery.deliveryDelayRisk,
      previousDelivery.deliveryDelayRisk,
      previousRange.label,
    ),
    buildTrend(
      "notificationFailureRate",
      "Ошибки уведомлений",
      currentNotifications.notificationFailureRate,
      previousNotifications.notificationFailureRate,
      previousRange.label,
    ),
  ];
}
