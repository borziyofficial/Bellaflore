// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Frequently bought together (CRM-ready)
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import { getActiveRecommendationAddOns } from "@/components/recommendationIntelligence/recommendationAddOnsCatalog";
import {
  detectPrimaryOccasion,
  getCurrentSeason,
  rankScoredProducts,
  scoreProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationScoringEngine";
import { getOccasionAddOnCategoryHints } from "@/components/recommendationIntelligence/occasionRecommendationEngine";
import type {
  RecommendationAddOnItem,
  ScoredAddOnRecommendation,
  ScoredProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

export type FrequentlyBoughtTogetherResult = {
  products: ScoredProductRecommendation[];
  addOns: ScoredAddOnRecommendation[];
};

function scoreAddOn(
  addOn: RecommendationAddOnItem,
  source: CatalogProductRecord,
  categoryHints: string[],
): ScoredAddOnRecommendation {
  let score = addOn.sortOrder > 0 ? 40 - addOn.sortOrder * 2 : 20;
  const reasons = [];

  if (source.addOnIds.includes(addOn.id)) {
    score += 18;
    reasons.push({
      code: "crm_bundle" as const,
      label: "Часто добавляют к этому букету",
      weight: 18,
    });
  }

  if (categoryHints.includes(addOn.category)) {
    score += 16;
    reasons.push({
      code: "occasion" as const,
      label: "Подходит к поводу",
      weight: 16,
    });
  }

  if (addOn.crmSource) {
    score += 8;
    reasons.push({
      code: "crm_bundle" as const,
      label: "CRM bundle",
      weight: 8,
    });
  }

  return {
    addOn,
    score,
    reasons,
    reasonSummary: reasons.map((reason) => reason.label).join(" · "),
  };
}

export function findFrequentlyBoughtTogether(
  source: CatalogProductRecord,
  catalog: CatalogProductRecord[],
  limitProducts = 4,
  limitAddOns = 4,
): FrequentlyBoughtTogetherResult {
  const season = getCurrentSeason();
  const occasion = detectPrimaryOccasion(source);
  const categoryHints = occasion
    ? getOccasionAddOnCategoryHints(occasion)
    : ["card", "vase", "sweets"];

  const staticBundleIds = new Set(
    source.recommendations.frequentlyBoughtTogetherIds,
  );

  const products = rankScoredProducts(
    catalog
      .filter(
        (candidate) =>
          candidate.id !== source.id &&
          isProductVisibleInCatalog(
            candidate.availability,
            candidate.isPublished,
          ),
      )
      .map((candidate) => {
        const result = scoreProductRecommendation({
          source,
          candidate,
          season,
          occasion,
        });

        const bundleBoost = staticBundleIds.has(candidate.id) ? 20 : 0;

        return {
          product: candidate,
          score: result.score + bundleBoost,
          reasons: result.reasons,
          reasonSummary: result.reasonSummary,
        };
      })
      .filter((item) => item.score > 0),
  ).slice(0, limitProducts);

  const addOns = rankScoredProducts(
    getActiveRecommendationAddOns().map((addOn) =>
      scoreAddOn(addOn, source, categoryHints),
    ),
  ).slice(0, limitAddOns);

  return { products, addOns };
}
