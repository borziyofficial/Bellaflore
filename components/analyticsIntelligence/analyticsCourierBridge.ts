// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Courier bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  CourierAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { readAiCourierSnapshot } from "@/components/aiBrain/aiCourierBridge";

export function readAnalyticsCourierSnapshot(range: AnalyticsTimeRange) {
  void range;
  return readAiCourierSnapshot();
}

export function calculateCourierAnalyticsMetrics(
  range: AnalyticsTimeRange,
): CourierAnalyticsMetrics {
  void range;
  const snapshot = readAiCourierSnapshot();
  const couriers = snapshot.summary.couriers;

  const totalLoad = couriers.reduce(
    (sum: number, courier) => sum + courier.currentLoad,
    0,
  );

  const averageCourierLoad =
    couriers.length > 0
      ? Math.round((totalLoad / couriers.length) * 10) / 10
      : 0;

  const courierPerformance = couriers.map((courier) => {
    const loadRatio =
      courier.capacityOrders > 0
        ? courier.currentLoad / courier.capacityOrders
        : 0;

    return {
      courierId: courier.id,
      name: courier.name,
      load: courier.currentLoad,
      score: Math.max(0, Math.round((1 - loadRatio) * 100)),
    };
  });

  const overloadedCount = snapshot.overloadedCourierIds.length;
  const courierDelayRisk =
    snapshot.summary.totalCouriers > 0
      ? Math.round((overloadedCount / snapshot.summary.totalCouriers) * 1000) / 10
      : 0;

  return {
    activeCouriers: snapshot.summary.activeCouriers,
    availableCouriers: snapshot.summary.availableCouriers,
    overloadedCouriers: overloadedCount,
    averageCourierLoad,
    courierPerformance,
    courierDelayRisk,
  };
}
