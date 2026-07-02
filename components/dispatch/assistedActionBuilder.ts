// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Builds assisted dispatch actions from smart reroute suggestions.
//
// Назначение (RU):
// Сборка ассистированных действий из умных подсказок перестроения.
// ==================================================
import type {
  AssistedAction,
  AssistedActionAfterPreview,
  AssistedActionRiskLevel,
  AssistedActionSnapshot,
  AssistedActionType,
} from "@/components/dispatch/assistedActionTypes";
import type { SmartRerouteSuggestion } from "@/components/dispatch/smartRerouteTypes";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";


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
export type BuildAssistedActionParams = {
  suggestion: SmartRerouteSuggestion;
  routeLines: CourierRouteLine[];
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
function mapPriorityToRisk(
  priority: SmartRerouteSuggestion["priority"],
): AssistedActionRiskLevel {
  switch (priority) {
    case "critical":
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
    default:
      return "low";
  }
}

function resolveActionType(
  suggestion: SmartRerouteSuggestion,
): AssistedActionType {
  switch (suggestion.type) {
    case "better_stop_order":
      return "route_reorder";
    case "better_courier_available":
    case "courier_idle":
    case "courier_overloaded":
      return "courier_reassignment";
    case "heavy_traffic":
    case "route_deviation":
    case "delay_risk":
    case "interval_risk":
      return "route_rebuild";
    case "long_stop":
    case "stale_location":
    default:
      return "dismiss";
  }
}

function findRouteLine(
  routeLines: CourierRouteLine[],
  courierId: string | null,
): CourierRouteLine | undefined {
  if (!courierId?.trim()) {
    return undefined;
  }

  return routeLines.find((routeLine) => routeLine.courierId === courierId);
}

function buildRouteSnapshot(
  routeLine: CourierRouteLine | undefined,
  courierId: string | null,
  courierName: string | null,
  label: string,
): AssistedActionSnapshot["routes"] {
  if (!routeLine) {
    return [];
  }

  return [
    {
      courierId: routeLine.courierId,
      courierName: courierName ?? routeLine.courierName,
      orderIds: [...routeLine.orderIds],
      routeLabel: label,
    },
  ];
}

function buildReorderedOrderIds(orderIds: string[]): string[] {
  if (orderIds.length < 2) {
    return [...orderIds];
  }

  const reorderedOrderIds = [...orderIds];
  const firstOrderId = reorderedOrderIds[0];
  const secondOrderId = reorderedOrderIds[1];

  if (!firstOrderId || !secondOrderId) {
    return reorderedOrderIds;
  }

  reorderedOrderIds[0] = secondOrderId;
  reorderedOrderIds[1] = firstOrderId;

  return reorderedOrderIds;
}

function buildAfterPreview(
  actionType: AssistedActionType,
  suggestion: SmartRerouteSuggestion,
  beforeSnapshot: AssistedActionSnapshot,
  routeLine: CourierRouteLine | undefined,
): AssistedActionAfterPreview {
  const baseRoutes = beforeSnapshot.routes;
  const firstRoute = baseRoutes[0];

  if (actionType === "dismiss") {
    return {
      ...beforeSnapshot,
      dismissedSuggestionIds: [
        ...beforeSnapshot.dismissedSuggestionIds,
        suggestion.id,
      ],
      summary: `Dismiss suggestion "${suggestion.title}"`,
      estimatedEtaChangeMinutes: null,
      applyBlocked: false,
      applyBlockedReason: null,
      confirmationWarning:
        "This will hide the suggestion locally. No route or order data will change.",
    };
  }

  if (actionType === "courier_reassignment") {
    return {
      routes: baseRoutes,
      dismissedSuggestionIds: beforeSnapshot.dismissedSuggestionIds,
      summary: suggestion.suggestedAction,
      estimatedEtaChangeMinutes: null,
      applyBlocked: true,
      applyBlockedReason: "Manual reassignment required",
      confirmationWarning:
        "Courier reassignment can be previewed only in this stage. Apply is disabled until a safe assignment flow is connected.",
    };
  }

  if (actionType === "route_reorder" && firstRoute) {
    const reorderedOrderIds = buildReorderedOrderIds(firstRoute.orderIds);

    return {
      routes: [
        {
          ...firstRoute,
          orderIds: reorderedOrderIds,
          routeLabel: "Preview reordered route",
        },
      ],
      dismissedSuggestionIds: beforeSnapshot.dismissedSuggestionIds,
      summary: `Swap the next two stops for ${firstRoute.courierName ?? "courier"}`,
      estimatedEtaChangeMinutes: -5,
      applyBlocked: reorderedOrderIds.length < 2,
      applyBlockedReason:
        reorderedOrderIds.length < 2
          ? "At least two active stops are required for a reorder preview."
          : null,
      confirmationWarning:
        "This saves a local route reorder preview only. Orders and courier assignments stay unchanged.",
    };
  }

  if (actionType === "route_rebuild" && firstRoute) {
    return {
      routes: [
        {
          ...firstRoute,
          routeLabel: "Preview rebuilt route",
        },
      ],
      dismissedSuggestionIds: beforeSnapshot.dismissedSuggestionIds,
      summary: `Rebuild route preview for ${firstRoute.courierName ?? "courier"}`,
      estimatedEtaChangeMinutes: routeLine ? -8 : null,
      applyBlocked: !routeLine || firstRoute.orderIds.length === 0,
      applyBlockedReason:
        !routeLine || firstRoute.orderIds.length === 0
          ? "An active route is required before rebuilding locally."
          : null,
      confirmationWarning:
        "This saves a local route rebuild preview only. No Yandex route API call is made.",
    };
  }

  return {
    ...beforeSnapshot,
    summary: suggestion.suggestedAction,
    estimatedEtaChangeMinutes: null,
    applyBlocked: true,
    applyBlockedReason: "This suggestion cannot be applied automatically.",
    confirmationWarning:
      "Review the preview carefully before confirming any assisted action.",
  };
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
export function buildAssistedActionFromSuggestion(
  params: BuildAssistedActionParams,
): AssistedAction {
  const { suggestion, routeLines } = params;
  const now = params.now ?? new Date();
  const actionType = resolveActionType(suggestion);
  const routeLine = findRouteLine(routeLines, suggestion.affectedCourierId);
  const beforeSnapshot: AssistedActionSnapshot = {
    routes: buildRouteSnapshot(
      routeLine,
      suggestion.affectedCourierId,
      suggestion.affectedCourierName,
      "Current route",
    ),
    dismissedSuggestionIds: [],
    summary: suggestion.reason,
  };
  const afterPreview = buildAfterPreview(
    actionType,
    suggestion,
    beforeSnapshot,
    routeLine,
  );

  return {
    actionId: `assisted-action-${suggestion.id}-${now.getTime()}`,
    suggestionId: suggestion.id,
    actionType,
    status: "draft",
    affectedCourierIds: suggestion.affectedCourierId
      ? [suggestion.affectedCourierId]
      : [],
    affectedOrderIds: [...suggestion.affectedOrderIds],
    beforeSnapshot,
    afterPreview,
    riskLevel: mapPriorityToRisk(suggestion.priority),
    requiresConfirmation: true,
    createdAt: now.toISOString(),
  };
}

export function buildDismissAssistedActionFromSuggestion(
  params: BuildAssistedActionParams,
): AssistedAction {
  const baseAction = buildAssistedActionFromSuggestion(params);

  return {
    ...baseAction,
    actionId: `assisted-dismiss-${params.suggestion.id}-${Date.now()}`,
    actionType: "dismiss",
    afterPreview: {
      routes: baseAction.beforeSnapshot.routes,
      dismissedSuggestionIds: [params.suggestion.id],
      summary: `Dismiss suggestion "${params.suggestion.title}"`,
      estimatedEtaChangeMinutes: null,
      applyBlocked: false,
      applyBlockedReason: null,
      confirmationWarning:
        "This hides the suggestion locally without changing routes or orders.",
    },
  };
}
