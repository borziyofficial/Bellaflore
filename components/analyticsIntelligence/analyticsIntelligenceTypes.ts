// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type AnalyticsTimeRangeKind =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "month_to_date"
  | "custom";

export type AnalyticsTimeRange = {
  kind: AnalyticsTimeRangeKind;
  label: string;
  startAt: string;
  endAt: string;
};

export type AnalyticsMetricKind =
  | "count"
  | "currency"
  | "percentage"
  | "duration"
  | "score"
  | "rate";

export type AnalyticsMetric = {
  id: string;
  label: string;
  value: number;
  kind: AnalyticsMetricKind;
  unit: string | null;
  moduleId: AnalyticsModuleId;
  trendDirection: AnalyticsTrendDirection | null;
  previousValue: number | null;
};

export type AnalyticsModuleId =
  | "orderIntelligence"
  | "catalogEngine"
  | "inventoryIntelligence"
  | "courierIntelligence"
  | "deliveryIntelligence"
  | "notificationIntelligence"
  | "workflowIntelligence"
  | "adminIntelligence"
  | "aiBrain";

export type AnalyticsEventKind =
  | "order_created"
  | "order_delivered"
  | "order_cancelled"
  | "delivery_completed"
  | "notification_sent"
  | "notification_failed"
  | "workflow_completed"
  | "workflow_failed"
  | "inventory_low_stock"
  | "analytics_snapshot_collected";

export type AnalyticsEvent = {
  id: string;
  kind: AnalyticsEventKind;
  moduleId: AnalyticsModuleId;
  resourceType: string | null;
  resourceId: string | null;
  value: number | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

export type AnalyticsTrendDirection = "up" | "down" | "flat";

export type AnalyticsTrend = {
  metricId: string;
  label: string;
  direction: AnalyticsTrendDirection;
  changePercent: number;
  currentValue: number;
  previousValue: number;
  periodLabel: string;
};

export type AnalyticsKpi = {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  kind: AnalyticsMetricKind;
  priority: "low" | "normal" | "high" | "critical";
  moduleId: AnalyticsModuleId;
  trend: AnalyticsTrend | null;
};

export type AnalyticsInsight = {
  id: string;
  category: "sales" | "operations" | "inventory" | "delivery" | "risk" | "growth";
  priority: "low" | "normal" | "high" | "critical";
  title: string;
  summary: string;
  moduleId: AnalyticsModuleId;
  metricIds: string[];
  createdAt: string;
};

export type AnalyticsModuleSummary = {
  moduleId: AnalyticsModuleId;
  title: string;
  status: "healthy" | "attention" | "critical";
  metricCount: number;
  highlightMetricId: string | null;
  summary: string;
  generatedAt: string;
};

export type AnalyticsSnapshot = {
  id: string;
  timeRange: AnalyticsTimeRange;
  collectedAt: string;
  moduleSummaries: AnalyticsModuleSummary[];
  metrics: AnalyticsMetric[];
  kpis: AnalyticsKpi[];
  events: AnalyticsEvent[];
  rawModules: Record<AnalyticsModuleId, Record<string, unknown>>;
};

export type AnalyticsReportKind =
  | "daily_sales"
  | "weekly_operations"
  | "inventory_risk"
  | "delivery_performance"
  | "courier_performance"
  | "notification_health"
  | "workflow_health"
  | "executive_summary";

export type AnalyticsReport = {
  id: string;
  kind: AnalyticsReportKind;
  title: string;
  timeRange: AnalyticsTimeRange;
  summary: string;
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  generatedAt: string;
};

export type AnalyticsDashboardSummary = {
  generatedAt: string;
  timeRange: AnalyticsTimeRange;
  cards: {
    revenue: AnalyticsDashboardCard;
    orders: AnalyticsDashboardCard;
    delivery: AnalyticsDashboardCard;
    inventory: AnalyticsDashboardCard;
    courier: AnalyticsDashboardCard;
    notification: AnalyticsDashboardCard;
    workflow: AnalyticsDashboardCard;
    risk: AnalyticsDashboardCard;
  };
};

export type AnalyticsDashboardCard = {
  id: string;
  title: string;
  primaryValue: string;
  secondaryValue: string | null;
  status: "healthy" | "attention" | "critical";
  trendDirection: AnalyticsTrendDirection | null;
};

export type AnalyticsAiBrainPayload = {
  analyticsSignals: Array<{
    id: string;
    title: string;
    priority: AnalyticsInsight["priority"];
    moduleId: AnalyticsModuleId;
  }>;
  analyticsRisks: Array<{
    id: string;
    title: string;
    priority: AnalyticsInsight["priority"];
    moduleId: AnalyticsModuleId;
  }>;
  analyticsRecommendations: Array<{
    id: string;
    title: string;
    rationale: string;
    moduleId: AnalyticsModuleId;
  }>;
  analyticsInsights: AnalyticsInsight[];
  generatedAt: string;
};

export type OrderAnalyticsMetrics = {
  totalOrders: number;
  newOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  averageOrderValue: number;
  totalRevenue: number;
  conversionEstimate: number;
  repeatCustomerEstimate: number;
};

export type CatalogAnalyticsMetrics = {
  topViewedProducts: Array<{ productId: string; title: string; score: number }>;
  topPurchasedProducts: Array<{ productId: string; title: string; count: number }>;
  topSearchedProducts: Array<{ query: string; score: number }>;
  lowPerformingProducts: Array<{ productId: string; title: string }>;
  favoriteProducts: Array<{ productId: string; title: string; score: number }>;
  addOnAttachRate: number;
  productConversionEstimate: number;
};

export type InventoryAnalyticsMetrics = {
  lowStockItems: number;
  outOfStockItems: number;
  fastMovingItems: string[];
  slowMovingItems: string[];
  replacementUsage: number;
  stockRiskLevel: "low" | "medium" | "high" | "critical";
};

export type DeliveryAnalyticsMetrics = {
  totalDeliveries: number;
  activeDeliveries: number;
  deliveredOnTime: number;
  delayedDeliveries: number;
  averageEta: number;
  deliveryDelayRisk: number;
  zonePerformance: Array<{ zoneId: string; taskCount: number; delayedCount: number }>;
};

export type CourierAnalyticsMetrics = {
  activeCouriers: number;
  availableCouriers: number;
  overloadedCouriers: number;
  averageCourierLoad: number;
  courierPerformance: Array<{ courierId: string; name: string; load: number; score: number }>;
  courierDelayRisk: number;
};

export type NotificationAnalyticsMetrics = {
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  retryCount: number;
  escalationCount: number;
  notificationFailureRate: number;
};

export type WorkflowAnalyticsMetrics = {
  activeWorkflows: number;
  failedWorkflows: number;
  completedWorkflows: number;
  manualReviewCount: number;
  averageWorkflowDuration: number;
  workflowRiskLevel: "low" | "medium" | "high" | "critical";
};

export type AnalyticsPeriodComparison = {
  currentRange: AnalyticsTimeRange;
  previousRange: AnalyticsTimeRange;
  trends: AnalyticsTrend[];
  summary: string;
};
