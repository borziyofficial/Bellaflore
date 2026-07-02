// ==================================================
// SECTION: PROMOTION INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import {
  getMarketingCampaignById,
  listActiveMarketingCampaigns,
  listMarketingCampaigns,
} from "@/components/promotionIntelligence/promotionCampaignRegistry";
import {
  buildBannerRotationPlan,
  listActivePromotionBanners,
  selectRotatedBanner,
} from "@/components/promotionIntelligence/promotionBannerRegistry";
import {
  getLoyaltyProgram,
  getPromotionCouponByCode,
  isCouponUsable,
  listActivePromotionCoupons,
  listGiftCards,
  listPromoCodes,
} from "@/components/promotionIntelligence/promotionCouponRegistry";
import { buildPromotionExampleRegistryState } from "@/components/promotionIntelligence/promotionExamples";
import {
  allPromotionRulesPassed,
  evaluatePromotionRules,
} from "@/components/promotionIntelligence/promotionRules";
import type {
  AiPromotionSuggestion,
  FeaturedProductPromotion,
  PromotionBannerPlacement,
  PromotionEligibilityResult,
  PromotionIntelligenceSnapshot,
  PromotionRuleEvaluationContext,
  PromotionValidationResult,
  ScheduledPromotion,
} from "@/components/promotionIntelligence/promotionTypes";

export const PROMOTION_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_promotion_intelligence_v1";

let inMemorySchedules: ScheduledPromotion[] | null = null;
let inMemoryFeatured: FeaturedProductPromotion[] | null = null;
let inMemoryAiSuggestions: AiPromotionSuggestion[] | null = null;

