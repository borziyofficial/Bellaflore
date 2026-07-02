// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  AnalyticsMetric,
  AnalyticsMetricKind,
  AnalyticsEvent,
  AnalyticsEventKind,
  AnalyticsSnapshot,
  AnalyticsReport,
  AnalyticsReportKind,
  AnalyticsTimeRange,
  AnalyticsTimeRangeKind,
  AnalyticsTrend,
  AnalyticsTrendDirection,
  AnalyticsInsight,
  AnalyticsKpi,
  AnalyticsModuleSummary,
  AnalyticsModuleId,
  AnalyticsDashboardSummary,
  AnalyticsDashboardCard,
  AnalyticsAiBrainPayload,
  AnalyticsPeriodComparison,
  OrderAnalyticsMetrics,
  CatalogAnalyticsMetrics,
  InventoryAnalyticsMetrics,
  DeliveryAnalyticsMetrics,
  CourierAnalyticsMetrics,
  NotificationAnalyticsMetrics,
  WorkflowAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

export {
  resolveAnalyticsTimeRange,
  getPreviousAnalyticsTimeRange,
  isDateWithinAnalyticsRange,
  listAnalyticsTimeRangePresets,
} from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";

export {
  readAnalyticsOrderSnapshot,
  calculateOrderAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsOrderBridge";

export {
  readAnalyticsCatalogSnapshot,
  calculateCatalogAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsCatalogBridge";

export {
  readAnalyticsInventorySnapshot,
  calculateInventoryAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsInventoryBridge";

export {
  readAnalyticsCourierSnapshot,
  calculateCourierAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsCourierBridge";

export {
  readAnalyticsDeliverySnapshot,
  calculateDeliveryAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsDeliveryBridge";

export {
  readAnalyticsNotificationSnapshot,
  calculateNotificationAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsNotificationBridge";

export {
  readAnalyticsWorkflowSnapshot,
  calculateWorkflowAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsWorkflowBridge";

export {
  readAnalyticsAdminSnapshot,
} from "@/components/analyticsIntelligence/analyticsAdminBridge";

export {
  readAnalyticsAiBrainSnapshot,
  readAnalyticsAiBrainSummary,
} from "@/components/analyticsIntelligence/analyticsAiBrainBridge";

export {
  calculateKpis,
} from "@/components/analyticsIntelligence/analyticsKpiEngine";

export {
  comparePeriods,
  detectTrends,
} from "@/components/analyticsIntelligence/analyticsTrendEngine";

export {
  generateAnalyticsInsights,
  getExampleRiskInsight,
  resetAnalyticsInsightCounter,
} from "@/components/analyticsIntelligence/analyticsInsightEngine";

export {
  dailySalesReport,
  weeklyOperationsReport,
  inventoryRiskReport,
  deliveryPerformanceReport,
  courierPerformanceReport,
  notificationHealthReport,
  workflowHealthReport,
  executiveSummaryReport,
  buildAnalyticsReport,
  generateAllAnalyticsReports,
  resetAnalyticsReportCounter,
} from "@/components/analyticsIntelligence/analyticsReportEngine";

export {
  summarizeDashboardMetrics,
} from "@/components/analyticsIntelligence/analyticsDashboardFoundation";

export {
  buildAnalyticsAiBrainPayload,
  readAnalyticsSummaryForAiBrain,
} from "@/components/analyticsIntelligence/analyticsAiBrainFoundation";

export {
  collectAnalyticsSnapshot,
  getAnalyticsIntelligenceExample,
  runAnalyticsIntelligenceEngine,
} from "@/components/analyticsIntelligence/analyticsIntelligenceEngine";
