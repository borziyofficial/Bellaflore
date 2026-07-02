// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Seasonal engine
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import {
  detectPrimaryOccasion,
  getCurrentSeason,
  rankScoredProducts,
  scoreProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationScoringEngine";
import type {
  RecommendationSeason,
  ScoredProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

const SEASON_FLOWER_HINTS: Record<RecommendationSeason, string[]> = {
  spring: ["пион", "тюльпан", "нарцисс"],
  summer: ["роз", "гортенз", "лили"],
  autumn: ["хризантем", "астр", "георгин"],
  winter: ["амариллис", "роз", "эвкалипт"],
};

function boostSeasonalMatch(
  product: CatalogProductRecord,
  season: RecommendationSeason,
): number {
  const hints = SEASON_FLOWER_HINTS[season];
  const flowerText = [
    ...product.flowerTypes,
    product.title,
    product.shortDescription,
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (hints.some((hint) => flowerText.includes(hint))) {
    return 14;
  }

  if (product.seasons.includes(season) || product.seasonalScore >= 75) {
    return 8;
  }

  return 0;
}

export function findSeasonalRecommendations(
  source: CatalogProductRecord,
  catalog: CatalogProductRecord[],
  season: RecommendationSeason = getCurrentSeason(),
  limit = 6,
): ScoredProductRecommendation[] {
  const occasion = detectPrimaryOccasion(source);

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

      const boost = boostSeasonalMatch(candidate, season);

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

export function getSeasonalFlowerLabel(season: RecommendationSeason): string {
  switch (season) {
    case "spring":
      return "пионы и тюльпаны";
    case "summer":
      return "летние букеты";
    case "autumn":
      return "хризантемы";
    case "winter":
      return "амариллисы";
    default:
      return "сезонные букеты";
  }
}
