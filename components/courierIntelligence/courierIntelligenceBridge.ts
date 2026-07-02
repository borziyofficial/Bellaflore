// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Safe integration bridges
// ==================================================
import type { Courier } from "@/components/couriers/courierModel";
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import { autoAssignCourier } from "@/components/courierIntelligence/autoAssignmentEngine";
import { buildMultiOrderRoute, buildSingleOrderRoute } from "@/components/courierIntelligence/routeFoundationEngine";
import { getCourierProfileById, listCourierProfiles } from "@/components/courierIntelligence/courierAdminFoundation";
import type {
  CourierAssignmentRequest,
  CourierAutoAssignmentResult,
  CourierProfile,
  CourierRoutePlan,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

export function mapLegacyCourierToProfile(legacyCourier: Courier): CourierProfile | null {
  return getCourierProfileById(legacyCourier.id);
}

export function buildAssignmentRequestFromOrderIntelligence(
  orderId: string,
  priority: CourierAssignmentRequest["priority"] = "normal",
): CourierAssignmentRequest | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    deliveryAddress: order.delivery.address,
    latitude: order.delivery.latitude ?? null,
    longitude: order.delivery.longitude ?? null,
    zoneId: order.delivery.zoneId ?? null,
    deliveryDate: order.delivery.deliveryDate,
    deliveryInterval: order.delivery.deliveryInterval,
    priority,
  };
}

export function suggestCourierForOrderIntelligence(
  orderId: string,
): CourierAutoAssignmentResult | null {
  const request = buildAssignmentRequestFromOrderIntelligence(orderId);
  if (!request) {
    return null;
  }

  return autoAssignCourier(request);
}

export function buildRoutePlanForCourierOrders(
  courierId: string,
  orderIds: string[],
): CourierRoutePlan | null {
  const courier = getCourierProfileById(courierId);
  if (!courier) {
    return null;
  }

  const stops = orderIds
    .map((orderId) => {
      const order = getOrderById(orderId);
      if (!order) {
        return null;
      }

      return {
        orderId: order.id,
        address: order.delivery.address,
        latitude: order.delivery.latitude ?? null,
        longitude: order.delivery.longitude ?? null,
      };
    })
    .filter((stop): stop is NonNullable<typeof stop> => stop !== null);

  if (stops.length === 0) {
    return null;
  }

  if (stops.length === 1) {
    return buildSingleOrderRoute(courierId, stops[0], courier.currentLocation);
  }

  return buildMultiOrderRoute(
    courierId,
    stops,
    courier.currentLocation,
    true,
  );
}

export function listCourierIntelligenceProfiles(): CourierProfile[] {
  return listCourierProfiles();
}

export type CourierIntelligenceIntegrationSlot = {
  id: string;
  label: string;
  bridge: string;
};

export const COURIER_INTELLIGENCE_INTEGRATION_SLOTS: CourierIntelligenceIntegrationSlot[] = [
  {
    id: "order_intelligence_assignment",
    label: "Suggest courier from Order Intelligence",
    bridge: "suggestCourierForOrderIntelligence",
  },
  {
    id: "order_intelligence_route",
    label: "Build route plan from Order Intelligence orders",
    bridge: "buildRoutePlanForCourierOrders",
  },
  {
    id: "legacy_courier_model",
    label: "Map legacy courier model to intelligence profile",
    bridge: "mapLegacyCourierToProfile",
  },
];
