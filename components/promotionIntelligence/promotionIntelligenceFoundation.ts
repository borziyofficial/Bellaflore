// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  PromotionKind,
  PromotionStatus,
  PromotionDiscountType,
  PromotionScope,
  PromotionBannerPlacement,
  PromotionRuleOperator,
  PromotionRuleCondition,
  PromotionRule,
  PromotionRuleEvaluationContext,
  PromotionRuleEvaluationResult,
  MarketingCampaign,
  PromotionBanner,
  PromotionCouponKind,
  PromotionCoupon,
  LoyaltyTier,
  LoyaltyProgram,
  ScheduledPromotionAction,
  ScheduledPromotionStatus,
  ScheduledPromotion,
  FeaturedProductPromotion,
  AiPromotionSuggestionStatus,
  AiPromotionSuggestion,
  PromotionValidationResult,
  PromotionEligibilityResult,
  PromotionIntelligenceSnapshot,
  PromotionListFilters,
  PromotionRegistryState,
} from "@/components/promotionIntelligence/promotionTypes";

export {
  PROMOTION_EXAMPLE_RULES,
  PROMOTION_EXAMPLE_CAMPAIGNS,
  PROMOTION_EXAMPLE_BANNERS,
  PROMOTION_EXAMPLE_COUPONS,
  PROMOTION_EXAMPLE_FEATURED,
  PROMOTION_EXAMPLE_SCHEDULES,
  PROMOTION_EXAMPLE_AI_SUGGESTIONS,
  PROMOTION_EXAMPLE_LOYALTY,
  buildPromotionExampleRegistryState,
} from "@/components/promotionIntelligence/promotionExamples";

export {
  evaluatePromotionRule,
  evaluatePromotionRules,
  allPromotionRulesPassed,
  PROMOTION_RULE_CONDITIONS,
  PROMOTION_KINDS,
} from "@/components/promotionIntelligence/promotionRules";

export {
  PROMOTION_CAMPAIGN_STORAGE_KEY,
  listMarketingCampaigns,
  getMarketingCampaignById,
  getMarketingCampaignBySlug,
  listActiveMarketingCampaigns,
  listCampaignsByKind,
  registerMarketingCampaign,
  seedMarketingCampaignRegistry,
  clearMarketingCampaignRegistry,
  isCampaignActive,
  resolveCampaignStatus,
} from "@/components/promotionIntelligence/promotionCampaignRegistry";

export {
  PROMOTION_BANNER_STORAGE_KEY,
  listPromotionBanners,
  getPromotionBannerById,
  listActivePromotionBanners,
  listBannersByCampaign,
  registerPromotionBanner,
  seedPromotionBannerRegistry,
  clearPromotionBannerRegistry,
  resolveBannerStatus,
  selectRotatedBanner,
  buildBannerRotationPlan,
} from "@/components/promotionIntelligence/promotionBannerRegistry";

export {
  PROMOTION_COUPON_STORAGE_KEY,
  PROMOTION_LOYALTY_STORAGE_KEY,
  listPromotionCoupons,
  getPromotionCouponById,
  getPromotionCouponByCode,
  listActivePromotionCoupons,
  listCouponsByKind,
  listPromoCodes,
  listGiftCards,
  listCouponsByCampaign,
  registerPromotionCoupon,
  getLoyaltyProgram,
  registerLoyaltyProgram,
  seedPromotionCouponRegistry,
  clearPromotionCouponRegistry,
  resolveCouponStatus,
  isCouponUsable,
} from "@/components/promotionIntelligence/promotionCouponRegistry";

export {
  PROMOTION_INTELLIGENCE_STORAGE_KEY,
  listScheduledPromotions,
  listFeaturedProductPromotions,
  listAiPromotionSuggestions,
  validatePromoCode,
  evaluatePromotionEligibility,
  getRotatedBanner,
  getBannerRotationPlan,
  buildPromotionIntelligenceSnapshot,
  initializePromotionIntelligence,
  getPromotionIntelligenceExample,
  PROMOTION_INTELLIGENCE_ENGINE_SCHEMA,
  listAllPromotionFoundationCapabilities,
} from "@/components/promotionIntelligence/promotionEngine";
