// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import {
  listCourierCosts,
  listExpenseEntries,
  listOperationalExpenses,
  listRefunds,
  listSupplierCosts,
  seedExpenseRegistry,
} from "@/components/financeIntelligence/expenseRegistry";
import { buildFinanceExampleRegistryState } from "@/components/financeIntelligence/financeExamples";
import {
  buildCashFlowSummary,
  buildFinancialDashboardSnapshot,
  buildMarginAnalyticsSummary,
  calculateFinanceStatistics,
  calculateRefundStatistics,
  listAiFinancePreparations,
  listFinancialForecasts,
  seedFinanceMetricsRegistry,
} from "@/components/financeIntelligence/financeMetrics";
import { calculateProfitSummary } from "@/components/financeIntelligence/profitEngine";
import {
  listDailyRevenue,
  listMonthlyRevenue,
  listRevenueEntries,
  seedRevenueRegistry,
} from "@/components/financeIntelligence/revenueRegistry";
import type {
  FinanceIntelligenceSnapshot,
  FinanceReadOnlySummary,
} from "@/components/financeIntelligence/financeTypes";

export const FINANCE_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_finance_intelligence_v1";

export function buildFinanceIntelligenceSnapshot(
  at: Date = new Date(),
): FinanceIntelligenceSnapshot {
  const refundStatistics = calculateRefundStatistics();
  const profit = calculateProfitSummary({
    periodLabel: "2026-06",
    totalRefundRub: refundStatistics.totalRefundRub,
  });

  return {
    revenue: listRevenueEntries(),
    expenses: listExpenseEntries(),
    refunds: listRefunds(),
    cashFlow: buildCashFlowSummary().entries,
    dailyRevenue: listDailyRevenue(),
    monthlyRevenue: listMonthlyRevenue(),
    marginAnalytics: buildMarginAnalyticsSummary().entries,
    courierCosts: listCourierCosts(),
    supplierCosts: listSupplierCosts(),
    operationalExpenses: listOperationalExpenses(),
    profit,
    refundStatistics,
    dashboard: buildFinancialDashboardSnapshot(at),
    forecasts: listFinancialForecasts(),
    aiPreparations: listAiFinancePreparations(),
    statistics: calculateFinanceStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeFinanceIntelligence(): FinanceIntelligenceSnapshot {
  seedRevenueRegistry();
  seedExpenseRegistry();
  seedFinanceMetricsRegistry();
  return buildFinanceIntelligenceSnapshot();
}

export function getFinanceIntelligenceExample() {
  return buildFinanceExampleRegistryState().revenue[0];
}

export function getFinanceReadOnlySummary(): FinanceReadOnlySummary {
  const statistics = calculateFinanceStatistics();

  return {
    revenueCount: listRevenueEntries().length,
    expenseCount: listExpenseEntries().length,
    refundCount: calculateRefundStatistics().totalRefunds,
    netProfitRub: statistics.netProfitRub,
    marginPercent: statistics.marginPercent,
  };
}

export function readFinanceFoundationCapabilities() {
  const refundStatistics = calculateRefundStatistics();

  return {
    revenueRegistry: listRevenueEntries(),
    expenseRegistry: listExpenseEntries(),
    profitCalculator: calculateProfitSummary({
      periodLabel: "2026-06",
      totalRefundRub: refundStatistics.totalRefundRub,
    }),
    marginAnalytics: buildMarginAnalyticsSummary(),
    cashFlow: buildCashFlowSummary(),
    dailyRevenue: listDailyRevenue(),
    monthlyRevenue: listMonthlyRevenue(),
    refundStatistics,
    courierCosts: listCourierCosts(),
    supplierCosts: listSupplierCosts(),
    operationalExpenses: listOperationalExpenses(),
    financialDashboard: buildFinancialDashboardSnapshot(),
    financialForecast: listFinancialForecasts(),
    aiFinancePreparation: listAiFinancePreparations(),
    financeStatistics: calculateFinanceStatistics(),
  };
}

export const FINANCE_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "financeIntelligence",
  storageKeys: [
    FINANCE_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_finance_intelligence_revenue_v1",
    "bellaflore_finance_intelligence_daily_revenue_v1",
    "bellaflore_finance_intelligence_monthly_revenue_v1",
    "bellaflore_finance_intelligence_expense_v1",
    "bellaflore_finance_intelligence_refund_v1",
    "bellaflore_finance_intelligence_cash_flow_v1",
    "bellaflore_finance_intelligence_courier_cost_v1",
    "bellaflore_finance_intelligence_supplier_cost_v1",
    "bellaflore_finance_intelligence_operational_v1",
    "bellaflore_finance_intelligence_forecast_v1",
    "bellaflore_finance_intelligence_ai_v1",
  ],
  capabilities: [
    "revenue_registry",
    "expense_registry",
    "profit_calculator",
    "margin_analytics",
    "cash_flow",
    "daily_revenue",
    "monthly_revenue",
    "refund_statistics",
    "courier_costs",
    "supplier_costs",
    "operational_expenses",
    "financial_dashboard",
    "financial_forecast",
    "ai_finance_preparation",
  ],
  layers: [
    { id: "types", file: "financeTypes.ts" },
    { id: "examples", file: "financeExamples.ts" },
    {
      id: "registries",
      files: ["revenueRegistry.ts", "expenseRegistry.ts", "financeMetrics.ts"],
    },
    { id: "profit", file: "profitEngine.ts" },
    { id: "engine", file: "financeEngine.ts" },
    { id: "foundation", file: "financeIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllFinanceFoundationCapabilities() {
  return readFinanceFoundationCapabilities();
}
