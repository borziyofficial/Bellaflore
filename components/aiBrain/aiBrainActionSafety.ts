// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Action safety
// ==================================================
import type {
  AiBrainAction,
  AiBrainActionMode,
  AiBrainRecommendation,
  AiBrainRecommendationKind,
} from "@/components/aiBrain/aiBrainTypes";

export const DEFAULT_AI_BRAIN_ACTION_MODE: AiBrainActionMode = "suggestion_only";

const RECOMMENDATION_ACTION_MODES: Record<
  AiBrainRecommendationKind,
  AiBrainActionMode
> = {
  confirm_order: "requires_confirmation",
  assign_courier: "requires_confirmation",
  restock_inventory: "requires_confirmation",
  replace_flower: "requires_confirmation",
  retry_notification: "requires_confirmation",
  change_delivery_window: "requires_confirmation",
  promote_popular_product: "suggestion_only",
  hide_unavailable_product: "requires_confirmation",
  review_workflow: "suggestion_only",
};

export function resolveActionMode(
  kind: AiBrainRecommendationKind,
  override?: AiBrainActionMode,
): AiBrainActionMode {
  if (override) {
    return override;
  }

  return RECOMMENDATION_ACTION_MODES[kind] ?? DEFAULT_AI_BRAIN_ACTION_MODE;
}

export function buildSafeAiBrainAction(
  input: Omit<AiBrainAction, "mode"> & { mode?: AiBrainActionMode },
): AiBrainAction {
  return {
    ...input,
    mode: resolveActionMode(input.kind, input.mode),
  };
}

export function enforceSuggestionOnly(
  recommendation: AiBrainRecommendation,
): AiBrainRecommendation {
  return {
    ...recommendation,
    action: {
      ...recommendation.action,
      mode: "suggestion_only",
    },
  };
}

export function canAutoExecuteAction(action: AiBrainAction): boolean {
  return action.mode === "auto_allowed";
}

export function requiresAdminConfirmation(action: AiBrainAction): boolean {
  return (
    action.mode === "requires_confirmation" ||
    action.mode === "suggestion_only"
  );
}

export function assertAiBrainReadOnly(): void {
  // AI Brain foundation is read-only by design.
  // No module mutations are permitted from this layer.
}