function readSchedulesFromStorage(): ScheduledPromotion[] {
  if (typeof window === "undefined") {
    return inMemorySchedules ?? buildPromotionExampleRegistryState().schedules;
  }

  try {
    const raw = window.localStorage.getItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_schedules`,
    );
    if (!raw) {
      return inMemorySchedules ?? buildPromotionExampleRegistryState().schedules;
    }

    const parsed = JSON.parse(raw) as ScheduledPromotion[];
    return Array.isArray(parsed) ? parsed : buildPromotionExampleRegistryState().schedules;
  } catch {
    return inMemorySchedules ?? buildPromotionExampleRegistryState().schedules;
  }
}

function writeSchedulesToStorage(schedules: ScheduledPromotion[]): void {
  inMemorySchedules = schedules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_schedules`,
      JSON.stringify(schedules),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readFeaturedFromStorage(): FeaturedProductPromotion[] {
  if (typeof window === "undefined") {
    return inMemoryFeatured ?? buildPromotionExampleRegistryState().featuredProducts;
  }

  try {
    const raw = window.localStorage.getItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_featured`,
    );
    if (!raw) {
      return inMemoryFeatured ?? buildPromotionExampleRegistryState().featuredProducts;
    }

    const parsed = JSON.parse(raw) as FeaturedProductPromotion[];
    return Array.isArray(parsed)
      ? parsed
      : buildPromotionExampleRegistryState().featuredProducts;
  } catch {
    return inMemoryFeatured ?? buildPromotionExampleRegistryState().featuredProducts;
  }
}

function writeFeaturedToStorage(featured: FeaturedProductPromotion[]): void {
  inMemoryFeatured = featured;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_featured`,
      JSON.stringify(featured),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiSuggestionsFromStorage(): AiPromotionSuggestion[] {
  if (typeof window === "undefined") {
    return inMemoryAiSuggestions ?? buildPromotionExampleRegistryState().aiSuggestions;
  }

  try {
    const raw = window.localStorage.getItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_ai`,
    );
    if (!raw) {
      return inMemoryAiSuggestions ?? buildPromotionExampleRegistryState().aiSuggestions;
    }

    const parsed = JSON.parse(raw) as AiPromotionSuggestion[];
    return Array.isArray(parsed)
      ? parsed
      : buildPromotionExampleRegistryState().aiSuggestions;
  } catch {
    return inMemoryAiSuggestions ?? buildPromotionExampleRegistryState().aiSuggestions;
  }
}

function writeAiSuggestionsToStorage(suggestions: AiPromotionSuggestion[]): void {
  inMemoryAiSuggestions = suggestions;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      `${PROMOTION_INTELLIGENCE_STORAGE_KEY}_ai`,
      JSON.stringify(suggestions),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function calculateDiscountRub(
  orderTotalRub: number,
  discountType: PromotionValidationResult["coupon"] extends infer C
    ? C extends { discountType: infer T }
      ? T
      : never
    : never,
  discountValue: number,
): number {
  if (discountType === "percent") {
    return Math.round((orderTotalRub * discountValue) / 100);
  }

  if (discountType === "fixed_rub") {
    return Math.min(orderTotalRub, discountValue);
  }

  return 0;
}

export function listScheduledPromotions(
  status: ScheduledPromotion["status"] = "pending",
): ScheduledPromotion[] {
  return readSchedulesFromStorage().filter((schedule) => schedule.status === status);
}

export function listFeaturedProductPromotions(
  at: Date = new Date(),
): FeaturedProductPromotion[] {
  const timestamp = at.getTime();

  return readFeaturedFromStorage()
    .filter((item) => {
      if (!item.highlightUntil) {
        return true;
      }

      return new Date(item.highlightUntil).getTime() >= timestamp;
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function listAiPromotionSuggestions(): AiPromotionSuggestion[] {
  return readAiSuggestionsFromStorage();
}

export function validatePromoCode(
  code: string,
  context: {
    orderTotalRub: number;
    customerSegment?: string;
    at?: Date;
  },
): PromotionValidationResult {
  const at = context.at ?? new Date();
  const coupon = getPromotionCouponByCode(code);
  const messages: string[] = [];

  if (!coupon) {
    return {
      valid: false,
      coupon: null,
      discountRub: 0,
      freeDelivery: false,
      messages: ["Промокод не найден"],
    };
  }

  if (!isCouponUsable(coupon, at)) {
    messages.push("Промокод недоступен или истёк");
    return {
      valid: false,
      coupon,
      discountRub: 0,
      freeDelivery: false,
      messages,
    };
  }

  if (coupon.minOrderRub !== null && context.orderTotalRub < coupon.minOrderRub) {
    messages.push(`Минимальная сумма заказа ${coupon.minOrderRub} ₽`);
    return {
      valid: false,
      coupon,
      discountRub: 0,
      freeDelivery: false,
      messages,
    };
  }

  if (
    coupon.segmentRestrictions.length > 0 &&
    context.customerSegment &&
    !coupon.segmentRestrictions.includes(context.customerSegment)
  ) {
    messages.push("Промокод недоступен для вашего сегмента");
    return {
      valid: false,
      coupon,
      discountRub: 0,
      freeDelivery: false,
      messages,
    };
  }

  const freeDelivery = coupon.discountType === "free_delivery";
  const discountRub =
    coupon.discountType === "free_delivery"
      ? 0
      : calculateDiscountRub(
          context.orderTotalRub,
          coupon.discountType,
          coupon.kind === "gift_card" && coupon.balanceRub !== null
            ? Math.min(coupon.balanceRub, context.orderTotalRub)
            : coupon.discountValue,
        );

  messages.push("Промокод принят");

  return {
    valid: true,
    coupon,
    discountRub,
    freeDelivery,
    messages,
  };
}

export function evaluatePromotionEligibility(
  campaignId: string,
  context: PromotionRuleEvaluationContext,
): PromotionEligibilityResult {
  const campaign = getMarketingCampaignById(campaignId);

  if (!campaign) {
    return {
      eligible: false,
      campaign: null,
      passedRules: [],
      failedRules: [],
    };
  }

  const results = evaluatePromotionRules(campaign.rules, context);
  const passedRules = results.filter((result) => result.passed);
  const failedRules = results.filter((result) => !result.passed);

  return {
    eligible: allPromotionRulesPassed(campaign.rules, context),
    campaign,
    passedRules,
    failedRules,
  };
}

export function getRotatedBanner(placement: PromotionBannerPlacement, at?: Date) {
  return selectRotatedBanner(placement, at);
}

export function getBannerRotationPlan(placement: PromotionBannerPlacement, at?: Date) {
  return buildBannerRotationPlan(placement, at);
}

export function buildPromotionIntelligenceSnapshot(
  at: Date = new Date(),
): PromotionIntelligenceSnapshot {
  return {
    activeCampaigns: listActiveMarketingCampaigns(at),
    activeBanners: listActivePromotionBanners(undefined, at),
    activeCoupons: listActivePromotionCoupons(at),
    featuredProducts: listFeaturedProductPromotions(at),
    pendingSchedules: listScheduledPromotions("pending"),
    aiSuggestions: listAiPromotionSuggestions(),
    loyaltyProgram: getLoyaltyProgram(),
    generatedAt: at.toISOString(),
  };
}

export function initializePromotionIntelligence(): PromotionIntelligenceSnapshot {
  const seed = buildPromotionExampleRegistryState();
  writeSchedulesToStorage(seed.schedules);
  writeFeaturedToStorage(seed.featuredProducts);
  writeAiSuggestionsToStorage(seed.aiSuggestions);

  return buildPromotionIntelligenceSnapshot();
}

export function getPromotionIntelligenceExample() {
  return buildPromotionIntelligenceSnapshot();
}

export const PROMOTION_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "promotionIntelligence",
  storageKeys: [
    PROMOTION_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_promotion_intelligence_campaigns_v1",
    "bellaflore_promotion_intelligence_banners_v1",
    "bellaflore_promotion_intelligence_coupons_v1",
    "bellaflore_promotion_intelligence_loyalty_v1",
  ],
  capabilities: [
    "promo_codes",
    "coupons",
    "gift_cards",
    "loyalty",
    "vip_discounts",
    "birthday_discount",
    "free_delivery_campaigns",
    "flash_sale",
    "happy_hour",
    "seasonal_campaigns",
    "auto_promotion_scheduler",
    "banner_rotation",
    "featured_products",
    "ai_promotion_suggestions",
    "marketing_campaign_registry",
  ],
  layers: [
    { id: "types", file: "promotionTypes.ts" },
    { id: "examples", file: "promotionExamples.ts" },
    { id: "rules", file: "promotionRules.ts" },
    {
      id: "registries",
      files: [
        "promotionCampaignRegistry.ts",
        "promotionBannerRegistry.ts",
        "promotionCouponRegistry.ts",
      ],
    },
    { id: "engine", file: "promotionEngine.ts" },
    { id: "foundation", file: "promotionIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllPromotionFoundationCapabilities() {
  return {
    promoCodes: listPromoCodes(),
    coupons: listActivePromotionCoupons(),
    giftCards: listGiftCards(),
    loyaltyProgram: getLoyaltyProgram(),
    vipCampaigns: listMarketingCampaigns({ kind: "vip_discount" }),
    birthdayCampaigns: listMarketingCampaigns({ kind: "birthday_discount" }),
    freeDeliveryCampaigns: listMarketingCampaigns({ kind: "free_delivery" }),
    flashSaleCampaigns: listMarketingCampaigns({ kind: "flash_sale" }),
    happyHourCampaigns: listMarketingCampaigns({ kind: "happy_hour" }),
    seasonalCampaigns: listMarketingCampaigns({ kind: "seasonal" }),
    scheduler: listScheduledPromotions(),
    bannerRotation: listActivePromotionBanners(),
    featuredProducts: listFeaturedProductPromotions(),
    aiSuggestions: listAiPromotionSuggestions(),
    campaignRegistry: listMarketingCampaigns(),
  };
}
