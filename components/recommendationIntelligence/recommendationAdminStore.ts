// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Admin rules store
// ==================================================
import type {
  RecommendationAdminRule,
  RecommendationKind,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

export const RECOMMENDATION_ADMIN_STORAGE_KEY =
  "bellaflore_recommendation_admin_v1";

export const DEFAULT_RECOMMENDATION_ADMIN_RULE: RecommendationAdminRule = {
  enabled: true,
  disabledKinds: [],
  pinnedProductIds: {},
  excludedProductIds: {},
  pinnedAddOnIds: [],
  excludedAddOnIds: [],
  rulesVersion: "bellaflore_recommendation_admin_v1",
  updatedAt: new Date().toISOString(),
};

export function readRecommendationAdminRule(): RecommendationAdminRule {
  if (typeof window === "undefined") {
    return DEFAULT_RECOMMENDATION_ADMIN_RULE;
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_ADMIN_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_RECOMMENDATION_ADMIN_RULE;
    }

    const parsed = JSON.parse(raw) as Partial<RecommendationAdminRule>;
    return {
      ...DEFAULT_RECOMMENDATION_ADMIN_RULE,
      ...parsed,
      pinnedProductIds: parsed.pinnedProductIds ?? {},
      excludedProductIds: parsed.excludedProductIds ?? {},
      pinnedAddOnIds: parsed.pinnedAddOnIds ?? [],
      excludedAddOnIds: parsed.excludedAddOnIds ?? [],
    };
  } catch {
    return DEFAULT_RECOMMENDATION_ADMIN_RULE;
  }
}

export function writeRecommendationAdminRule(rule: RecommendationAdminRule): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECOMMENDATION_ADMIN_STORAGE_KEY,
      JSON.stringify(rule),
    );
  } catch {
    // Optional admin storage.
  }
}

export function isRecommendationKindEnabled(
  rule: RecommendationAdminRule,
  kind: RecommendationKind,
): boolean {
  if (!rule.enabled) {
    return false;
  }

  return !rule.disabledKinds.includes(kind);
}

export function applyAdminProductFilters(
  rule: RecommendationAdminRule,
  kind: RecommendationKind,
  productIds: string[],
): string[] {
  const excluded = new Set(rule.excludedProductIds[kind] ?? []);
  const pinned = rule.pinnedProductIds[kind] ?? [];

  const filtered = productIds.filter((id) => !excluded.has(id));
  const merged = [...new Set([...pinned, ...filtered])];

  return merged;
}

export function applyAdminAddOnFilters(
  rule: RecommendationAdminRule,
  addOnIds: string[],
): string[] {
  const excluded = new Set(rule.excludedAddOnIds);
  const pinned = rule.pinnedAddOnIds;
  const filtered = addOnIds.filter((id) => !excluded.has(id));

  return [...new Set([...pinned, ...filtered])];
}
