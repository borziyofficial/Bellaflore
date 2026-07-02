// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Order delivery bridge
// ==================================================
import { getOrderById } from "@/components/orderIntelligence/orderStoreEngine";
import {
  buildDeliveryTaskId,
  createDeliveryTask,
  mapOrderPriorityToDeliveryPriority,
} from "@/components/deliveryIntelligence/deliveryTaskEngine";
import { calculateDeliveryEta } from "@/components/deliveryIntelligence/deliveryEtaEngine";
import type { DeliveryTask } from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export function buildDeliveryTaskFromOrder(orderId: string): DeliveryTask | null {
  const order = getOrderById(orderId);
  if (!order) {
    return null;
  }

  const coordinates =
    order.delivery.latitude != null && order.delivery.longitude != null
      ? {
          latitude: order.delivery.latitude,
          longitude: order.delivery.longitude,
        }
      : null;

  const priority = mapOrderPriorityToDeliveryPriority(order.payment.totalRub);
  const courierId = order.delivery.courierId ?? null;

  const task: DeliveryTask = {
    id: buildDeliveryTaskId(orderId),
    orderId: order.id,
    courierId,
    address: order.delivery.address,
    coordinates,
    deliveryZoneId: order.delivery.zoneId ?? null,
    deliveryPriceRub: order.delivery.deliveryPriceRub ?? order.payment.deliveryRub,
    deliveryDate: order.delivery.deliveryDate,
    deliveryInterval: order.delivery.deliveryInterval,
    priority,
    status: courierId ? "courier_assigned" : "scheduled",
    eta: calculateDeliveryEta({
      coordinates,
      courierId,
      deliveryZoneId: order.delivery.zoneId ?? null,
      deliveryInterval: order.delivery.deliveryInterval,
      priority,
    }),
    routePlanId: null,
    assignment: courierId
      ? {
          courierId,
          courierName: order.delivery.courierName ?? courierId,
          assignedAt: order.delivery.assignedAt ?? new Date().toISOString(),
          deliveryEta: null,
        }
      : null,
    timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveredAt: null,
    cancelledAt: null,
  };

  return task;
}

export function createDeliveryTaskFromOrder(orderId: string): DeliveryTask | null {
  const task = buildDeliveryTaskFromOrder(orderId);
  if (!task) {
    return null;
  }

  return createDeliveryTask(task);
}

export function getExampleDeliveryTask(): DeliveryTask {
  return {
    id: "DLV-BF-1001",
    orderId: "BF-1001",
    courierId: "courier-ali",
    address: "Москва, ул. Тверская, 12",
    coordinates: { latitude: 55.757, longitude: 37.615 },
    deliveryZoneId: "7km",
    deliveryPriceRub: 1290,
    deliveryDate: "2026-06-25",
    deliveryInterval: "14:00–16:00",
    priority: "high",
    status: "courier_assigned",
    eta: calculateDeliveryEta({
      coordinates: { latitude: 55.757, longitude: 37.615 },
      courierId: "courier-ali",
      deliveryZoneId: "7km",
      deliveryInterval: "14:00–16:00",
      priority: "high",
    }),
    routePlanId: "ROUTE-courier-ali-BF-1001",
    assignment: {
      courierId: "courier-ali",
      courierName: "Ali",
      assignedAt: new Date().toISOString(),
      deliveryEta: null,
    },
    timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveredAt: null,
    cancelledAt: null,
  };
}
