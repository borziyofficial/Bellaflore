// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Assisted route action recommendations panel
//
// Назначение (RU):
// Панель рекомендаций по маршрутам
// ==================================================
"use client";

import styles from "@/components/admin/AssistedRouteActionsPanel.module.css";
import { buildAssistedActionFromSuggestion, buildDismissAssistedActionFromSuggestion } from "@/components/dispatch/assistedActionBuilder";
import {
  getAssistedActions,
  getLastAppliedAssistedAction,
  markActionApplied,
  markActionConfirmed,
  markActionFailed,
  markActionPreviewed,
  markActionUndone,
  saveAssistedAction,
} from "@/components/dispatch/assistedActionHistory";
import { buildAssistedActionPreviewContent } from "@/components/dispatch/assistedActionPreview";
import {
  canApplyAssistedAction,
  canUndoAssistedAction,
  getAssistedActionRiskLabel,
  getAssistedActionTypeLabel,
  type AssistedAction,
} from "@/components/dispatch/assistedActionTypes";
import {
  clearAssistedRouteOverridesForAction,
  saveAssistedRouteOverride,
} from "@/components/dispatch/assistedRouteOverrideStorage";
import {
  filterSmartRerouteSuggestions,
  getSmartReroutePriorityLabel,
  getSmartRerouteTypeLabel,
  SMART_REROUTE_FILTER_OPTIONS,
  type SmartRerouteFilterId,
  type SmartReroutePriority,
  type SmartRerouteSuggestion,
  type SmartRerouteSuggestionsData,
} from "@/components/dispatch/smartRerouteTypes";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import { useCallback, useMemo, useState } from "react";

type AssistedRouteActionsPanelProps = {
  data: SmartRerouteSuggestionsData;
  routeLines: CourierRouteLine[];
  onAssistedRouteChange?: () => void;
};

function getPriorityClassName(priority: SmartReroutePriority): string {
  switch (priority) {
    case "critical":
      return styles.priorityCritical;
    case "high":
      return styles.priorityHigh;
    case "medium":
      return styles.priorityMedium;
    case "low":
    default:
      return styles.priorityLow;
  }
}

function executeAssistedActionApply(action: AssistedAction): boolean {
  if (!canApplyAssistedAction(action)) {
    return false;
  }

  if (action.actionType === "dismiss") {
    return true;
  }

  const previewRoute = action.afterPreview.routes[0];
  if (!previewRoute) {
    return false;
  }

  saveAssistedRouteOverride({
    courierId: previewRoute.courierId,
    orderIds: previewRoute.orderIds,
    overrideType:
      action.actionType === "route_reorder" ? "reorder" : "rebuild",
    actionId: action.actionId,
    appliedAt: new Date().toISOString(),
  });

  return true;
}

