// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Similar products engine
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
  RecommendationOccasion,
  RecommendationSeason,
  ScoredProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

export type SimilarProductsInput = {
  source: CatalogProductRecord;
  catalog: CatalogProductRecord[];
  season?: RecommendationSeason;
  occasion?: RecommendationOccasion | null;
  limit?: number;
};

export function findSimilarProducts(
  input: SimilarProductsInput,
): ScoredProductRecommendation[] {
  const season = input.season ?? getCurrentSeason();
  const occasion =
    input.occasion ?? detectPrimaryOccasion(input.source) ?? null;
  const limit = input.limit ?? 8;

  const scored = input.catalog
    .filter(
      (candidate) =>
        candidate.id !== input.source.id &&
        isProductVisibleInCatalog(candidate.availability, candidate.isPublished),
    )
    .map((candidate) => {
      const result = scoreProductRecommendation({
        source: input.source,
        candidate,
        season,
        occasion,
      });

      return {
        product: candidate,
        score: result.score,
        reasons: result.reasons,
        reasonSummary: result.reasonSummary,
      };
    })
    .filter((item) => item.score > 0);

  const staticSimilarIds = new Set(
    input.source.recommendations.similarProductIds,
  );

  const boosted = scored.map((item) => {
    if (!staticSimilarIds.has(item.product.id)) {
      return item;
    }

    return {
      ...item,
      score: item.score + 12,
      reasons: [
        ...item.reasons,
        {
          code: "admin_pinned" as const,
          label: "Рекомендовано каталогом",
          weight: 12,
        },
      ],
      reasonSummary: item.reasonSummary
        ? `${item.reasonSummary} · Рекомендовано каталогом`
        : "Рекомендовано каталогом",
    };
  });

  return rankScoredProducts(boosted).slice(0, limit);
}

export function findPremiumUpgrade(
  input: SimilarProductsInput,
): ScoredProductRecommendation[] {
  const season = input.season ?? getCurrentSeason();
  const occasion =
    input.occasion ?? detectPrimaryOccasion(input.source) ?? null;
  const limit = input.limit ?? 4;

  const scored = input.catalog
    .filter(
      (candidate) =>
        candidate.id !== input.source.id &&
        isProductVisibleInCatalog(candidate.availability, candidate.isPublished),
    )
    .map((candidate) => {
      const result = scoreProductRecommendation({
        source: input.source,
        candidate,
        season,
        occasion,
        requireHigherPrice: true,
      });

      return {
        product: candidate,
        score: result.score,
        reasons: result.reasons,
        reasonSummary: result.reasonSummary,
      };
    })
    .filter((item) => item.score > 0);

  return rankScoredProducts(scored).slice(0, limit);
}

export function findBudgetAlternative(
  input: SimilarProductsInput,
): ScoredProductRecommendation[] {
  const season = input.season ?? getCurrentSeason();
  const occasion =
    input.occasion ?? detectPrimaryOccasion(input.source) ?? null;
  const limit = input.limit ?? 4;

  const scored = input.catalog
    .filter(
      (candidate) =>
        candidate.id !== input.source.id &&
        isProductVisibleInCatalog(candidate.availability, candidate.isPublished),
    )
    .map((candidate) => {
      const result = scoreProductRecommendation({
        source: input.source,
        candidate,
        season,
        occasion,
        requireLowerPrice: true,
      });

      return {
        product: candidate,
        score: result.score,
        reasons: result.reasons,
        reasonSummary: result.reasonSummary,
      };
    })
    .filter((item) => item.score > 0);

  return rankScoredProducts(scored).slice(0, limit);
}
