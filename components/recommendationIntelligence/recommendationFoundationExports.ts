// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Stage 35 isolated foundation exports
//
// NOTE: Legacy wired exports remain in
// recommendationIntelligenceFoundation.ts (unchanged).
// ==================================================
export type {
  RecommendationKind,
  RecommendationSeason,
  RecommendationAiStatus,
  RecommendationScoreSignal,
  RecommendationProductRef,
  RecommendationRule,
  RecommendationScore,
  RecommendationSet,
  RecommendationHistoryEntry,
  RecommendationAiSuggestion,
  RecommendationStatistics,
  RecommendationIntelligenceSnapshot,
  RecommendationListFilters,
  RecommendationRegistryState,
  RecommendationReadOnlySummary,
  PersonalizedRecommendationContext,
  RecommendationQueryOptions,
} from "@/components/recommendationIntelligence/recommendationTypes";

export {
  RECOMMENDATION_EXAMPLE_PRODUCTS,
  RECOMMENDATION_EXAMPLE_RULES,
  RECOMMENDATION_EXAMPLE_HISTORY,
  RECOMMENDATION_EXAMPLE_AI,
  RECOMMENDATION_RELATED_MAP,
  RECOMMENDATION_FBT_MAP,
  buildRecommendationExampleRegistryState,
} from "@/components/recommendationIntelligence/recommendationExamples";

export {
  RECOMMENDATION_RULES_STORAGE_KEY,
  RECOMMENDATION_PRODUCTS_STORAGE_KEY,
  listRecommendationRules,
  getRecommendationRuleById,
  listRecommendationProducts,
  getRecommendationProduct,
  getRelatedProducts,
  getSimilarBouquets,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
  getBestSellers,
  getSeasonalRecommendations,
  registerRecommendationRule,
  seedRecommendationRulesRegistry,
  clearRecommendationRulesRegistry,
  calculateRecommendationScore,
} from "@/components/recommendationIntelligence/recommendationRulesRegistry";

export {
  RECOMMENDATION_HISTORY_STORAGE_KEY,
  RECOMMENDATION_AI_STORAGE_KEY,
  listRecommendationHistory,
  listRecentlyViewed,
  listRecommendationHistoryByKind,
  listAiRecommendations,
  listAiRecommendationsByCustomer,
  getAiRecommendationById,
  appendRecommendationHistoryEntry,
  registerAiRecommendation,
  seedRecommendationHistoryRegistry,
  clearRecommendationHistoryRegistry,
  getViewedProductIds,
  countHistoryClicks,
  countHistoryPurchases,
} from "@/components/recommendationIntelligence/recommendationHistoryRegistry";

export {
  calculateRecommendationStatistics,
  buildRecommendationStatisticsReport,
} from "@/components/recommendationIntelligence/recommendationStatistics";

export {
  RECOMMENDATION_INTELLIGENCE_STORAGE_KEY,
  getPersonalizedRecommendations,
  getRecentlyViewedRecommendations,
  getAiRecommendations,
  buildRecommendationSet,
  buildRecommendationIntelligenceSnapshot,
  initializeRecommendationIntelligence,
  getRecommendationIntelligenceExample,
  getRecommendationReadOnlySummary,
  readRecommendationFoundationCapabilities,
  RECOMMENDATION_INTELLIGENCE_ENGINE_SCHEMA,
  listAllRecommendationFoundationCapabilities,
} from "@/components/recommendationIntelligence/recommendationEngine";