function AssistedSuggestionCard({
  suggestion,
  previewAction,
  previewContent,
  isConfirming,
  onPreview,
  onDismiss,
  onConfirmApply,
  onCancelConfirm,
  onFinalApply,
}: {
  suggestion: SmartRerouteSuggestion;
  previewAction: AssistedAction | null;
  previewContent: ReturnType<typeof buildAssistedActionPreviewContent> | null;
  isConfirming: boolean;
  onPreview: () => void;
  onDismiss: () => void;
  onConfirmApply: () => void;
  onCancelConfirm: () => void;
  onFinalApply: () => void;
}) {
  return (
    <li className={styles.suggestionCard}>
      <div className={styles.suggestionTop}>
        <span
          className={`${styles.priorityBadge} ${getPriorityClassName(suggestion.priority)}`}
        >
          {getSmartReroutePriorityLabel(suggestion.priority)}
        </span>
        <span className={styles.typeBadge}>
          {getSmartRerouteTypeLabel(suggestion.type)}
        </span>
        <span className={styles.confidenceBadge}>
          {suggestion.confidence}% confidence
        </span>
      </div>

      <h4 className={styles.suggestionTitle}>{suggestion.title}</h4>
      <p className={styles.suggestionReason}>{suggestion.reason}</p>

      {previewContent ? (
        <div className={styles.previewPanel}>
          <p className={styles.previewLabel}>Assisted action preview</p>
          <dl className={styles.previewList}>
            <div>
              <dt>Action</dt>
              <dd>{previewContent.actionTypeLabel}</dd>
            </div>
            <div>
              <dt>Affected courier(s)</dt>
              <dd>
                {previewContent.affectedCouriers.length > 0
                  ? previewContent.affectedCouriers.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Affected order(s)</dt>
              <dd>
                {previewContent.affectedOrders.length > 0
                  ? previewContent.affectedOrders.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Before</dt>
              <dd>{previewContent.beforeSummary}</dd>
            </div>
            <div>
              <dt>After</dt>
              <dd>{previewContent.afterSummary}</dd>
            </div>
            <div>
              <dt>Expected ETA change</dt>
              <dd>{previewContent.expectedEtaChangeLabel}</dd>
            </div>
            <div>
              <dt>Risk level</dt>
              <dd>{previewContent.riskLevelLabel}</dd>
            </div>
          </dl>
          <ul className={styles.changeList}>
            {previewContent.changeLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={styles.confirmationWarning}>
            {previewContent.confirmationWarning}
          </p>
        </div>
      ) : null}

      {isConfirming && previewAction ? (
        <div className={styles.confirmBlock} role="alert">
          <p className={styles.confirmHeading}>Confirm assisted action</p>
          <p className={styles.confirmText}>
            {previewAction.afterPreview.confirmationWarning}
          </p>
          <dl className={styles.confirmList}>
            <div>
              <dt>Action</dt>
              <dd>{getAssistedActionTypeLabel(previewAction.actionType)}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{getAssistedActionRiskLabel(previewAction.riskLevel)}</dd>
            </div>
            <div>
              <dt>Orders</dt>
              <dd>{previewAction.affectedOrderIds.join(", ") || "—"}</dd>
            </div>
          </dl>
          {previewAction.afterPreview.applyBlockedReason ? (
            <p className={styles.blockedReason}>
              {previewAction.afterPreview.applyBlockedReason}
            </p>
          ) : null}
          <div className={styles.confirmActions}>
            <button type="button" onClick={onCancelConfirm}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.finalApplyButton}
              onClick={onFinalApply}
              disabled={!canApplyAssistedAction(previewAction)}
            >
              Final confirmation — Apply
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.suggestionActions}>
        <button type="button" onClick={onPreview}>
          Preview
        </button>
        <button
          type="button"
          className={styles.applyButton}
          onClick={onConfirmApply}
          disabled={!previewAction || !canApplyAssistedAction(previewAction)}
        >
          Confirm &amp; Apply
        </button>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </li>
  );
}

export function AssistedRouteActionsPanel({
  data,
  routeLines,
  onAssistedRouteChange,
}: AssistedRouteActionsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<SmartRerouteFilterId>("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const dismissedFromHistory = getAssistedActions()
      .filter(
        (action) =>
          action.actionType === "dismiss" && action.status === "applied",
      )
      .flatMap((action) => action.afterPreview.dismissedSuggestionIds);

    return new Set(dismissedFromHistory);
  });
  const [previewActions, setPreviewActions] = useState<
    Record<string, AssistedAction>
  >({});
  const [confirmingSuggestionId, setConfirmingSuggestionId] = useState<
    string | null
  >(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const bumpHistory = useCallback(() => {
    setHistoryVersion((currentVersion) => currentVersion + 1);
    onAssistedRouteChange?.();
  }, [onAssistedRouteChange]);

  const visibleSuggestions = useMemo(() => {
    const filtered = filterSmartRerouteSuggestions(
      data.suggestions,
      activeFilter,
    );

    return filtered.filter((suggestion) => !dismissedIds.has(suggestion.id));
  }, [activeFilter, data.suggestions, dismissedIds]);

  const lastAppliedAction = useMemo(() => {
    void historyVersion;
    return getLastAppliedAssistedAction();
  }, [historyVersion]);

  const handlePreview = useCallback(
    (suggestion: SmartRerouteSuggestion) => {
      const action = buildAssistedActionFromSuggestion({
        suggestion,
        routeLines,
      });
      saveAssistedAction(action);
      markActionPreviewed(action.actionId);
      setPreviewActions((currentActions) => ({
        ...currentActions,
        [suggestion.id]: { ...action, status: "previewed" },
      }));
      bumpHistory();
    },
    [bumpHistory, routeLines],
  );

  const handleDismiss = useCallback(
    (suggestion: SmartRerouteSuggestion) => {
      const dismissAction = buildDismissAssistedActionFromSuggestion({
        suggestion,
        routeLines,
      });

      saveAssistedAction(dismissAction);
      markActionApplied(dismissAction.actionId);
      setDismissedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(suggestion.id);
        return nextIds;
      });
      setPreviewActions((currentActions) => {
        const nextActions = { ...currentActions };
        delete nextActions[suggestion.id];
        return nextActions;
      });
      setConfirmingSuggestionId(null);
      bumpHistory();
    },
    [bumpHistory, routeLines],
  );

  const handleConfirmApply = useCallback((suggestionId: string) => {
    setConfirmingSuggestionId(suggestionId);
  }, []);

  const handleFinalApply = useCallback(
    (suggestion: SmartRerouteSuggestion) => {
      const previewAction = previewActions[suggestion.id];
      if (!previewAction) {
        return;
      }

      markActionConfirmed(previewAction.actionId);

      if (!executeAssistedActionApply(previewAction)) {
        markActionFailed(previewAction.actionId);
        return;
      }

      markActionApplied(previewAction.actionId);
      setDismissedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(suggestion.id);
        return nextIds;
      });
      setConfirmingSuggestionId(null);
      bumpHistory();
    },
    [bumpHistory, previewActions],
  );

  const handleUndoLast = useCallback(() => {
    const lastAction = getLastAppliedAssistedAction();
    if (!lastAction || !canUndoAssistedAction(lastAction)) {
      return;
    }

    clearAssistedRouteOverridesForAction(lastAction.actionId);
    markActionUndone(lastAction.actionId);
    setDismissedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(lastAction.suggestionId);
      return nextIds;
    });
    bumpHistory();
  }, [bumpHistory]);

  return (
    <section
      className={styles.panelSection}
      aria-label="Smart reroute suggestions"
    >
      <div className={styles.panelHeader}>
        <h3 className={styles.panelHeading}>Smart Reroute Suggestions</h3>
        <p className={styles.panelMeta}>
          Assisted route actions require dispatcher confirmation. Nothing runs
          automatically.
        </p>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.filterRow}>
          {SMART_REROUTE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.filterButton} ${
                activeFilter === option.id ? styles.filterButtonActive : ""
              }`}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.undoButton}
          onClick={handleUndoLast}
          disabled={!lastAppliedAction || !canUndoAssistedAction(lastAppliedAction)}
        >
          Undo last action
        </button>
      </div>

      {visibleSuggestions.length === 0 ? (
        <p className={styles.emptyState}>
          No reroute suggestions for the selected filter right now.
        </p>
      ) : (
        <ul className={styles.suggestionList}>
          {visibleSuggestions.map((suggestion) => {
            const previewAction = previewActions[suggestion.id] ?? null;
            const previewContent = previewAction
              ? buildAssistedActionPreviewContent(
                  previewAction,
                  suggestion.title,
                  suggestion.reason,
                )
              : null;

            return (
              <AssistedSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                previewAction={previewAction}
                previewContent={previewContent}
                isConfirming={confirmingSuggestionId === suggestion.id}
                onPreview={() => handlePreview(suggestion)}
                onDismiss={() => handleDismiss(suggestion)}
                onConfirmApply={() => handleConfirmApply(suggestion.id)}
                onCancelConfirm={() => setConfirmingSuggestionId(null)}
                onFinalApply={() => handleFinalApply(suggestion)}
              />
            );
          })}
        </ul>
      )}

      <p className={styles.generatedAt}>
        Generated {new Date(data.generatedAt).toLocaleTimeString()}
        {" · "}
        {getAssistedActions().length} assisted action
        {getAssistedActions().length === 1 ? "" : "s"} in local history
      </p>
    </section>
  );
}
