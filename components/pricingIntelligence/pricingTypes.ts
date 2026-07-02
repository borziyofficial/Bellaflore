// ==================================================
// SECTION: PRICING INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type PricingRuleKind =
  | "dynamic"
  | "zone"
  | "holiday"
  | "seasonal"
  | "vip"
  | "discount"
  | "delivery";

export type PricingSeason = "spring" | "summer" | "autumn" | "winter";

export type PricingRuleStatus = "draft" | "active" | "paused" | "expired";

export type PricingDiscountType = "percent" | "fixed_rub" | "override_rub";

export type PricingVipLevel = 0 | 1 | 2 | 3;

export type PricingAiPreparationStatus = "suggestion_only";

export type PricingRule = {
  id: string;
  kind: PricingRuleKind;
  title: string;
  description: string;
  priority: number;
  status: PricingRuleStatus;
  productIds: string[];
  categoryIds: string[];
  zoneIds: string[];
  vipLevels: PricingVipLevel[];
  seasons: PricingSeason[];
  holidayDates: string[];
  adjustmentPercent: number;
  adjustmentRub: number;
  minOrderRub: number | null;
  maxDiscountRub: number | null;
  validFrom: string;
  validUntil: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type PricingDiscountRule = {
  id: string;
  code: string | null;
  title: string;
  discountType: PricingDiscountType;
  discountValue: number;
  minOrderRub: number | null;
  maxUses: number | null;
  usedCount: number;
  status: PricingRuleStatus;
  stackable: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PricingDeliveryRule = {
  id: string;
  zoneId: string;
  zoneLabel: string;
  baseDeliveryRub: number;
  freeDeliveryFromRub: number | null;
  surgeMultiplier: number;
  holidaySurchargeRub: number;
  status: PricingRuleStatus;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PricingZoneRate = {
  id: string;
  zoneId: string;
  zoneLabel: string;
  multiplier: number;
  flatAdjustmentRub: number;
  isActive: boolean;
  updatedAt: string;
};

export type PricingHistoryEntry = {
  id: string;
  productId: string;
  previousPriceRub: number;
  newPriceRub: number;
  changeReason: string;
  ruleId: string | null;
  changedAt: string;
};

export type PricingMarginAnalysis = {
  productId: string;
  basePriceRub: number;
  costRub: number;
  marginRub: number;
  marginPercent: number;
  suggestedPriceRub: number | null;
  calculatedAt: string;
};

export type PricingSuggestion = {
  id: string;
  productId: string;
  title: string;
  currentPriceRub: number;
  suggestedPriceRub: number;
  rationale: string;
  confidence: number;
  status: PricingAiPreparationStatus;
  createdAt: string;
};

export type PricingAiPreparation = {
  id: string;
  title: string;
  rationale: string;
  targetKind: PricingRuleKind;
  suggestedAdjustmentPercent: number;
  confidence: number;
  status: PricingAiPreparationStatus;
  createdAt: string;
};

export type PricingQuoteContext = {
  productId: string;
  basePriceRub: number;
  quantity?: number;
  zoneId?: string | null;
  vipLevel?: PricingVipLevel;
  season?: PricingSeason;
  orderDate?: string;
  deliveryRub?: number;
};

export type PricingQuoteLine = {
  label: string;
  amountRub: number;
  ruleId: string | null;
};

export type PricingQuote = {
  productId: string;
  basePriceRub: number;
  finalPriceRub: number;
  deliveryRub: number;
  totalRub: number;
  discountRub: number;
  appliedRules: string[];
  lines: PricingQuoteLine[];
  calculatedAt: string;
};

export type PricingStatistics = {
  totalRules: number;
  activeRules: number;
  activeDiscounts: number;
  activeDeliveryRules: number;
  averageMarginPercent: number;
  priceChangesLast30Days: number;
  topAdjustedProductId: string | null;
  calculatedAt: string;
};

export type PricingIntelligenceSnapshot = {
  rules: PricingRule[];
  discounts: PricingDiscountRule[];
  deliveryRules: PricingDeliveryRule[];
  zoneRates: PricingZoneRate[];
  history: PricingHistoryEntry[];
  margins: PricingMarginAnalysis[];
  suggestions: PricingSuggestion[];
  aiPreparations: PricingAiPreparation[];
  statistics: PricingStatistics;
  generatedAt: string;
};

export type PricingListFilters = {
  kind?: PricingRuleKind | PricingRuleKind[];
  status?: PricingRuleStatus;
  zoneId?: string;
  productId?: string;
};

export type PricingRegistryState = {
  rules: PricingRule[];
  discounts: PricingDiscountRule[];
  deliveryRules: PricingDeliveryRule[];
  zoneRates: PricingZoneRate[];
  history: PricingHistoryEntry[];
  margins: PricingMarginAnalysis[];
  suggestions: PricingSuggestion[];
  aiPreparations: PricingAiPreparation[];
};

export type PricingReadOnlySummary = {
  activeRulesCount: number;
  discountRulesCount: number;
  deliveryRulesCount: number;
  historyEntriesCount: number;
  suggestionsCount: number;
};
