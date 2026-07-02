// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Risk engine
// ==================================================
import type {
  CustomerProfile,
  CustomerRiskScore,
  CustomerStatistics,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export function calculateCustomerRiskScore(
  profile: CustomerProfile,
  statistics: CustomerStatistics = profile.statistics,
): CustomerRiskScore {
  const reasons: string[] = [];
  let score = 0;

  if (statistics.cancelledOrders > 0) {
    score += 20;
    reasons.push("Есть отменённые заказы");
  }

  if (
    statistics.lastOrderDate &&
    Date.now() - new Date(statistics.lastOrderDate).getTime() > 90 * 24 * 60 * 60 * 1000
  ) {
    score += 25;
    reasons.push("Долго не заказывал");
  }

  if (statistics.totalOrders === 0) {
    score += 10;
    reasons.push("Нет истории заказов");
  }

  if (statistics.repeatPurchaseScore < 40 && statistics.totalOrders > 0) {
    score += 15;
    reasons.push("Низкий repeat score");
  }

  const level: CustomerRiskScore["level"] =
    score >= 60 ? "critical" : score >= 40 ? "high" : score >= 20 ? "medium" : "low";

  return {
    score: Math.min(100, score),
    level,
    reasons,
    calculatedAt: new Date().toISOString(),
  };
}
