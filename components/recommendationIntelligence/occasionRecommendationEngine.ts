// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Occasion engine
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import {
  getCurrentSeason,
  rankScoredProducts,
  scoreProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationScoringEngine";
import type {
  RecommendationOccasion,
  ScoredProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

const OCCASION_COLOR_HINTS: Record<RecommendationOccasion, string[]> = {
  birthday: ["red", "pink", "soft"],
  wedding: ["white", "soft"],
  romantic: ["red", "pink"],
  mother: ["pink", "soft"],
  gift: ["red", "pink", "white"],
  vip: ["white", "red"],
};

const OCCASION_FLOWER_HINTS: Record<RecommendationOccasion, string[]> = {
  birthday: ["роз", "тюльпан", "гербер"],
  wedding: ["роз", "пион", "лили"],
  romantic: ["роз", "пион"],
  mother: ["роз", "пион", "тюльпан"],
  gift: ["роз", "гортенз"],
  vip: ["роз", "орхид"],
};

function boostOccasionMatch(
  product: CatalogProductRecord,
  occasion: RecommendationOccasion,
): number {
  let boost = 0;
  const colorHints = OCCASION_COLOR_HINTS[occasion];
  const flowerHints = OCCASION_FLOWER_HINTS[occasion];

  if (product.colors.some((color) => colorHints.includes(color))) {
    boost += 8;
  }

  const flowerText = product.flowerTypes.join(" ").toLowerCase();
  if (flowerHints.some((hint) => flowerText.includes(hint))) {
    boost += 10;
  }

  return boost;
}

export function findOccasionRecommendations(
  source: CatalogProductRecord,
  catalog: CatalogProductRecord[],
  occasion: RecommendationOccasion,
  limit = 6,
): ScoredProductRecommendation[] {
  const season = getCurrentSeason();

  const scored = catalog
    .filter(
      (candidate) =>
        candidate.id !== source.id &&
        isProductVisibleInCatalog(candidate.availability, candidate.isPublished),
    )
    .map((candidate) => {
      const result = scoreProductRecommendation({
        source,
        candidate,
        season,
        occasion,
      });

      const boost = boostOccasionMatch(candidate, occasion);

      return {
        product: candidate,
        score: result.score + boost,
        reasons: result.reasons,
        reasonSummary: result.reasonSummary,
      };
    })
    .filter((item) => item.score > 0);

  return rankScoredProducts(scored).slice(0, limit);
}

export function getOccasionAddOnCategoryHints(
  occasion: RecommendationOccasion,
): Array<"card" | "balloons" | "decor" | "vase" | "candle" | "toy" | "sweets"> {
  switch (occasion) {
    case "birthday":
      return ["balloons", "card", "sweets"];
    case "wedding":
      return ["decor", "vase", "card"];
    case "romantic":
      return ["candle", "card", "sweets"];
    case "mother":
      return ["card", "sweets", "vase"];
    default:
      return ["card", "vase", "sweets"];
  }
}
