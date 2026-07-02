// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import {
  getAdminOrderDeliveryDayTimestamp,
  resolveDeliveryPlannerInterval,
} from "@/components/admin/adminDeliveryPlanner";
import {
  buildRoutePlanningPlan,
  type RoutePlanningCourierRoute,
  type RoutePlanningPlan,
  type RoutePlanningStop,
} from "@/components/admin/adminRoutePlanning";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { getOrderStatus } from "@/components/orders/orderStatus";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type RouteOptimizationPriority = "low" | "medium" | "high";

export type RouteOptimizationHint = {
  id: string;
  message: string;
  priority: RouteOptimizationPriority;
  orderId?: string;
};

export type RouteOptimizationCourierAnalysis = {
  courierId: string;
  courierName: string;
  healthScore: number;
  hints: RouteOptimizationHint[];
};

export type RouteOptimizationPlan = {
  courierAnalyses: RouteOptimizationCourierAnalysis[];
  overallHealthScore: number;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getIntervalStartMinutes(intervalLabel: string | null): number {
  if (!intervalLabel) {
    return Number.MAX_SAFE_INTEGER;
  }

  const matchedInterval = deliveryIntervals.find(
    (interval) => interval.label === intervalLabel,
  );

  return matchedInterval?.startMinutes ?? Number.MAX_SAFE_INTEGER;
}

function priorityPenalty(priority: RouteOptimizationPriority): number {
  switch (priority) {
    case "high":
      return 22;
    case "medium":
      return 12;
    case "low":
    default:
      return 6;
  }
}

function calculateHealthScore(hints: RouteOptimizationHint[]): number {
  const penalty = hints.reduce(
    (total, hint) => total + priorityPenalty(hint.priority),
    0,
  );

  return Math.max(0, 100 - penalty);
}

function hasIntervalOrderIssue(activeStops: RoutePlanningStop[]): boolean {
  for (let index = 1; index < activeStops.length; index += 1) {
    const previousStop = activeStops[index - 1];
    const currentStop = activeStops[index];
    const previousDay = getAdminOrderDeliveryDayTimestamp(previousStop.order);
    const currentDay = getAdminOrderDeliveryDayTimestamp(currentStop.order);

    if (previousDay === null || currentDay === null || previousDay !== currentDay) {
      continue;
    }

    const previousInterval = getIntervalStartMinutes(
      resolveDeliveryPlannerInterval(previousStop.order.deliveryTime),
    );
    const currentInterval = getIntervalStartMinutes(
      resolveDeliveryPlannerInterval(currentStop.order.deliveryTime),
    );

    if (currentInterval < previousInterval) {
      return true;
    }
  }

  return false;
}

function analyzeCourierRoute(
  route: RoutePlanningCourierRoute,
): RouteOptimizationCourierAnalysis {
  const hints: RouteOptimizationHint[] = [];
  const activeCount = route.activeStops.length;

  if (activeCount >= 5) {
    hints.push({
      id: `${route.courierId}-high-workload`,
      message: `Courier ${route.courierName} has ${activeCount} active deliveries — high workload`,
      priority: "high",
    });
  } else if (activeCount >= 3) {
    hints.push({
      id: `${route.courierId}-medium-workload`,
      message: `Courier ${route.courierName} has ${activeCount} active deliveries — medium workload`,
      priority: "medium",
    });
  }

  if (hasIntervalOrderIssue(route.activeStops)) {
    hints.push({
      id: `${route.courierId}-interval-order`,
      message: "Move early interval deliveries higher",
      priority: "medium",
    });
  }

  for (const stop of route.activeStops) {
    if (getOrderStatus(stop.order.status)?.id === "DELIVERED") {
      hints.push({
        id: `${route.courierId}-${stop.order.orderId}-delivered-in-active`,
        message: "Delivered order should stay in completed section",
        priority: "high",
        orderId: stop.order.orderId,
      });
    }

    if (stop.warnings.includes("missing-address")) {
      hints.push({
        id: `${route.courierId}-${stop.order.orderId}-missing-address`,
        message: "Missing address prevents route planning",
        priority: "high",
        orderId: stop.order.orderId,
      });
    }

    if (stop.warnings.includes("missing-interval")) {
      hints.push({
        id: `${route.courierId}-${stop.order.orderId}-missing-interval`,
        message: "Missing delivery interval — confirm route timing",
        priority: "medium",
        orderId: stop.order.orderId,
      });
    }

    if (stop.warnings.includes("interval-overlap")) {
      hints.push({
        id: `${route.courierId}-${stop.order.orderId}-interval-overlap`,
        message: "Two deliveries share the same interval",
        priority: "high",
        orderId: stop.order.orderId,
      });
    }
  }

  const uniqueIntervalCount = new Set(
    route.activeStops
      .map((stop) => resolveDeliveryPlannerInterval(stop.order.deliveryTime))
      .filter((interval): interval is string => Boolean(interval)),
  ).size;

  if (activeCount >= 2 && uniqueIntervalCount >= 2 && !hasIntervalOrderIssue(route.activeStops)) {
    hints.push({
      id: `${route.courierId}-interval-review`,
      message: "Review interval sequence — keep earlier delivery windows first",
      priority: "low",
    });
  }

  if (activeCount === 0 && route.completedStops.length > 0) {
    hints.push({
      id: `${route.courierId}-completed-only`,
      message: "All assigned deliveries are completed for this courier",
      priority: "low",
    });
  }

  const healthScore = calculateHealthScore(hints);

  return {
    courierId: route.courierId,
    courierName: route.courierName,
    healthScore,
    hints,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildRouteOptimizationPlan(
  routePlan: RoutePlanningPlan,
): RouteOptimizationPlan {
  const courierAnalyses = routePlan.courierRoutes.map(analyzeCourierRoute);

  const overallHealthScore =
    courierAnalyses.length === 0
      ? 100
      : Math.round(
          courierAnalyses.reduce(
            (total, analysis) => total + analysis.healthScore,
            0,
          ) / courierAnalyses.length,
        );

  return {
    courierAnalyses,
    overallHealthScore,
  };
}

export function buildRouteOptimizationPlanFromOrders(
  orders: AdminOrderRecord[],
  referenceDate: Date = new Date(),
): RouteOptimizationPlan {
  return buildRouteOptimizationPlan(
    buildRoutePlanningPlan(orders, referenceDate),
  );
}

export function getRouteOptimizationPriorityLabel(
  priority: RouteOptimizationPriority,
): string {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
    default:
      return "Low";
  }
}
