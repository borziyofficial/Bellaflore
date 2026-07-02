// ==================================================
// SECTION: PRICING INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildPricingExampleRegistryState } from "@/components/pricingIntelligence/pricingExamples";
import {
  calculateDiscountAmount,
  listAiPricePreparations,
  listDiscountRules,
  listPriceSuggestions,
  seedPricingDiscountRegistry,
} from "@/components/pricingIntelligence/pricingDiscountRegistry";
import {
  calculateAverageMarginPercent,
  countPriceChangesSince,
  getTopAdjustedProductId,
  listMarginAnalysis,
  listPriceHistory,
  seedPricingHistoryRegistry,
} from "@/components/pricingIntelligence/pricingHistoryRegistry";
import {
  getDeliveryPriceRuleByZone,
  getZoneRateById,
  listActivePricingRules,
  listDeliveryPriceRules,
  listDynamicPricingRules,
  listHolidayPricingRules,
  listSeasonalPricingRules,
  listVipPricingRules,
  listZonePricingRules,
  listZoneRates,
  resolveApplicablePricingRules,
  seedPricingRulesRegistry,
} from "@/components/pricingIntelligence/pricingRulesRegistry";
import type {
  PricingIntelligenceSnapshot,
  PricingQuote,
  PricingQuoteContext,
  PricingReadOnlySummary,
  PricingStatistics,
} from "@/components/pricingIntelligence/pricingTypes";

export const PRICING_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_pricing_intelligence_v1";

function applyRuleAdjustment(priceRub: number, rule: { adjustmentPercent: number; adjustmentRub: number; maxDiscountRub: number | null }): number {
  let next = priceRub;

  if (rule.adjustmentPercent !== 0) {
    next += Math.round((priceRub * rule.adjustmentPercent) / 100);
  }

  next += rule.adjustmentRub;

  if (rule.maxDiscountRub !== null && next < priceRub - rule.maxDiscountRub) {
    next = priceRub - rule.maxDiscountRub;
  }

  return Math.max(0, next);
}

export function calculateDeliveryPrice(input: {
  zoneId: string;
  orderTotalRub: number;
  at?: Date;
}): number {
  const at = input.at ?? new Date();
  const rule = getDeliveryPriceRuleByZone(input.zoneId, at);

  if (!rule) {
    return 0;
  }

  if (rule.freeDeliveryFromRub !== null && input.orderTotalRub >= rule.freeDeliveryFromRub) {
    return 0;
  }

  const base = Math.round(rule.baseDeliveryRub * rule.surgeMultiplier);
  return base + rule.holidaySurchargeRub;
}

export function buildPricingQuote(context: PricingQuoteContext): PricingQuote {
  const quantity = context.quantity ?? 1;
  const at = context.orderDate ? new Date(context.orderDate) : new Date();
  let priceRub = context.basePriceRub;
  const lines: PricingQuote["lines"] = [];
  const appliedRules: string[] = [];

  lines.push({
    label: "Base price",
    amountRub: context.basePriceRub,
    ruleId: null,
  });

  const rules = resolveApplicablePricingRules({
    productId: context.productId,
    zoneId: context.zoneId,
    vipLevel: context.vipLevel,
    season: context.season,
    orderDate: at,
  });

  for (const rule of rules) {
    const before = priceRub;
    priceRub = applyRuleAdjustment(priceRub, rule);

    if (priceRub !== before) {
      appliedRules.push(rule.id);
      lines.push({
        label: rule.title,
        amountRub: priceRub - before,
        ruleId: rule.id,
      });
    }
  }

  if (context.zoneId) {
    const zoneRate = getZoneRateById(context.zoneId);
    if (zoneRate) {
      const before = priceRub;
      priceRub = Math.round(priceRub * zoneRate.multiplier) + zoneRate.flatAdjustmentRub;

      if (priceRub !== before) {
        lines.push({
          label: `Zone ${zoneRate.zoneLabel}`,
          amountRub: priceRub - before,
          ruleId: null,
        });
      }
    }
  }

  const finalPriceRub = priceRub * quantity;
  const discountRub = Math.max(0, context.basePriceRub * quantity - finalPriceRub);

  let deliveryRub = context.deliveryRub ?? 0;
  if (deliveryRub === 0 && context.zoneId) {
    deliveryRub = calculateDeliveryPrice({
      zoneId: context.zoneId,
      orderTotalRub: finalPriceRub,
      at,
    });
  }

  return {
    productId: context.productId,
    basePriceRub: context.basePriceRub,
    finalPriceRub,
    deliveryRub,
    totalRub: finalPriceRub + deliveryRub,
    discountRub,
    appliedRules,
    lines,
    calculatedAt: at.toISOString(),
  };
}

