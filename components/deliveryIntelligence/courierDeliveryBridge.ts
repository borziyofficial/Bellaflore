// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Courier delivery bridge
// ==================================================
import { getCourierProfileById } from "@/components/courierIntelligence/courierAdminFoundation";
import { buildRoutePlanForCourierOrders } from "@/components/courierIntelligence/courierIntelligenceBridge";
import { getDeliveryTaskByOrderId } from "@/components/deliveryIntelligence/deliveryTaskEngine";
import type {
  DeliveryRoutePlan,
  DeliveryTask,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export function buildDeliveryRoutePlanForTask(
  task: DeliveryTask,
): DeliveryRoutePlan | null {
  const courierRoute = task.courierId
    ? buildRoutePlanForCourierOrders(task.courierId, [task.orderId])
    : null;

  if (!courierRoute) {
    return {
      routePlanId: `ROUTE-${task.orderId}`,
      courierId: task.courierId,
      orderIds: [task.orderId],
      stopCount: 1,
      totalDistanceKm: null,
      totalEtaMinutes: task.eta?.estimatedMinutesMax ?? null,
      optimized: false,
    };
  }

  return {
    routePlanId: courierRoute.routeId,
    courierId: courierRoute.courierId,
    orderIds: courierRoute.stops.map((stop) => stop.orderId),
    stopCount: courierRoute.stops.length,
    totalDistanceKm: courierRoute.totalDistanceKm,
    totalEtaMinutes: courierRoute.totalEtaMinutes,
    optimized: courierRoute.optimized,
  };
}

export function enrichDeliveryTaskWithCourierContext(
  task: DeliveryTask,
): DeliveryTask & {
  courierProfileName: string | null;
  routePlan: DeliveryRoutePlan | null;
} {
  const courier = task.courierId
    ? getCourierProfileById(task.courierId)
    : null;

  return {
    ...task,
    courierProfileName: courier?.fullName ?? null,
    routePlan: buildDeliveryRoutePlanForTask(task),
  };
}

export function buildCourierDeliverySnapshot(orderId: string) {
  const task = getDeliveryTaskByOrderId(orderId);
  if (!task) {
    return null;
  }

  return enrichDeliveryTaskWithCourierContext(task);
}
