// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type PromotionKind =
  | "promo_code"
  | "coupon"
  | "gift_card"
  | "loyalty"
  | "vip_discount"
  | "birthday_discount"
  | "free_delivery"
  | "flash_sale"
  | "happy_hour"
  | "seasonal"
  | "featured_products"
  | "banner"
  | "campaign";

export type PromotionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "expired"
  | "archived";

export type PromotionDiscountType =
  | "percent"
  | "fixed_rub"
  | "free_delivery"
  | "gift"
  | "loyalty_points";

export type PromotionScope =
  | "order"
  | "product"
  | "category"
  | "delivery"
  | "customer_segment";

export type PromotionBannerPlacement =
  | "hero"
  | "catalog"
  | "checkout"
  | "cart"
  | "footer";

export type PromotionRuleOperator =
  | "eq"
  | "gte"
  | "lte"
  | "in"
  | "between";

export type PromotionRuleCondition =
  | "min_order_rub"
  | "max_order_rub"
  | "vip_level"
  | "customer_segment"
  | "birthday_month"
  | "order_count"
  | "day_of_week"
  | "hour_range"
  | "season"
  | "product_in_cart"
  | "category_in_cart"
  | "first_order"
  | "loyalty_points";

export type PromotionRule = {
  id: string;
  kind: PromotionKind;
  condition: PromotionRuleCondition;
  operator: PromotionRuleOperator;
  value: string | number | boolean | string[];
  priority: number;
  label: string;
};

export type PromotionRuleEvaluationContext = {
  orderTotalRub?: number;
  vipLevel?: number;
  customerSegment?: string;
  birthdayMonth?: number;
  orderCount?: number;
  dayOfWeek?: number;
  hour?: number;
  season?: string;
  productIdsInCart?: string[];
  categoryIdsInCart?: string[];
  isFirstOrder?: boolean;
  loyaltyPoints?: number;
};

export type PromotionRuleEvaluationResult = {
  ruleId: string;
  passed: boolean;
  reason: string;
};

export type MarketingCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: PromotionKind;
  status: PromotionStatus;
  scope: PromotionScope;
  startsAt: string;
  endsAt: string | null;
  rules: PromotionRule[];
  bannerIds: string[];
  couponIds: string[];
  featuredProductIds: string[];
  priority: number;
  tags: string[];
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type PromotionBanner = {
  id: string;
  campaignId: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  placement: PromotionBannerPlacement;
  rotationWeight: number;
  status: PromotionStatus;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromotionCouponKind = "coupon" | "promo_code" | "gift_card";

export type PromotionCoupon = {
  id: string;
  code: string;
  kind: PromotionCouponKind;
  discountType: PromotionDiscountType;
  discountValue: number;
  minOrderRub: number | null;
  maxUses: number | null;
  usedCount: number;
  balanceRub: number | null;
  status: PromotionStatus;
  validFrom: string;
  validUntil: string | null;
  campaignId: string | null;
  segmentRestrictions: string[];
  productIds: string[];
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyTier = {
  id: string;
  name: string;
  minPoints: number;
  discountPercent: number;
  perks: string[];
};

export type LoyaltyProgram = {
  id: string;
  name: string;
  pointsPerRub: number;
  tiers: LoyaltyTier[];
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledPromotionAction =
  | "activate"
  | "deactivate"
  | "rotate_banner"
  | "expire_coupon";

export type ScheduledPromotionStatus = "pending" | "completed" | "skipped";

export type ScheduledPromotion = {
  id: string;
  campaignId: string;
  runAt: string;
  action: ScheduledPromotionAction;
  status: ScheduledPromotionStatus;
  createdAt: string;
};

export type FeaturedProductPromotion = {
  productId: string;
  campaignId: string | null;
  badge: string | null;
  sortOrder: number;
  highlightUntil: string | null;
};

export type AiPromotionSuggestionStatus = "suggestion_only";

export type AiPromotionSuggestion = {
  id: string;
  title: string;
  rationale: string;
  suggestedKind: PromotionKind;
  confidence: number;
  status: AiPromotionSuggestionStatus;
  createdAt: string;
};

export type PromotionValidationResult = {
  valid: boolean;
  coupon: PromotionCoupon | null;
  discountRub: number;
  freeDelivery: boolean;
  messages: string[];
};

export type PromotionEligibilityResult = {
  eligible: boolean;
  campaign: MarketingCampaign | null;
  passedRules: PromotionRuleEvaluationResult[];
  failedRules: PromotionRuleEvaluationResult[];
};

export type PromotionIntelligenceSnapshot = {
  activeCampaigns: MarketingCampaign[];
  activeBanners: PromotionBanner[];
  activeCoupons: PromotionCoupon[];
  featuredProducts: FeaturedProductPromotion[];
  pendingSchedules: ScheduledPromotion[];
  aiSuggestions: AiPromotionSuggestion[];
  loyaltyProgram: LoyaltyProgram | null;
  generatedAt: string;
};

export type PromotionListFilters = {
  kind?: PromotionKind | PromotionKind[];
  status?: PromotionStatus | PromotionStatus[];
  query?: string;
};

export type PromotionRegistryState = {
  campaigns: MarketingCampaign[];
  banners: PromotionBanner[];
  coupons: PromotionCoupon[];
  featuredProducts: FeaturedProductPromotion[];
  schedules: ScheduledPromotion[];
  aiSuggestions: AiPromotionSuggestion[];
  loyaltyProgram: LoyaltyProgram | null;
};
