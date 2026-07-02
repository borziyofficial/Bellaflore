// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Analytics bridge (read-only)
// ==================================================
import { calculateOrderAnalyticsMetrics } from "@/components/analyticsIntelligence/analyticsOrderBridge";
import { resolveAnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { readOrderCustomerSnapshot } from "@/components/customerIntelligence/orderCustomerBridge";

export function readAnalyticsCustomerSnapshot(customerId: string) {
  const orderSnapshot = readOrderCustomerSnapshot(customerId);
  const market = calculateOrderAnalyticsMetrics(resolveAnalyticsTimeRange("last_30_days"));

  return {
    customerId,
    customerOrders: orderSnapshot.totalOrders,
    customerRevenue: orderSnapshot.totalRevenue,
    marketAverageOrderValue: market.averageOrderValue,
    marketConversionEstimate: market.conversionEstimate,
    generatedAt: new Date().toISOString(),
  };
}

export function buildAnalyticsCustomerInsight(customerId: string) {
  const snapshot = readAnalyticsCustomerSnapshot(customerId);

  return {
    aboveMarketAov:
      snapshot.customerRevenue > 0 &&
      snapshot.customerOrders > 0 &&
      snapshot.customerRevenue / snapshot.customerOrders >
        snapshot.marketAverageOrderValue,
    repeatPotential: snapshot.customerOrders >= 2,
  };
}
