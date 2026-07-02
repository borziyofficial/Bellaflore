// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic. (admin route planning).
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов. (admin route planning).
// ==================================================
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import {
  getAdminOrderDeliveryDayTimestamp,
  resolveDeliveryPlannerInterval,
} from "@/components/admin/adminDeliveryPlanner";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { getDemoCouriers } from "@/components/couriers/courierModel";
import { getOrderStatus } from "@/components/orders/orderStatus";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type RoutePlanningWarning =
  | "missing-address"
  | "missing-interval"
  | "interval-overlap";

export type RoutePlanningStop = {
  position: number;
  order: AdminOrderRecord;
  warnings: RoutePlanningWarning[];
};

export type RoutePlanningCourierRoute = {
  courierId: string;
  courierName: string;
  activeStops: RoutePlanningStop[];
  completedStops: RoutePlanningStop[];
};

export type RoutePlanningSummary = {
  totalActiveDeliveries: number;
  completedDeliveries: number;
  warningCount: number;
};

export type RoutePlanningPlan = {
  courierRoutes: RoutePlanningCourierRoute[];
  summary: RoutePlanningSummary;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getReferenceDayTimestamp(referenceDate: Date): number {
  return Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
}

function isInRoutePlanningWindow(
  order: AdminOrderRecord,
  referenceDate: Date,
): boolean {
  const deliveryDay = getAdminOrderDeliveryDayTimestamp(order);

  if (deliveryDay === null) {
    return false;
  }

  return deliveryDay >= getReferenceDayTimestamp(referenceDate);
}

function getIntervalStartMinutes(intervalLabel: string | null): number {
  if (!intervalLabel) {
    return Number.MAX_SAFE_INTEGER;
  }

  const matchedInterval = deliveryIntervals.find(
    (interval) => interval.label === intervalLabel,
  );

  return matchedInterval?.startMinutes ?? Number.MAX_SAFE_INTEGER;
}

function getCreatedAtTimestamp(order: AdminOrderRecord): number {
  const createdAt = new Date(order.createdAt).getTime();

  return Number.isNaN(createdAt) ? 0 : createdAt;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function sortOrdersForRoutePlanning(
  orders: AdminOrderRecord[],
): AdminOrderRecord[] {
  return [...orders].sort((firstOrder, secondOrder) => {
    const firstDay =
      getAdminOrderDeliveryDayTimestamp(firstOrder) ?? Number.MAX_SAFE_INTEGER;
    const secondDay =
      getAdminOrderDeliveryDayTimestamp(secondOrder) ?? Number.MAX_SAFE_INTEGER;

    if (firstDay !== secondDay) {
      return firstDay - secondDay;
    }

    const firstIntervalStart = getIntervalStartMinutes(
      resolveDeliveryPlannerInterval(firstOrder.deliveryTime),
    );
    const secondIntervalStart = getIntervalStartMinutes(
      resolveDeliveryPlannerInterval(secondOrder.deliveryTime),
    );

    if (firstIntervalStart !== secondIntervalStart) {
      return firstIntervalStart - secondIntervalStart;
    }

    return getCreatedAtTimestamp(firstOrder) - getCreatedAtTimestamp(secondOrder);
  });
}

function buildOverlapKeys(orders: AdminOrderRecord[]): Set<string> {
  const assignmentCounts = new Map<string, number>();

  for (const order of orders) {
    const courierId = order.assignedCourierId?.trim();
    const deliveryDay = getAdminOrderDeliveryDayTimestamp(order);
    const intervalLabel = resolveDeliveryPlannerInterval(order.deliveryTime);

    if (!courierId || deliveryDay === null || !intervalLabel) {
      continue;
    }

    const overlapKey = [courierId, deliveryDay, intervalLabel].join("|");
    assignmentCounts.set(overlapKey, (assignmentCounts.get(overlapKey) ?? 0) + 1);
  }

  const overlappingKeys = new Set<string>();

  for (const [overlapKey, count] of assignmentCounts.entries()) {
    if (count > 1) {
      overlappingKeys.add(overlapKey);
    }
  }

  return overlappingKeys;
}

function buildRouteWarnings(
  order: AdminOrderRecord,
  overlappingKeys: Set<string>,
): RoutePlanningWarning[] {
  const warnings: RoutePlanningWarning[] = [];

  if (!order.deliveryAddress.trim()) {
    warnings.push("missing-address");
  }

  const intervalLabel = resolveDeliveryPlannerInterval(order.deliveryTime);

  if (!intervalLabel) {
    warnings.push("missing-interval");
  }

  const courierId = order.assignedCourierId?.trim();
  const deliveryDay = getAdminOrderDeliveryDayTimestamp(order);

  if (courierId && deliveryDay !== null && intervalLabel) {
    const overlapKey = [courierId, deliveryDay, intervalLabel].join("|");

    if (overlappingKeys.has(overlapKey)) {
      warnings.push("interval-overlap");
    }
  }

  return warnings;
}

function toRouteStops(
  orders: AdminOrderRecord[],
  overlappingKeys: Set<string>,
): RoutePlanningStop[] {
  return sortOrdersForRoutePlanning(orders).map((order, index) => ({
    position: index + 1,
    order,
    warnings: buildRouteWarnings(order, overlappingKeys),
  }));
}

export function buildRoutePlanningPlan(
  orders: AdminOrderRecord[],
  referenceDate: Date = new Date(),
): RoutePlanningPlan {
  const assignedOrders = orders.filter((order) => {
    const statusId = getOrderStatus(order.status)?.id;

    if (statusId === "CANCELLED") {
      return false;
    }

    if (!order.assignedCourierId?.trim()) {
      return false;
    }

    return isInRoutePlanningWindow(order, referenceDate);
  });

  const activeOrders = assignedOrders.filter(
    (order) => getOrderStatus(order.status)?.id !== "DELIVERED",
  );
  const completedOrders = assignedOrders.filter(
    (order) => getOrderStatus(order.status)?.id === "DELIVERED",
  );
  const overlapKeys = buildOverlapKeys(activeOrders);

  const courierRoutes = getDemoCouriers()
    .map((courier) => {
      const courierActiveOrders = activeOrders.filter(
        (order) => order.assignedCourierId === courier.id,
      );
      const courierCompletedOrders = completedOrders.filter(
        (order) => order.assignedCourierId === courier.id,
      );

      if (
        courierActiveOrders.length === 0 &&
        courierCompletedOrders.length === 0
      ) {
        return null;
      }

      return {
        courierId: courier.id,
        courierName: courier.fullName,
        activeStops: toRouteStops(courierActiveOrders, overlapKeys),
        completedStops: toRouteStops(courierCompletedOrders, overlapKeys),
      };
    })
    .filter((route): route is RoutePlanningCourierRoute => route !== null);

  const allStops = courierRoutes.flatMap((route) => [
    ...route.activeStops,
    ...route.completedStops,
  ]);
  const warningCount = allStops.reduce(
    (count, stop) => count + stop.warnings.length,
    0,
  );

  return {
    courierRoutes,
    summary: {
      totalActiveDeliveries: activeOrders.length,
      completedDeliveries: completedOrders.length,
      warningCount,
    },
  };
}

export function getRoutePlanningWarningLabel(
  warning: RoutePlanningWarning,
): string {
  switch (warning) {
    case "missing-address":
      return "Missing address";
    case "missing-interval":
      return "Missing interval";
    case "interval-overlap":
      return "Same interval conflict";
    default:
      return warning;
  }
}

