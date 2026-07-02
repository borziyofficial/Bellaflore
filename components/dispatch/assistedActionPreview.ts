// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Preview formatting helpers for assisted dispatch actions.
//
// Назначение (RU):
// Хелперы форматирования превью ассистированных действий.
// ==================================================
import type { AssistedAction } from "@/components/dispatch/assistedActionTypes";
import {
  getAssistedActionRiskLabel,
  getAssistedActionTypeLabel,
} from "@/components/dispatch/assistedActionTypes";
import { formatEstimatedMinutes } from "@/components/maps/etaCalculator";


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
export type AssistedActionPreviewContent = {
  title: string;
  actionTypeLabel: string;
  reason: string;
  riskLevelLabel: string;
  affectedCouriers: string[];
  affectedOrders: string[];
  beforeSummary: string;
  afterSummary: string;
  expectedEtaChangeLabel: string;
  confirmationWarning: string;
  applyBlockedReason: string | null;
  changeLines: string[];
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
function formatRouteSnapshotSummary(
  routes: AssistedAction["beforeSnapshot"]["routes"],
): string {
  if (routes.length === 0) {
    return "No active route snapshot available.";
  }

  return routes
    .map(
      (route) =>
        `${route.courierName ?? route.courierId}: ${route.orderIds.join(" → ") || "no stops"}`,
    )
    .join(" · ");
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
export function buildAssistedActionPreviewContent(
  action: AssistedAction,
  suggestionTitle: string,
  suggestionReason: string,
): AssistedActionPreviewContent {
  const beforeSummary = formatRouteSnapshotSummary(action.beforeSnapshot.routes);
  const afterSummary = formatRouteSnapshotSummary(action.afterPreview.routes);
  const changeLines: string[] = [];

  if (action.actionType === "route_reorder") {
    changeLines.push("Local stop order preview will update on the map.");
  } else if (action.actionType === "route_rebuild") {
    changeLines.push("Local route rebuild preview will refresh the displayed route.");
  } else if (action.actionType === "courier_reassignment") {
    changeLines.push("Courier reassignment remains preview-only in this stage.");
  } else if (action.actionType === "dismiss") {
    changeLines.push("The suggestion will be dismissed locally.");
  }

  if (action.afterPreview.applyBlockedReason) {
    changeLines.push(action.afterPreview.applyBlockedReason);
  }

  return {
    title: suggestionTitle,
    actionTypeLabel: getAssistedActionTypeLabel(action.actionType),
    reason: suggestionReason,
    riskLevelLabel: getAssistedActionRiskLabel(action.riskLevel),
    affectedCouriers: action.affectedCourierIds,
    affectedOrders: action.affectedOrderIds,
    beforeSummary,
    afterSummary,
    expectedEtaChangeLabel:
      action.afterPreview.estimatedEtaChangeMinutes === null
        ? "—"
        : formatEstimatedMinutes(
            Math.abs(action.afterPreview.estimatedEtaChangeMinutes),
          ) +
          (action.afterPreview.estimatedEtaChangeMinutes < 0
            ? " faster (estimate)"
            : " slower (estimate)"),
    confirmationWarning: action.afterPreview.confirmationWarning,
    applyBlockedReason: action.afterPreview.applyBlockedReason,
    changeLines,
  };
}