export function calculatePricingStatistics(): PricingStatistics {
  const allRules = listActivePricingRules();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    totalRules: allRules.length,
    activeRules: allRules.filter((rule) => rule.status === "active").length,
    activeDiscounts: listDiscountRules().length,
    activeDeliveryRules: listDeliveryPriceRules().length,
    averageMarginPercent: calculateAverageMarginPercent(),
    priceChangesLast30Days: countPriceChangesSince(thirtyDaysAgo),
    topAdjustedProductId: getTopAdjustedProductId(),
    calculatedAt: new Date().toISOString(),
  };
}

export function buildPricingIntelligenceSnapshot(
  at: Date = new Date(),
): PricingIntelligenceSnapshot {
  return {
    rules: listActivePricingRules(at),
    discounts: listDiscountRules(at),
    deliveryRules: listDeliveryPriceRules(at),
    zoneRates: listZoneRates(),
    history: listPriceHistory(),
    margins: listMarginAnalysis(),
    suggestions: listPriceSuggestions(),
    aiPreparations: listAiPricePreparations(),
    statistics: calculatePricingStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializePricingIntelligence(): PricingIntelligenceSnapshot {
  seedPricingRulesRegistry();
  seedPricingDiscountRegistry();
  seedPricingHistoryRegistry();
  return buildPricingIntelligenceSnapshot();
}

export function getPricingIntelligenceExample() {
  return buildPricingExampleRegistryState().rules[0];
}

export function getPricingReadOnlySummary(): PricingReadOnlySummary {
  return {
    activeRulesCount: listActivePricingRules().length,
    discountRulesCount: listDiscountRules().length,
    deliveryRulesCount: listDeliveryPriceRules().length,
    historyEntriesCount: listPriceHistory().length,
    suggestionsCount: listPriceSuggestions().length,
  };
}

export function readPricingFoundationCapabilities() {
  return {
    dynamicPricing: listDynamicPricingRules(),
    zonePricing: listZonePricingRules(),
    holidayPricing: listHolidayPricingRules(),
    seasonalPricing: listSeasonalPricingRules(),
    vipPricing: listVipPricingRules(),
    discountRules: listDiscountRules(),
    deliveryPriceRules: listDeliveryPriceRules(),
    marginAnalysis: listMarginAnalysis(),
    priceHistory: listPriceHistory(),
    priceSuggestions: listPriceSuggestions(),
    aiPricePreparation: listAiPricePreparations(),
    statistics: calculatePricingStatistics(),
    sampleQuote: buildPricingQuote({
      productId: "product-rose-classic",
      basePriceRub: 4500,
      zoneId: "base",
      vipLevel: 2,
      season: "spring",
    }),
    sampleDiscount: calculateDiscountAmount(
      6500,
      listDiscountRules()[0] ?? {
        id: "sample",
        code: "FIRST10",
        title: "Sample",
        discountType: "percent",
        discountValue: 10,
        minOrderRub: 3000,
        maxUses: null,
        usedCount: 0,
        status: "active",
        stackable: false,
        validFrom: new Date().toISOString(),
        validUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ),
  };
}

export const PRICING_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "pricingIntelligence",
  storageKeys: [
    PRICING_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_pricing_intelligence_rules_v1",
    "bellaflore_pricing_intelligence_zone_rates_v1",
    "bellaflore_pricing_intelligence_delivery_rules_v1",
    "bellaflore_pricing_intelligence_discounts_v1",
    "bellaflore_pricing_intelligence_suggestions_v1",
    "bellaflore_pricing_intelligence_ai_v1",
    "bellaflore_pricing_intelligence_history_v1",
    "bellaflore_pricing_intelligence_margins_v1",
  ],
  capabilities: [
    "dynamic_pricing",
    "zone_pricing",
    "holiday_pricing",
    "seasonal_pricing",
    "vip_pricing",
    "discount_rules",
    "delivery_price_rules",
    "margin_analysis",
    "price_history",
    "price_suggestions",
    "ai_price_preparation",
    "pricing_statistics",
  ],
  layers: [
    { id: "types", file: "pricingTypes.ts" },
    { id: "examples", file: "pricingExamples.ts" },
    {
      id: "registries",
      files: [
        "pricingRulesRegistry.ts",
        "pricingDiscountRegistry.ts",
        "pricingHistoryRegistry.ts",
      ],
    },
    { id: "engine", file: "pricingEngine.ts" },
    { id: "foundation", file: "pricingIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllPricingFoundationCapabilities() {
  return readPricingFoundationCapabilities();
}
