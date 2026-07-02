// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type { AiRecommendationHooks } from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

let aiRecommendationHooks: AiRecommendationHooks = {};

export function registerAiRecommendationHooks(
  hooks: AiRecommendationHooks,
): AiRecommendationHooks {
  aiRecommendationHooks = { ...aiRecommendationHooks, ...hooks };
  return aiRecommendationHooks;
}

export function getAiRecommendationHooks(): AiRecommendationHooks {
  return aiRecommendationHooks;
}

export function clearAiRecommendationHooks(): void {
  aiRecommendationHooks = {};
}

export async function recommendByHistory(
  productId: string,
  limit = 8,
): Promise<import("@/components/catalogEngine/catalogTypes").CatalogProductRecord[]> {
  const hooks = getAiRecommendationHooks();
  if (!hooks.recommendByHistory) {
    return [];
  }

  return hooks.recommendByHistory(productId, limit);
}

export async function recommendByFavorites(
  productId: string,
  favoriteIds: string[],
  limit = 8,
): Promise<import("@/components/catalogEngine/catalogTypes").CatalogProductRecord[]> {
  const hooks = getAiRecommendationHooks();
  if (!hooks.recommendByFavorites) {
    return [];
  }

  return hooks.recommendByFavorites(productId, favoriteIds, limit);
}

export async function recommendByOrders(
  productId: string,
  limit = 8,
): Promise<import("@/components/catalogEngine/catalogTypes").CatalogProductRecord[]> {
  const hooks = getAiRecommendationHooks();
  if (!hooks.recommendByOrders) {
    return [];
  }

  return hooks.recommendByOrders(productId, limit);
}

export async function recommendByAI(
  productId: string,
  kind: import("@/components/recommendationIntelligence/recommendationIntelligenceTypes").RecommendationKind,
  limit = 8,
): Promise<import("@/components/catalogEngine/catalogTypes").CatalogProductRecord[]> {
  const hooks = getAiRecommendationHooks();
  if (!hooks.recommendByAI) {
    return [];
  }

  return hooks.recommendByAI(productId, kind, limit);
}

export const AI_RECOMMENDATION_INTEGRATION_SLOTS = [
  {
    id: "recommendByHistory",
    label: "Recommend by browsing history",
    status: "ready_for_integration" as const,
  },
  {
    id: "recommendByFavorites",
    label: "Recommend by favorites",
    status: "ready_for_integration" as const,
  },
  {
    id: "recommendByOrders",
    label: "Recommend by CRM orders",
    status: "ready_for_integration" as const,
  },
  {
    id: "recommendByAI",
    label: "Recommend by external AI model",
    status: "ready_for_integration" as const,
  },
];
