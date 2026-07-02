// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Lifetime value engine
// ==================================================
import type {
  CustomerLifetimeValue,
  CustomerProfile,
  CustomerStatistics,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function resolveTier(score: number): CustomerLifetimeValue["tier"] {
  if (score >= 80) {
    return "platinum";
  }

  if (score >= 60) {
    return "gold";
  }

  if (score >= 35) {
    return "silver";
  }

  return "bronze";
}

export function calculateCustomerLifetimeValue(
  profile: CustomerProfile,
  statistics: CustomerStatistics = profile.statistics,
): CustomerLifetimeValue {
  const loyaltyMultiplier =
    profile.vipLevel >= 2 ? 1.4 : profile.vipLevel === 1 ? 1.2 : 1;

  const projectedAnnualValue =
    statistics.orderFrequencyDays && statistics.orderFrequencyDays > 0
      ? Math.round(
          (365 / statistics.orderFrequencyDays) * statistics.averageOrderValue,
        )
      : statistics.averageOrderValue;

  const score = Math.min(
    100,
    Math.round(
      statistics.totalRevenue / 1000 +
        statistics.repeatPurchaseScore * 0.4 +
        profile.vipLevel * 10,
    ),
  );

  return {
    totalRevenue: statistics.totalRevenue,
    projectedAnnualValue,
    orderCount: statistics.totalOrders,
    averageOrderValue: statistics.averageOrderValue,
    loyaltyMultiplier,
    score,
    tier: resolveTier(score),
    calculatedAt: new Date().toISOString(),
  };
}
