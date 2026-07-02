// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export {
  registerAiRecommendationHooks,
  getAiRecommendationHooks,
  clearAiRecommendationHooks,
  recommendByHistory,
  recommendByFavorites,
  recommendByOrders,
  recommendByAI,
  AI_RECOMMENDATION_INTEGRATION_SLOTS,
} from "@/components/recommendationIntelligence/aiRecommendationFoundation";

export {
  buildRecommendationIntelligence,
  buildRecommendationIntelligenceSync,
} from "@/components/recommendationIntelligence/recommendationIntelligenceEngine";

export {
  buildProductPageRecommendations,
  type RecommendationUiProduct,
  type RecommendationUiResult,
  type RecommendationUiSet,
} from "@/components/recommendationIntelligence/recommendationIntelligenceBridge";

export {
  readRecommendationAdminRule,
  writeRecommendationAdminRule,
  DEFAULT_RECOMMENDATION_ADMIN_RULE,
  RECOMMENDATION_ADMIN_STORAGE_KEY,
  isRecommendationKindEnabled,
} from "@/components/recommendationIntelligence/recommendationAdminStore";

export type {
  RecommendationKind,
  RecommendationSet,
  RecommendationContext,
  RecommendationIntelligenceResult,
  RecommendationAdminRule,
  ScoredProductRecommendation,
  ScoredAddOnRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";
