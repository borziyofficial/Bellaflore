// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Core engine (Stage 35 isolated)
// ==================================================
import { buildRecommendationExampleRegistryState } from "@/components/recommendationIntelligence/recommendationExamples";
import {
  getViewedProductIds,
  listAiRecommendations,
  listRecentlyViewed,
  listRecommendationHistory,
  seedRecommendationHistoryRegistry,
} from "@/components/recommendationIntelligence/recommendationHistoryRegistry";
import {
  getBestSellers,
  getFrequentlyBoughtTogether,
  getRelatedProducts,
  getSeasonalRecommendations,
  getSimilarBouquets,
  getTrendingProducts,
  listRecommendationProducts,
  listRecommendationRules,
  seedRecommendationRulesRegistry,
} from "@/components/recommendationIntelligence/recommendationRulesRegistry";
import { calculateRecommendationStatistics } from "@/components/recommendationIntelligence/recommendationStatistics";
import type {
  PersonalizedRecommendationContext,
  RecommendationIntelligenceSnapshot,
  RecommendationQueryOptions,
  RecommendationReadOnlySummary,
  RecommendationSet,
  RecommendationScore,
} from "@/components/recommendationIntelligence/recommendationTypes";

export const RECOMMENDATION_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_recommendation_intelligence_v1";

function scorePersonalizedProduct(
  productId: string,
  context: PersonalizedRecommendationContext,
): RecommendationScore | null {
  const products = listRecommendationProducts();
  const product = products.find((p) => p.productId === productId);
  if (!product) {
    return null;
  }

  let score = product.popularityScore * 0.4;
  const signals: RecommendationScore["signals"] = ["popularity"];
  const reasons: string[] = ["popularity"];

  if (context.favoriteProductIds.includes(productId)) {
    score += 30;
    signals.push("personal_history");
    reasons.push("favorite");
  }

  if (context.orderProductIds.includes(productId)) {
    score += 25;
    signals.push("personal_history");
    reasons.push("ordered before");
  }

  if (context.viewedProductIds.includes(productId)) {
    score += 15;
    signals.push("personal_history");
    reasons.push("viewed");
  }

  if (
    context.preferredCategories.some((cat) => product.categoryIds.includes(cat))
  ) {
    score += 20;
    reasons.push("preferred category");
  }

  if (context.season && product.seasons.includes(context.season)) {
    score += 15;
    signals.push("seasonal");
    reasons.push(`season:${context.season}`);
  }

  return {
    productId,
    kind: "personalized",
    score: Math.round(score),
    signals,
    reason: reasons.join(", "),
    calculatedAt: new Date().toISOString(),
  };
}

