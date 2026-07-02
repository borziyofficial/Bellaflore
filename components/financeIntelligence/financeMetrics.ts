// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Finance metrics & analytics
// ==================================================
import { buildFinanceExampleRegistryState } from "@/components/financeIntelligence/financeExamples";
import {
  calculateCashFlowBalance,
  calculateTotalExpenses,
  listCashFlow,
  listCourierCosts,
  listOperationalExpenses,
  listRefunds,
  listSupplierCosts,
} from "@/components/financeIntelligence/expenseRegistry";
import {
  calculateAverageMarginPercent,
  calculateProfitSummary,
} from "@/components/financeIntelligence/profitEngine";
import {
  calculateTotalRevenue,
  listDailyRevenue,
  listMonthlyRevenue,
} from "@/components/financeIntelligence/revenueRegistry";
import type {
  FinanceAiPreparation,
  FinanceStatistics,
  FinancialDashboardSnapshot,
  FinancialForecast,
  RefundStatistics,
} from "@/components/financeIntelligence/financeTypes";

export const FINANCE_FORECAST_STORAGE_KEY =
  "bellaflore_finance_intelligence_forecast_v1";

export const FINANCE_AI_STORAGE_KEY =
  "bellaflore_finance_intelligence_ai_v1";

let inMemoryForecasts: FinancialForecast[] | null = null;
let inMemoryAi: FinanceAiPreparation[] | null = null;

function readForecastsFromStorage(): FinancialForecast[] {
  if (typeof window === "undefined") {
    return inMemoryForecasts ?? buildFinanceExampleRegistryState().forecasts;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_FORECAST_STORAGE_KEY);
    if (!raw) {
      return inMemoryForecasts ?? buildFinanceExampleRegistryState().forecasts;
    }

    const parsed = JSON.parse(raw) as FinancialForecast[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().forecasts;
  } catch {
    return inMemoryForecasts ?? buildFinanceExampleRegistryState().forecasts;
  }
}

function writeForecastsToStorage(forecasts: FinancialForecast[]): void {
  inMemoryForecasts = forecasts;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_FORECAST_STORAGE_KEY, JSON.stringify(forecasts));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): FinanceAiPreparation[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildFinanceExampleRegistryState().aiPreparations;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildFinanceExampleRegistryState().aiPreparations;
    }

    const parsed = JSON.parse(raw) as FinanceAiPreparation[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().aiPreparations;
  } catch {
    return inMemoryAi ?? buildFinanceExampleRegistryState().aiPreparations;
  }
}

function writeAiToStorage(preparations: FinanceAiPreparation[]): void {
  inMemoryAi = preparations;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_AI_STORAGE_KEY, JSON.stringify(preparations));
  } catch {
    // In-memory fallback remains active.
  }
}

