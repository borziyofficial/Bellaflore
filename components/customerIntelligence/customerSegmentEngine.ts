// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Segment engine
// ==================================================
import type {
  CustomerProfile,
  CustomerSegment,
  CustomerStatistics,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  "new_customer",
  "returning_customer",
  "vip_customer",
  "corporate_customer",
  "inactive_customer",
  "high_value_customer",
  "at_risk_customer",
  "gift_buyer",
  "seasonal_buyer",
];

export function detectCustomerSegment(
  profile: CustomerProfile,
  statistics: CustomerStatistics = profile.statistics,
): CustomerSegment {
  if (profile.tags.includes("corporate")) {
    return "corporate_customer";
  }

  if (profile.vipLevel >= 2 || profile.tags.includes("vip")) {
    return "vip_customer";
  }

  if (profile.riskScore.level === "high" || profile.riskScore.level === "critical") {
    return "at_risk_customer";
  }

  if (
    statistics.lastOrderDate &&
    Date.now() - new Date(statistics.lastOrderDate).getTime() > 120 * 24 * 60 * 60 * 1000
  ) {
    return "inactive_customer";
  }

  if (statistics.totalRevenue >= 50000) {
    return "high_value_customer";
  }

  if (profile.recipients.length > 0 || profile.tags.includes("gift_buyer")) {
    return "gift_buyer";
  }

  if (profile.tags.includes("seasonal")) {
    return "seasonal_buyer";
  }

  if (statistics.totalOrders <= 1) {
    return "new_customer";
  }

  return "returning_customer";
}

export function getSegmentLabel(segment: CustomerSegment): string {
  const labels: Record<CustomerSegment, string> = {
    new_customer: "Новый клиент",
    returning_customer: "Постоянный клиент",
    vip_customer: "VIP",
    corporate_customer: "Корпоративный",
    inactive_customer: "Неактивный",
    high_value_customer: "High value",
    at_risk_customer: "At risk",
    gift_buyer: "Покупает в подарок",
    seasonal_buyer: "Сезонный",
  };

  return labels[segment];
}
