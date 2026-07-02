// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import { autoAssignCourier } from "@/components/courierIntelligence/autoAssignmentEngine";
import {
  getCourierStats,
  listCourierProfiles,
} from "@/components/courierIntelligence/courierAdminFoundation";
import { listCourierTimelineEvents } from "@/components/courierIntelligence/courierTimelineEngine";
import type { CourierAssignmentRequest } from "@/components/courierIntelligence/courierIntelligenceTypes";

export function runCourierIntelligenceEngine(
  assignmentRequest?: CourierAssignmentRequest,
) {
  const couriers = listCourierProfiles();

  return {
    couriers,
    timeline: listCourierTimelineEvents(),
    autoAssignment: assignmentRequest
      ? autoAssignCourier(assignmentRequest)
      : null,
    stats: couriers.map((courier) => getCourierStats(courier.id)).filter(Boolean),
    generatedAt: new Date().toISOString(),
  };
}

export function getCourierIntelligenceExampleAssignment(): CourierAssignmentRequest {
  return {
    orderId: "BF-1001",
    deliveryAddress: "Москва, ул. Тверская, 12",
    latitude: 55.757,
    longitude: 37.615,
    zoneId: "zone-b",
    deliveryDate: "2026-06-25",
    deliveryInterval: "14:00–16:00",
    priority: "high",
  };
}