export function calculateRefundStatistics(): RefundStatistics {
  const refunds = listRefunds();
  const completed = refunds.filter((r) => r.status === "completed");
  const pending = refunds.filter((r) => r.status === "pending");
  const rejected = refunds.filter((r) => r.status === "rejected");

  const totalRefundRub = completed.reduce((sum, r) => sum + r.amountRub, 0);
  const totalRevenueRub = calculateTotalRevenue();
  const averageRefundRub =
    completed.length > 0 ? Math.round(totalRefundRub / completed.length) : 0;

  const refundRatePercent =
    totalRevenueRub > 0
      ? Math.round((totalRefundRub / totalRevenueRub) * 1000) / 10
      : 0;

  return {
    totalRefunds: refunds.length,
    totalRefundRub,
    pendingRefunds: pending.length,
    completedRefunds: completed.length,
    rejectedRefunds: rejected.length,
    averageRefundRub,
    refundRatePercent,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateFinanceStatistics(): FinanceStatistics {
  const totalRevenueRub = calculateTotalRevenue();
  const totalExpenseRub = calculateTotalExpenses();
  const refundStats = calculateRefundStatistics();
  const netProfitRub = totalRevenueRub - totalExpenseRub - refundStats.totalRefundRub;

  const marginPercent =
    totalRevenueRub > 0
      ? Math.round((netProfitRub / totalRevenueRub) * 1000) / 10
      : 0;

  const dailyMetrics = listDailyRevenue();
  const dailyAverageRevenueRub =
    dailyMetrics.length > 0
      ? Math.round(
          dailyMetrics.reduce((sum, d) => sum + d.totalRevenueRub, 0) / dailyMetrics.length,
        )
      : 0;

  const monthlyMetrics = listMonthlyRevenue();
  const latestMonth = monthlyMetrics[monthlyMetrics.length - 1];
  const monthlyRevenueRub = latestMonth?.totalRevenueRub ?? 0;

  const courierCosts = listCourierCosts();
  const supplierCosts = listSupplierCosts();
  const operational = listOperationalExpenses();

  return {
    totalRevenueRub,
    totalExpenseRub,
    netProfitRub,
    marginPercent,
    dailyAverageRevenueRub,
    monthlyRevenueRub,
    refundRatePercent: refundStats.refundRatePercent,
    courierCostRub: courierCosts.reduce((sum, c) => sum + c.totalCostRub, 0),
    supplierCostRub: supplierCosts.reduce((sum, c) => sum + c.totalCostRub, 0),
    operationalExpenseRub: operational.reduce((sum, e) => sum + e.totalRub, 0),
    calculatedAt: new Date().toISOString(),
  };
}

export function buildFinancialDashboardSnapshot(
  at: Date = new Date(),
): FinancialDashboardSnapshot {
  const marginAnalytics = buildFinanceExampleRegistryState().marginAnalytics;
  const refundStatistics = calculateRefundStatistics();

  const profit = calculateProfitSummary({
    periodLabel: "2026-06",
    totalRefundRub: refundStatistics.totalRefundRub,
  });

  return {
    profit,
    dailyRevenue: listDailyRevenue(),
    monthlyRevenue: listMonthlyRevenue(),
    marginAnalytics,
    courierCosts: listCourierCosts(),
    supplierCosts: listSupplierCosts(),
    operationalExpenses: listOperationalExpenses(),
    refundStatistics,
    cashFlow: listCashFlow(),
    generatedAt: at.toISOString(),
  };
}

export function listFinancialForecasts(): FinancialForecast[] {
  return readForecastsFromStorage();
}

export function getFinancialForecastById(id: string): FinancialForecast | null {
  return readForecastsFromStorage().find((f) => f.id === id) ?? null;
}

export function listAiFinancePreparations(): FinanceAiPreparation[] {
  return readAiFromStorage();
}

export function getAiFinancePreparationById(id: string): FinanceAiPreparation | null {
  return readAiFromStorage().find((p) => p.id === id) ?? null;
}

export function registerFinancialForecast(forecast: FinancialForecast): FinancialForecast {
  const forecasts = readForecastsFromStorage();
  const index = forecasts.findIndex((f) => f.id === forecast.id);
  const next =
    index === -1
      ? [...forecasts, forecast]
      : forecasts.map((f, i) => (i === index ? forecast : f));

  writeForecastsToStorage(next);
  return forecast;
}

export function registerAiFinancePreparation(
  preparation: FinanceAiPreparation,
): FinanceAiPreparation {
  const items = readAiFromStorage();
  const index = items.findIndex((p) => p.id === preparation.id);
  const next =
    index === -1
      ? [...items, preparation]
      : items.map((p, i) => (i === index ? preparation : p));

  writeAiToStorage(next);
  return preparation;
}

export function seedFinanceMetricsRegistry(): void {
  const seed = buildFinanceExampleRegistryState();
  writeForecastsToStorage(seed.forecasts);
  writeAiToStorage(seed.aiPreparations);
}

export function clearFinanceMetricsRegistry(): void {
  writeForecastsToStorage([]);
  writeAiToStorage([]);
}

export function buildMarginAnalyticsSummary() {
  const entries = buildFinanceExampleRegistryState().marginAnalytics;

  return {
    entries,
    averageMarginPercent: calculateAverageMarginPercent(entries),
    entryCount: entries.length,
    generatedAt: new Date().toISOString(),
  };
}

export function buildCashFlowSummary(from?: string, to?: string) {
  const entries = listCashFlow(from, to);
  const inflows = entries.filter((e) => e.direction === "inflow");
  const outflows = entries.filter((e) => e.direction === "outflow");

  return {
    entries,
    totalInflowRub: inflows.reduce((sum, e) => sum + e.amountRub, 0),
    totalOutflowRub: outflows.reduce((sum, e) => sum + e.amountRub, 0),
    balanceRub: calculateCashFlowBalance(from, to),
    generatedAt: new Date().toISOString(),
  };
}
