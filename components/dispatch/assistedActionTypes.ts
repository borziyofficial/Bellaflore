// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Type definitions for assisted dispatch actions and previews.
//
// Назначение (RU):
// Типы ассистированных действий диспетчеризации и превью.
// ==================================================
export type AssistedActionType =
  | "route_reorder"
  | "courier_reassignment"
  | "route_rebuild"
  | "dismiss";


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
export type AssistedActionStatus =
  | "draft"
  | "previewed"
  | "confirmed"
  | "applied"
  | "undone"
  | "failed";

export type AssistedActionRiskLevel = "low" | "medium" | "high";

export type AssistedRouteSnapshotItem = {
  courierId: string;
  courierName: string | null;
  orderIds: string[];
  routeLabel: string;
};

export type AssistedActionSnapshot = {
  routes: AssistedRouteSnapshotItem[];
  dismissedSuggestionIds: string[];
  summary: string;
};

export type AssistedActionAfterPreview = AssistedActionSnapshot & {
  estimatedEtaChangeMinutes: number | null;
  applyBlocked: boolean;
  applyBlockedReason: string | null;
  confirmationWarning: string;
};

export type AssistedAction = {
  actionId: string;
  suggestionId: string;
  actionType: AssistedActionType;
  status: AssistedActionStatus;
  affectedCourierIds: string[];
  affectedOrderIds: string[];
  beforeSnapshot: AssistedActionSnapshot;
  afterPreview: AssistedActionAfterPreview;
  riskLevel: AssistedActionRiskLevel;
  requiresConfirmation: true;
  createdAt: string;
  appliedAt?: string;
  undoneAt?: string;
};

export type AssistedRouteOverrideEntry = {
  courierId: string;
  orderIds: string[];
  overrideType: "reorder" | "rebuild";
  actionId: string;
  appliedAt: string;
};


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
export function getAssistedActionTypeLabel(
  actionType: AssistedActionType,
): string {
  switch (actionType) {
    case "route_reorder":
      return "Route reorder";
    case "courier_reassignment":
      return "Courier reassignment";
    case "route_rebuild":
      return "Route rebuild";
    case "dismiss":
      return "Dismiss";
    default:
      return actionType;
  }
}

export function getAssistedActionStatusLabel(
  status: AssistedActionStatus,
): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "previewed":
      return "Previewed";
    case "confirmed":
      return "Confirmed";
    case "applied":
      return "Applied";
    case "undone":
      return "Undone";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function getAssistedActionRiskLabel(
  riskLevel: AssistedActionRiskLevel,
): string {
  switch (riskLevel) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return riskLevel;
  }
}

export function canApplyAssistedAction(action: AssistedAction): boolean {
  if (action.actionType === "courier_reassignment") {
    return false;
  }

  if (action.actionType === "dismiss") {
    return true;
  }

  if (action.afterPreview.applyBlocked) {
    return false;
  }

  if (action.actionType === "route_reorder") {
    return action.affectedOrderIds.length >= 2;
  }

  return action.affectedCourierIds.length > 0;
}

export function canUndoAssistedAction(action: AssistedAction): boolean {
  return (
    action.status === "applied" &&
    action.actionType !== "dismiss" &&
    action.actionType !== "courier_reassignment"
  );
}