export function getPersonalizedRecommendations(
  context: PersonalizedRecommendationContext,
  options: RecommendationQueryOptions = {},
): RecommendationSet {
  const limit = options.limit ?? 6;
  const minScore = options.minScore ?? 40;

  const products = listRecommendationProducts()
    .filter((p) => !context.orderProductIds.includes(p.productId))
    .map((p) => scorePersonalizedProduct(p.productId, context))
    .filter(Boolean) as RecommendationScore[];

  const items = products
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    id: `set-personalized-${context.customerId}`,
    kind: "personalized",
    title: "Personalized for you",
    sourceProductId: null,
    customerId: context.customerId,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function getRecentlyViewedRecommendations(
  sessionId: string,
  limit = 6,
): RecommendationSet {
  const viewed = listRecentlyViewed(sessionId, limit);

  const items: RecommendationScore[] = viewed.map((entry) => ({
    productId: entry.productId,
    kind: "recently_viewed",
    score: 100,
    signals: ["personal_history"],
    reason: "recently viewed",
    calculatedAt: entry.viewedAt,
  }));

  return {
    id: `set-recent-${sessionId}`,
    kind: "recently_viewed",
    title: "Recently Viewed",
    sourceProductId: null,
    customerId: viewed[0]?.customerId ?? null,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function getAiRecommendations(
  customerId?: string,
  limit = 5,
): RecommendationSet {
  const suggestions = customerId
    ? listAiRecommendations().filter((s) => s.customerId === customerId || s.customerId === null)
    : listAiRecommendations();

  const items: RecommendationScore[] = suggestions.slice(0, limit).map((s) => ({
    productId: s.productId,
    kind: "ai" as const,
    score: Math.round(s.confidence * 100),
    signals: ["similarity", "personal_history"] as RecommendationScore["signals"],
    reason: s.rationale,
    calculatedAt: s.createdAt,
  }));

  return {
    id: `set-ai-${customerId ?? "anonymous"}`,
    kind: "ai",
    title: "AI Recommendations",
    sourceProductId: null,
    customerId: customerId ?? null,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function buildRecommendationSet(
  kind: RecommendationSet["kind"],
  sourceProductId?: string,
  options: RecommendationQueryOptions = {},
): RecommendationSet {
  const limit = options.limit ?? 4;
  let items: RecommendationScore[] = [];
  let title = "";

  switch (kind) {
    case "related":
      items = sourceProductId ? getRelatedProducts(sourceProductId, limit) : [];
      title = "Related Products";
      break;
    case "similar":
      items = sourceProductId ? getSimilarBouquets(sourceProductId, limit) : [];
      title = "Similar Bouquets";
      break;
    case "frequently_bought_together":
      items = sourceProductId ? getFrequentlyBoughtTogether(sourceProductId, limit) : [];
      title = "Frequently Bought Together";
      break;
    case "seasonal":
      items = getSeasonalRecommendations(options.season ?? "spring", limit);
      title = "Seasonal Recommendations";
      break;
    case "trending":
      items = getTrendingProducts(limit);
      title = "Trending Products";
      break;
    case "best_seller":
      items = getBestSellers(limit);
      title = "Best Sellers";
      break;
    default:
      title = kind;
      items = [];
  }

  return {
    id: `set-${kind}-${sourceProductId ?? "global"}`,
    kind,
    title,
    sourceProductId: sourceProductId ?? null,
    customerId: null,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function buildRecommendationIntelligenceSnapshot(
  at: Date = new Date(),
): RecommendationIntelligenceSnapshot {
  return {
    rules: listRecommendationRules(),
    products: listRecommendationProducts(),
    history: listRecommendationHistory(),
    aiSuggestions: listAiRecommendations(),
    statistics: calculateRecommendationStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeRecommendationIntelligence(): RecommendationIntelligenceSnapshot {
  seedRecommendationRulesRegistry();
  seedRecommendationHistoryRegistry();
  return buildRecommendationIntelligenceSnapshot();
}

export function getRecommendationIntelligenceExample() {
  return buildRecommendationExampleRegistryState().rules[0];
}

export function getRecommendationReadOnlySummary(): RecommendationReadOnlySummary {
  return {
    ruleCount: listRecommendationRules().length,
    productCount: listRecommendationProducts().length,
    historyCount: listRecommendationHistory().length,
    aiSuggestionCount: listAiRecommendations().length,
  };
}

export function readRecommendationFoundationCapabilities(sourceProductId = "product-rose-classic") {
  return {
    relatedProducts: getRelatedProducts(sourceProductId),
    similarBouquets: getSimilarBouquets(sourceProductId),
    frequentlyBoughtTogether: getFrequentlyBoughtTogether(sourceProductId),
    personalized: getPersonalizedRecommendations({
      customerId: "customer-anna-ivanova",
      favoriteProductIds: ["product-rose-classic"],
      orderProductIds: ["product-peony-premium"],
      viewedProductIds: getViewedProductIds("session-001"),
      preferredCategories: ["cat-bouquets"],
      season: "spring",
    }),
    seasonal: getSeasonalRecommendations("spring"),
    trending: getTrendingProducts(),
    bestSellers: getBestSellers(),
    recentlyViewed: getRecentlyViewedRecommendations("session-001"),
    aiRecommendations: getAiRecommendations("customer-anna-ivanova"),
    statistics: calculateRecommendationStatistics(),
  };
}

export const RECOMMENDATION_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "recommendationIntelligence",
  layer: "stage_35_isolated_foundation",
  storageKeys: [
    RECOMMENDATION_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_recommendation_intelligence_rules_v1",
    "bellaflore_recommendation_intelligence_products_v1",
    "bellaflore_recommendation_intelligence_history_v1",
    "bellaflore_recommendation_intelligence_ai_v1",
  ],
  capabilities: [
    "related_products",
    "similar_bouquets",
    "frequently_bought_together",
    "ai_recommendations",
    "personalized_recommendations",
    "seasonal_recommendations",
    "trending_products",
    "best_sellers",
    "recently_viewed",
    "recommendation_score",
    "recommendation_statistics",
    "recommendation_history",
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllRecommendationFoundationCapabilities() {
  return readRecommendationFoundationCapabilities();
}
