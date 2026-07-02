// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Smart reroute suggestion engine analyzing routes, traffic, and courier load.
//
// Назначение (RU):
// Движок умных подсказок перестроения маршрутов по трафику и загрузке курьеров.
// ==================================================
import {
  getAdminOrderDeliveryDayTimestamp,
  resolveDeliveryPlannerInterval,
} from "@/components/admin/adminDeliveryPlanner";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import {
  buildRouteOptimizationPlan,
  type RouteOptimizationPlan,
} from "@/components/admin/adminRouteOptimization";
import type { RoutePlanningPlan } from "@/components/admin/adminRoutePlanning";
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import type { LiveRouteMonitoringData } from "@/components/couriers/liveRouteMonitoringTypes";
import { LIVE_ROUTE_MONITORING_CONFIG } from "@/components/couriers/liveRouteMonitoringConfig";
import {
  clampSmartRerouteConfidence,
  sortSmartRerouteSuggestions,
  type SmartRerouteFilterCategory,
  type SmartReroutePriority,
  type SmartRerouteSuggestion,
  type SmartRerouteSuggestionsData,
  type SmartRerouteSuggestionType,
} from "@/components/dispatch/smartRerouteTypes";
import type { RouteDistancePlan } from "@/components/maps/distanceTypes";
import {
  isTrafficDelayOverFifteenMinutes,
  isTrafficDelayOverTwentyPercent,
} from "@/components/maps/providerEta";
import { buildCourierTrafficEtaViews } from "@/components/maps/trafficEtaViews";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type BuildSmartRerouteSuggestionsParams = {
  orders: AdminOrderRecord[];
  routeMonitoring: LiveRouteMonitoringData;
  routeLines: CourierRouteLine[];
  realRoutes: YandexCourierRoute[];
  routeDistancePlan: RouteDistancePlan;
  routePlanningPlan: RoutePlanningPlan;
  now?: Date;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
const LONG_STOP_SECONDS = 12 * 60;

function getReferenceDayTimestamp(referenceDate: Date): number {
  return Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
}

function getMinutesUntilIntervalEnd(
  order: AdminOrderRecord,
  now: Date,
): number | null {
  const intervalLabel = resolveDeliveryPlannerInterval(order.deliveryTime);
  if (!intervalLabel) {
    return null;
  }

  const matchedInterval = deliveryIntervals.find(
    (interval) => interval.label === intervalLabel,
  );
  if (!matchedInterval) {
    return null;
  }

  const deliveryDay = getAdminOrderDeliveryDayTimestamp(order);
  if (deliveryDay === null) {
    return null;
  }

  const todayTimestamp = getReferenceDayTimestamp(now);

  if (deliveryDay > todayTimestamp) {
    return matchedInterval.endMinutes - matchedInterval.startMinutes;
  }

  if (deliveryDay < todayTimestamp) {
    return -1;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return matchedInterval.endMinutes - currentMinutes;
}

function createSuggestion(
  params: {
    id: string;
    type: SmartRerouteSuggestionType;
    filterCategory: SmartRerouteFilterCategory;
    priority: SmartReroutePriority;
    title: string;
    description: string;
    reason: string;
    affectedCourierId?: string | null;
    affectedCourierName?: string | null;
    affectedOrderIds?: string[];
    confidence: number;
    suggestedAction: string;
  },
  createdAt: string,
): SmartRerouteSuggestion {
  return {
    id: params.id,
    type: params.type,
    filterCategory: params.filterCategory,
    priority: params.priority,
    title: params.title,
    description: params.description,
    reason: params.reason,
    affectedCourierId: params.affectedCourierId ?? null,
    affectedCourierName: params.affectedCourierName ?? null,
    affectedOrderIds: params.affectedOrderIds ?? [],
    confidence: clampSmartRerouteConfidence(params.confidence),
    suggestedAction: params.suggestedAction,
    createdAt,
  };
}

function buildMonitoringSuggestions(
  routeMonitoring: LiveRouteMonitoringData,
  createdAt: string,
): SmartRerouteSuggestion[] {
  const suggestions: SmartRerouteSuggestion[] = [];

  for (const record of routeMonitoring.couriers) {
    if (record.routeDeviationStatus === "off_route") {
      suggestions.push(
        createSuggestion(
          {
            id: `route-deviation-${record.courierId}`,
            type: "route_deviation",
            filterCategory: "route",
            priority: "high",
            title: `${record.courierName} is off the planned route`,
            description:
              "Live GPS shows the courier has drifted far from the active route corridor.",
            reason: "Route monitoring detected an off-route deviation.",
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: record.activeRouteOrderIds,
            confidence: 82,
            suggestedAction:
              "Review the courier path and confirm whether a manual reroute is needed.",
          },
          createdAt,
        ),
      );
    } else if (record.routeDeviationStatus === "slight_deviation") {
      suggestions.push(
        createSuggestion(
          {
            id: `route-deviation-slight-${record.courierId}`,
            type: "route_deviation",
            filterCategory: "route",
            priority: "medium",
            title: `${record.courierName} has slight route deviation`,
            description:
              "The courier is near but not fully aligned with the planned route corridor.",
            reason: "Route monitoring detected a slight deviation from the route.",
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: record.activeRouteOrderIds,
            confidence: 68,
            suggestedAction:
              "Monitor the next few minutes before considering a reroute.",
          },
          createdAt,
        ),
      );
    }

    if (
      record.movementStatus === "stopped" &&
      record.lastLocationAgeSeconds !== null &&
      record.lastLocationAgeSeconds >= LONG_STOP_SECONDS
    ) {
      const stoppedMinutes = Math.floor(record.lastLocationAgeSeconds / 60);
      suggestions.push(
        createSuggestion(
          {
            id: `long-stop-${record.courierId}`,
            type: "long_stop",
            filterCategory: "gps",
            priority: "medium",
            title: `${record.courierName} has been stopped for ${stoppedMinutes} minutes`,
            description:
              "The courier GPS speed indicates no movement for an extended period.",
            reason: `Movement status is stopped with a last update ${stoppedMinutes} min ago.`,
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: record.nextOrderId ? [record.nextOrderId] : [],
            confidence: 74,
            suggestedAction:
              "Contact the courier to confirm status before adjusting the route.",
          },
          createdAt,
        ),
      );
    }

    if (
      record.lastLocationAgeSeconds !== null &&
      record.lastLocationAgeSeconds >=
        LIVE_ROUTE_MONITORING_CONFIG.staleLocationSeconds
    ) {
      suggestions.push(
        createSuggestion(
          {
            id: `stale-location-${record.courierId}`,
            type: "stale_location",
            filterCategory: "gps",
            priority: "medium",
            title: `${record.courierName} live GPS is stale`,
            description:
              "The latest courier location is older than the monitoring stale threshold.",
            reason: "Live GPS has not refreshed recently enough for reliable monitoring.",
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: record.activeRouteOrderIds,
            confidence: 88,
            suggestedAction:
              "Ask the courier to refresh location sharing before rerouting.",
          },
          createdAt,
        ),
      );
    }
  }

  return suggestions;
}

function buildDelaySuggestions(
  orders: AdminOrderRecord[],
  routeMonitoring: LiveRouteMonitoringData,
  createdAt: string,
  now: Date,
): SmartRerouteSuggestion[] {
  const ordersById = new Map(orders.map((order) => [order.orderId, order]));
  const suggestions: SmartRerouteSuggestion[] = [];

  for (const record of routeMonitoring.couriers) {
    if (!record.nextOrderId || record.estimatedMinutesToNext === null) {
      continue;
    }

    const nextOrder = ordersById.get(record.nextOrderId);
    if (!nextOrder) {
      continue;
    }

    const intervalLabel =
      resolveDeliveryPlannerInterval(nextOrder.deliveryTime) ??
      nextOrder.deliveryTime;
    const minutesUntilIntervalEnd = getMinutesUntilIntervalEnd(nextOrder, now);

    if (minutesUntilIntervalEnd === null) {
      continue;
    }

    if (minutesUntilIntervalEnd < 0) {
      suggestions.push(
        createSuggestion(
          {
            id: `interval-risk-past-${record.courierId}-${record.nextOrderId}`,
            type: "interval_risk",
            filterCategory: "delay",
            priority: "critical",
            title: `${record.courierName} may miss delivery window ${intervalLabel}`,
            description:
              "The delivery interval has already ended while the courier is still en route.",
            reason: "Remaining delivery window time is negative.",
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: [record.nextOrderId],
            confidence: 91,
            suggestedAction:
              "Contact the customer and consider reassigning or rescheduling manually.",
          },
          createdAt,
        ),
      );
      continue;
    }

    if (record.estimatedMinutesToNext > minutesUntilIntervalEnd) {
      const priority: SmartReroutePriority =
        record.estimatedMinutesToNext - minutesUntilIntervalEnd >= 30
          ? "critical"
          : "high";

      suggestions.push(
        createSuggestion(
          {
            id: `delay-risk-${record.courierId}-${record.nextOrderId}`,
            type: priority === "critical" ? "interval_risk" : "delay_risk",
            filterCategory: "delay",
            priority,
            title: `${record.courierName} will probably miss delivery interval ${intervalLabel}`,
            description: `ETA to the next stop is about ${record.estimatedMinutesToNext} min, but only ${minutesUntilIntervalEnd} min remain in the window.`,
            reason: "Estimated travel time exceeds remaining delivery interval time.",
            affectedCourierId: record.courierId,
            affectedCourierName: record.courierName,
            affectedOrderIds: [record.nextOrderId],
            confidence: 85,
            suggestedAction:
              "Review stop order or consider moving one delivery to another courier manually.",
          },
          createdAt,
        ),
      );
    }
  }

  return suggestions;
}

function buildTrafficSuggestions(
  routeLines: CourierRouteLine[],
  realRoutes: YandexCourierRoute[],
  routeDistancePlan: RouteDistancePlan,
  createdAt: string,
): SmartRerouteSuggestion[] {
  const realRoutesRecord = Object.fromEntries(
    realRoutes.map((route) => [route.courierId, route]),
  );
  const trafficViews = buildCourierTrafficEtaViews(
    routeLines,
    realRoutesRecord,
    routeDistancePlan.courierPlans,
  );
  const suggestions: SmartRerouteSuggestion[] = [];

  for (const view of trafficViews) {
    const roadRoute = view.roadRoute;
    const heavyTraffic =
      roadRoute?.trafficDelayLevel === "high" ||
      isTrafficDelayOverFifteenMinutes(roadRoute?.trafficDelaySeconds) ||
      isTrafficDelayOverTwentyPercent(
        roadRoute?.trafficDelaySeconds,
        roadRoute?.providerDurationSeconds,
      );

    if (!heavyTraffic) {
      continue;
    }

    suggestions.push(
      createSuggestion(
        {
          id: `heavy-traffic-${view.courierId}`,
          type: "heavy_traffic",
          filterCategory: "traffic",
          priority: roadRoute?.trafficDelayLevel === "high" ? "high" : "medium",
          title: `${view.courierName} is facing heavy traffic on the active route`,
          description:
            "Provider traffic signals show meaningful delay compared with the base route ETA.",
          reason:
            view.warnings.find((warning) => warning.includes("Traffic")) ??
            "Traffic delay exceeds monitoring thresholds.",
          affectedCourierId: view.courierId,
          affectedCourierName: view.courierName,
          affectedOrderIds: roadRoute?.orderIds ?? [],
          confidence: roadRoute?.status === "ready" ? 86 : 62,
          suggestedAction:
            "Review whether to reorder remaining stops or shift a delivery to another courier.",
        },
        createdAt,
      ),
    );
  }

  return suggestions;
}

function buildWorkloadSuggestions(
  routeLines: CourierRouteLine[],
  createdAt: string,
): SmartRerouteSuggestion[] {
  const suggestions: SmartRerouteSuggestion[] = [];

  for (const routeLine of routeLines) {
    const stopCount = routeLine.orderIds.length;

    if (stopCount >= 5) {
      suggestions.push(
        createSuggestion(
          {
            id: `courier-overloaded-${routeLine.courierId}`,
            type: "courier_overloaded",
            filterCategory: "workload",
            priority: "high",
            title: `${routeLine.courierName} is overloaded with ${stopCount} deliveries`,
            description:
              "The courier has a high number of active stops compared with the rest of the fleet.",
            reason: `${stopCount} active deliveries are assigned on the current route.`,
            affectedCourierId: routeLine.courierId,
            affectedCourierName: routeLine.courierName,
            affectedOrderIds: routeLine.orderIds,
            confidence: 80,
            suggestedAction:
              "Consider moving one or two stops to a courier with lighter workload.",
          },
          createdAt,
        ),
      );
    } else if (stopCount >= 3) {
      suggestions.push(
        createSuggestion(
          {
            id: `courier-overloaded-medium-${routeLine.courierId}`,
            type: "courier_overloaded",
            filterCategory: "workload",
            priority: "medium",
            title: `${routeLine.courierName} has ${stopCount} active deliveries`,
            description:
              "The courier workload is elevated and may reduce on-time performance.",
            reason: `${stopCount} active deliveries remain on the route.`,
            affectedCourierId: routeLine.courierId,
            affectedCourierName: routeLine.courierName,
            affectedOrderIds: routeLine.orderIds,
            confidence: 72,
            suggestedAction:
              "Monitor progress closely before the next interval window closes.",
          },
          createdAt,
        ),
      );
    }
  }

  const routesWithStops = routeLines.filter((line) => line.orderIds.length > 0);

  if (routesWithStops.length < 2) {
    return suggestions;
  }

  const sortedByLoad = [...routesWithStops].sort(
    (firstRoute, secondRoute) =>
      secondRoute.orderIds.length - firstRoute.orderIds.length,
  );
  const heaviestRoute = sortedByLoad[0];
  const lightestBusyRoute = sortedByLoad[sortedByLoad.length - 1];
  const idleRoute = routeLines.find((line) => line.orderIds.length === 0);

  if (
    heaviestRoute &&
    lightestBusyRoute &&
    heaviestRoute.courierId !== lightestBusyRoute.courierId &&
    heaviestRoute.orderIds.length >= 4 &&
    lightestBusyRoute.orderIds.length <= 1
  ) {
    suggestions.push(
      createSuggestion(
        {
          id: `better-courier-${heaviestRoute.courierId}-${lightestBusyRoute.courierId}`,
          type: "better_courier_available",
          filterCategory: "workload",
          priority: "medium",
          title: `${lightestBusyRoute.courierName} has only ${lightestBusyRoute.orderIds.length} delivery while ${heaviestRoute.courierName} has ${heaviestRoute.orderIds.length}`,
          description:
            "Fleet workload is uneven and a lighter courier could absorb one stop.",
          reason: "Active route stop counts differ significantly across couriers.",
          affectedCourierId: heaviestRoute.courierId,
          affectedCourierName: heaviestRoute.courierName,
          affectedOrderIds: heaviestRoute.orderIds.slice(0, 1),
          confidence: 77,
          suggestedAction: `Review moving one stop from ${heaviestRoute.courierName} to ${lightestBusyRoute.courierName}.`,
        },
        createdAt,
      ),
    );
  }

  if (idleRoute && heaviestRoute && heaviestRoute.orderIds.length >= 3) {
    suggestions.push(
      createSuggestion(
        {
          id: `courier-idle-${idleRoute.courierId}`,
          type: "courier_idle",
          filterCategory: "workload",
          priority: "low",
          title: `${idleRoute.courierName} is idle with no active deliveries`,
          description: `This courier has capacity while ${heaviestRoute.courierName} still has ${heaviestRoute.orderIds.length} stops.`,
          reason: "No active route stops are assigned to this courier.",
          affectedCourierId: idleRoute.courierId,
          affectedCourierName: idleRoute.courierName,
          affectedOrderIds: [],
          confidence: 90,
          suggestedAction:
            "Consider assigning a nearby unstarted stop from a busy courier.",
        },
        createdAt,
      ),
    );
  }

  return suggestions;
}

function buildRouteOptimizationSuggestions(
  routePlanningPlan: RoutePlanningPlan,
  routeDistancePlan: RouteDistancePlan,
  createdAt: string,
): SmartRerouteSuggestion[] {
  const optimizationPlan: RouteOptimizationPlan =
    buildRouteOptimizationPlan(routePlanningPlan);
  const suggestions: SmartRerouteSuggestion[] = [];

  for (const analysis of optimizationPlan.courierAnalyses) {
    for (const hint of analysis.hints) {
      if (hint.id.endsWith("-interval-order")) {
        suggestions.push(
          createSuggestion(
            {
              id: `better-stop-order-${analysis.courierId}`,
              type: "better_stop_order",
              filterCategory: "route",
              priority: "low",
              title: `Reorder stops for ${analysis.courierName}`,
              description: hint.message,
              reason: "Route optimization detected an interval sequence issue.",
              affectedCourierId: analysis.courierId,
              affectedCourierName: analysis.courierName,
              affectedOrderIds: hint.orderId ? [hint.orderId] : [],
              confidence: 70,
              suggestedAction:
                "Swap next two deliveries for shorter travel distance and earlier intervals.",
            },
            createdAt,
          ),
        );
      }
    }
  }

  for (const courierPlan of routeDistancePlan.courierPlans) {
    const firstLeg = courierPlan.legs[0];
    const secondLeg = courierPlan.legs[1];

    if (
      firstLeg?.status === "calculated" &&
      secondLeg?.status === "calculated" &&
      firstLeg.distanceKm !== null &&
      secondLeg.distanceKm !== null &&
      secondLeg.distanceKm > firstLeg.distanceKm * 1.35
    ) {
      suggestions.push(
        createSuggestion(
          {
            id: `better-stop-order-distance-${courierPlan.courierId}`,
            type: "better_stop_order",
            filterCategory: "route",
            priority: "low",
            title: `Swap next two deliveries for ${courierPlan.courierName}`,
            description:
              "The second leg is noticeably longer than the first, suggesting a shorter stop order may exist.",
            reason: "Straight-line distance between the next two stops is high.",
            affectedCourierId: courierPlan.courierId,
            affectedCourierName: courierPlan.courierName,
            affectedOrderIds: [firstLeg.toOrderId, secondLeg.toOrderId],
            confidence: 64,
            suggestedAction:
              "Preview swapping the next two deliveries for shorter travel distance.",
          },
          createdAt,
        ),
      );
    }
  }

  return suggestions;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function buildSmartRerouteSuggestions(
  params: BuildSmartRerouteSuggestionsParams,
): SmartRerouteSuggestionsData {
  const now = params.now ?? new Date();
  const createdAt = now.toISOString();

  const suggestions = sortSmartRerouteSuggestions([
    ...buildMonitoringSuggestions(params.routeMonitoring, createdAt),
    ...buildDelaySuggestions(
      params.orders,
      params.routeMonitoring,
      createdAt,
      now,
    ),
    ...buildTrafficSuggestions(
      params.routeLines,
      params.realRoutes,
      params.routeDistancePlan,
      createdAt,
    ),
    ...buildWorkloadSuggestions(params.routeLines, createdAt),
    ...buildRouteOptimizationSuggestions(
      params.routePlanningPlan,
      params.routeDistancePlan,
      createdAt,
    ),
  ]);

  return {
    suggestions,
    generatedAt: createdAt,
  };
}
