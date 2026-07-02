// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Profit calculator
// ==================================================
import { calculateTotalExpenses } from "@/components/financeIntelligence/expenseRegistry";
import { calculateTotalRevenue } from "@/components/financeIntelligence/revenueRegistry";
import type {
  MarginAnalyticsEntry,
  ProfitSummary,
} from "@/components/financeIntelligence/financeTypes";

export function calculateMarginPercent(revenueRub: number, costRub: number): number {
  if (revenueRub <= 0) {
    return 0;
  }

  return Math.round(((revenueRub - costRub) / revenueRub) * 1000) / 10;
}

export function calculateMarginRub(revenueRub: number, costRub: number): number {
  return revenueRub - costRub;
}

export function buildMarginAnalyticsEntry(input: {
  id: string;
  productSku: string | null;
  productTitle: string;
  revenueRub: number;
  costRub: number;
  periodLabel: string;
}): MarginAnalyticsEntry {
  const marginRub = calculateMarginRub(input.revenueRub, input.costRub);
  const marginPercent = calculateMarginPercent(input.revenueRub, input.costRub);

  return {
    id: input.id,
    productSku: input.productSku,
    productTitle: input.productTitle,
    revenueRub: input.revenueRub,
    costRub: input.costRub,
    marginRub,
    marginPercent,
    periodLabel: input.periodLabel,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateProfitSummary(input: {
  periodLabel: string;
  totalRefundRub?: number;
}): ProfitSummary {
  const totalRevenueRub = calculateTotalRevenue();
  const totalExpenseRub = calculateTotalExpenses();
  const totalRefundRub = input.totalRefundRub ?? 0;

  const grossProfitRub = totalRevenueRub - totalExpenseRub;
  const netProfitRub = grossProfitRub - totalRefundRub;
  const marginPercent = calculateMarginPercent(totalRevenueRub, totalExpenseRub + totalRefundRub);

  return {
    totalRevenueRub,
    totalExpenseRub,
    totalRefundRub,
    grossProfitRub,
    netProfitRub,
    marginPercent,
    periodLabel: input.periodLabel,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateAverageMarginPercent(entries: MarginAnalyticsEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const sum = entries.reduce((acc, e) => acc + e.marginPercent, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

export function findLowestMarginProduct(
  entries: MarginAnalyticsEntry[],
): MarginAnalyticsEntry | null {
  if (entries.length === 0) {
    return null;
  }

  return entries.reduce((lowest, current) =>
    current.marginPercent < lowest.marginPercent ? current : lowest,
  );
}

export function findHighestMarginProduct(
  entries: MarginAnalyticsEntry[],
): MarginAnalyticsEntry | null {
  if (entries.length === 0) {
    return null;
  }

  return entries.reduce((highest, current) =>
    current.marginPercent > highest.marginPercent ? current : highest,
  );
}

export function compareProfitPeriods(
  current: ProfitSummary,
  previous: ProfitSummary,
): {
  revenueChangeRub: number;
  revenueChangePercent: number;
  expenseChangeRub: number;
  profitChangeRub: number;
  marginChangePercent: number;
} {
  const revenueChangeRub = current.totalRevenueRub - previous.totalRevenueRub;
  const revenueChangePercent =
    previous.totalRevenueRub > 0
      ? Math.round((revenueChangeRub / previous.totalRevenueRub) * 1000) / 10
      : 0;

  const expenseChangeRub = current.totalExpenseRub - previous.totalExpenseRub;
  const profitChangeRub = current.netProfitRub - previous.netProfitRub;
  const marginChangePercent =
    Math.round((current.marginPercent - previous.marginPercent) * 10) / 10;

  return {
    revenueChangeRub,
    revenueChangePercent,
    expenseChangeRub,
    profitChangeRub,
    marginChangePercent,
  };
}
