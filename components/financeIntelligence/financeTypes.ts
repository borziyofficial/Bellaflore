// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type RevenueKind =
  | "order"
  | "delivery_fee"
  | "gift_card"
  | "subscription"
  | "other";

export type ExpenseKind =
  | "supplier"
  | "courier"
  | "operational"
  | "marketing"
  | "refund"
  | "other";

export type RefundStatus = "pending" | "completed" | "rejected";

export type CashFlowDirection = "inflow" | "outflow";

export type FinanceAiPreparationStatus = "suggestion_only";

export type RevenueEntry = {
  id: string;
  kind: RevenueKind;
  orderId: string | null;
  title: string;
  amountRub: number;
  occurredAt: string;
  recordedAt: string;
};

export type ExpenseEntry = {
  id: string;
  kind: ExpenseKind;
  supplierId: string | null;
  courierId: string | null;
  title: string;
  amountRub: number;
  occurredAt: string;
  recordedAt: string;
};

export type RefundEntry = {
  id: string;
  orderId: string;
  amountRub: number;
  reason: string;
  status: RefundStatus;
  occurredAt: string;
  recordedAt: string;
};

export type CashFlowEntry = {
  id: string;
  direction: CashFlowDirection;
  title: string;
  amountRub: number;
  sourceKind: RevenueKind | ExpenseKind;
  sourceId: string;
  occurredAt: string;
};

export type DailyRevenueMetric = {
  date: string;
  totalRevenueRub: number;
  orderCount: number;
  averageOrderRub: number;
  deliveryFeeRub: number;
  refundRub: number;
  netRevenueRub: number;
};

export type MonthlyRevenueMetric = {
  month: string;
  totalRevenueRub: number;
  orderCount: number;
  averageOrderRub: number;
  deliveryFeeRub: number;
  refundRub: number;
  netRevenueRub: number;
};

export type MarginAnalyticsEntry = {
  id: string;
  productSku: string | null;
  productTitle: string;
  revenueRub: number;
  costRub: number;
  marginRub: number;
  marginPercent: number;
  periodLabel: string;
  calculatedAt: string;
};

export type CourierCostEntry = {
  id: string;
  courierId: string;
  courierName: string;
  deliveryCount: number;
  totalCostRub: number;
  averageCostRub: number;
  periodLabel: string;
  calculatedAt: string;
};

export type SupplierCostEntry = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseCount: number;
  totalCostRub: number;
  averageCostRub: number;
  periodLabel: string;
  calculatedAt: string;
};

export type OperationalExpenseSummary = {
  id: string;
  category: string;
  totalRub: number;
  entryCount: number;
  periodLabel: string;
  calculatedAt: string;
};

export type ProfitSummary = {
  totalRevenueRub: number;
  totalExpenseRub: number;
  totalRefundRub: number;
  grossProfitRub: number;
  netProfitRub: number;
  marginPercent: number;
  periodLabel: string;
  calculatedAt: string;
};

export type RefundStatistics = {
  totalRefunds: number;
  totalRefundRub: number;
  pendingRefunds: number;
  completedRefunds: number;
  rejectedRefunds: number;
  averageRefundRub: number;
  refundRatePercent: number;
  calculatedAt: string;
};

export type FinancialDashboardSnapshot = {
  profit: ProfitSummary;
  dailyRevenue: DailyRevenueMetric[];
  monthlyRevenue: MonthlyRevenueMetric[];
  marginAnalytics: MarginAnalyticsEntry[];
  courierCosts: CourierCostEntry[];
  supplierCosts: SupplierCostEntry[];
  operationalExpenses: OperationalExpenseSummary[];
  refundStatistics: RefundStatistics;
  cashFlow: CashFlowEntry[];
  generatedAt: string;
};

export type FinancialForecast = {
  id: string;
  periodLabel: string;
  projectedRevenueRub: number;
  projectedExpenseRub: number;
  projectedProfitRub: number;
  confidence: number;
  assumptions: string[];
  createdAt: string;
};

export type FinanceAiPreparation = {
  id: string;
  title: string;
  rationale: string;
  suggestedAction: string;
  projectedImpactRub: number | null;
  confidence: number;
  status: FinanceAiPreparationStatus;
  createdAt: string;
};

export type FinanceStatistics = {
  totalRevenueRub: number;
  totalExpenseRub: number;
  netProfitRub: number;
  marginPercent: number;
  dailyAverageRevenueRub: number;
  monthlyRevenueRub: number;
  refundRatePercent: number;
  courierCostRub: number;
  supplierCostRub: number;
  operationalExpenseRub: number;
  calculatedAt: string;
};

export type FinanceIntelligenceSnapshot = {
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  refunds: RefundEntry[];
  cashFlow: CashFlowEntry[];
  dailyRevenue: DailyRevenueMetric[];
  monthlyRevenue: MonthlyRevenueMetric[];
  marginAnalytics: MarginAnalyticsEntry[];
  courierCosts: CourierCostEntry[];
  supplierCosts: SupplierCostEntry[];
  operationalExpenses: OperationalExpenseSummary[];
  profit: ProfitSummary;
  refundStatistics: RefundStatistics;
  dashboard: FinancialDashboardSnapshot;
  forecasts: FinancialForecast[];
  aiPreparations: FinanceAiPreparation[];
  statistics: FinanceStatistics;
  generatedAt: string;
};

export type RevenueListFilters = {
  kind?: RevenueKind;
  orderId?: string;
  from?: string;
  to?: string;
};

export type ExpenseListFilters = {
  kind?: ExpenseKind;
  supplierId?: string;
  courierId?: string;
  from?: string;
  to?: string;
};

export type FinanceRegistryState = {
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  refunds: RefundEntry[];
  cashFlow: CashFlowEntry[];
  dailyRevenue: DailyRevenueMetric[];
  monthlyRevenue: MonthlyRevenueMetric[];
  marginAnalytics: MarginAnalyticsEntry[];
  courierCosts: CourierCostEntry[];
  supplierCosts: SupplierCostEntry[];
  operationalExpenses: OperationalExpenseSummary[];
  forecasts: FinancialForecast[];
  aiPreparations: FinanceAiPreparation[];
};

export type FinanceReadOnlySummary = {
  revenueCount: number;
  expenseCount: number;
  refundCount: number;
  netProfitRub: number;
  marginPercent: number;
};
