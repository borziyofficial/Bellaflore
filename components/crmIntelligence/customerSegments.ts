// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Customer segments
// ==================================================
import { listCrmCustomers } from "@/components/crmIntelligence/customerRegistry";
import type {
  CrmCustomerProfile,
  CrmCustomerSegment,
  CrmLifetimeValue,
} from "@/components/crmIntelligence/crmTypes";

export const CRM_CUSTOMER_SEGMENTS: CrmCustomerSegment[] = [
  "new_customer",
  "repeat_customer",
  "vip_customer",
  "at_risk_customer",
  "inactive_customer",
  "high_value_customer",
  "gift_buyer",
  "corporate_customer",
];

export function getSegmentLabel(segment: CrmCustomerSegment): string {
  const labels: Record<CrmCustomerSegment, string> = {
    new_customer: "Новый клиент",
    repeat_customer: "Постоянный клиент",
    vip_customer: "VIP",
    at_risk_customer: "At risk",
    inactive_customer: "Неактивный",
    high_value_customer: "High value",
    gift_buyer: "Покупает в подарок",
    corporate_customer: "Корпоративный",
  };

  return labels[segment];
}

export function detectCustomerSegment(profile: CrmCustomerProfile): CrmCustomerSegment {
  if (profile.tags.includes("corporate")) {
    return "corporate_customer";
  }

  if (profile.vipLevel >= 2 || profile.tags.includes("vip")) {
    return "vip_customer";
  }

  if (profile.tags.includes("at_risk") || profile.segment === "at_risk_customer") {
    return "at_risk_customer";
  }

  if (
    profile.lastOrderAt &&
    Date.now() - new Date(profile.lastOrderAt).getTime() > 120 * 24 * 60 * 60 * 1000
  ) {
    return "inactive_customer";
  }

  if (profile.totalSpendRub >= 50000 || profile.lifetimeValueScore >= 80) {
    return "high_value_customer";
  }

  if (profile.tags.includes("gift_buyer")) {
    return "gift_buyer";
  }

  if (profile.totalOrders <= 1) {
    return "new_customer";
  }

  return "repeat_customer";
}

export function filterCustomersBySegment(
  segment: CrmCustomerSegment | CrmCustomerSegment[],
): CrmCustomerProfile[] {
  const segments = Array.isArray(segment) ? segment : [segment];
  return listCrmCustomers().filter((c) => segments.includes(c.segment));
}

export function calculateCustomerLifetimeValue(
  customerId: string,
): CrmLifetimeValue | null {
  const customer = listCrmCustomers().find((c) => c.id === customerId);
  if (!customer) {
    return null;
  }

  const averageOrderValueRub =
    customer.totalOrders > 0
      ? Math.round(customer.totalSpendRub / customer.totalOrders)
      : 0;

  let projectedAnnualValueRub = averageOrderValueRub * 4;
  if (customer.firstOrderAt && customer.lastOrderAt && customer.totalOrders >= 2) {
    const days = Math.max(
      1,
      (new Date(customer.lastOrderAt).getTime() -
        new Date(customer.firstOrderAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    projectedAnnualValueRub = Math.round(
      (365 / days) * customer.totalSpendRub,
    );
  }

  const score = customer.lifetimeValueScore;
  const tier: CrmLifetimeValue["tier"] =
    score >= 90 ? "platinum" : score >= 70 ? "gold" : score >= 45 ? "silver" : "bronze";

  return {
    customerId,
    totalSpendRub: customer.totalSpendRub,
    totalOrders: customer.totalOrders,
    averageOrderValueRub,
    projectedAnnualValueRub,
    score,
    tier,
    calculatedAt: new Date().toISOString(),
  };
}

export function listAtRiskCustomers(): CrmCustomerProfile[] {
  return listCrmCustomers().filter(
    (c) =>
      c.segment === "at_risk_customer" ||
      c.tags.includes("at_risk") ||
      detectCustomerSegment(c) === "at_risk_customer",
  );
}

export function listHighValueCustomers(): CrmCustomerProfile[] {
  return listCrmCustomers().filter(
    (c) => c.segment === "high_value_customer" || c.lifetimeValueScore >= 75,
  );
}
