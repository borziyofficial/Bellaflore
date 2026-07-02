// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Courier catalog seed
// ==================================================
import { DEMO_COURIERS } from "@/components/couriers/courierModel";
import type { CourierProfile } from "@/components/courierIntelligence/courierIntelligenceTypes";

const DEFAULT_WORKING_HOURS = {
  startMinutes: 9 * 60,
  endMinutes: 22 * 60,
  timezone: "Europe/Moscow",
};

const MOSCOW_HUB = {
  latitude: 55.7558,
  longitude: 37.6176,
};

export const COURIER_INTELLIGENCE_CATALOG_SEED: CourierProfile[] =
  DEMO_COURIERS.map((courier, index) => ({
    id: courier.id,
    fullName: courier.fullName,
    phone: courier.phone,
    status: courier.isAvailable ? "available" : "offline",
    currentLocation: {
      latitude: MOSCOW_HUB.latitude + index * 0.015,
      longitude: MOSCOW_HUB.longitude + index * 0.01,
      accuracyMeters: 35,
      capturedAt: new Date().toISOString(),
      source: "manual_mock",
    },
    capacityOrders: index === 0 ? 4 : 3,
    activeOrderIds: [],
    supportedZoneIds: ["zone-a", "zone-b", "zone-c", "zone-d"],
    workingHours: DEFAULT_WORKING_HOURS,
    isBlocked: false,
    priorityScore: 70 - index * 5,
    metadata: {
      vehicleType: index % 2 === 0 ? "car" : "bike",
    },
  }));

export function getCourierCatalogSeed(): CourierProfile[] {
  return COURIER_INTELLIGENCE_CATALOG_SEED.map((profile) => ({
    ...profile,
    activeOrderIds: [...profile.activeOrderIds],
    supportedZoneIds: [...profile.supportedZoneIds],
  }));
}
