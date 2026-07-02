// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Scoring engine
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import type {
  RecommendationMatchReason,
  RecommendationOccasion,
  RecommendationSeason,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

const SCORE_WEIGHTS = {
  color: 25,
  flower: 25,
  category: 15,
  priceBand: 15,
  season: 10,
  occasion: 10,
  popularity: 10,
  availability: 10,
} as const;

export type RecommendationScoreInput = {
  source: CatalogProductRecord;
  candidate: CatalogProductRecord;
  season: RecommendationSeason;
  occasion: RecommendationOccasion | null;
  requireHigherPrice?: boolean;
  requireLowerPrice?: boolean;
};

export type RecommendationScoreResult = {
  score: number;
  reasons: RecommendationMatchReason[];
  reasonSummary: string;
};

function intersectCount(left: string[], right: string[]): number {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  return left.filter((value) => rightSet.has(value.toLowerCase())).length;
}

function getPriceBand(priceRub: number): "budget" | "mid" | "premium" | "luxury" {
  if (priceRub < 12000) {
    return "budget";
  }

  if (priceRub < 20000) {
    return "mid";
  }

  if (priceRub < 30000) {
    return "premium";
  }

  return "luxury";
}

function scoreColorOverlap(
  source: CatalogProductRecord,
  candidate: CatalogProductRecord,
): RecommendationMatchReason | null {
  const overlap = intersectCount(source.colors, candidate.colors);
  if (overlap === 0) {
    return null;
  }

  const ratio = Math.min(1, overlap / Math.max(source.colors.length, 1));
  return {
    code: "color",
    label: "Похожий цвет",
    weight: Math.round(SCORE_WEIGHTS.color * ratio),
  };
}

function scoreFlowerOverlap(
  source: CatalogProductRecord,
  candidate: CatalogProductRecord,
): RecommendationMatchReason | null {
  const overlap = intersectCount(source.flowerTypes, candidate.flowerTypes);
  if (overlap === 0) {
    return null;
  }

  const ratio = Math.min(1, overlap / Math.max(source.flowerTypes.length, 1));
  return {
    code: "flower",
    label: "Похожие цветы",
    weight: Math.round(SCORE_WEIGHTS.flower * ratio),
  };
}

function scoreCategoryOverlap(
  source: CatalogProductRecord,
  candidate: CatalogProductRecord,
): RecommendationMatchReason | null {
  const overlap = intersectCount(source.categoryIds, candidate.categoryIds);
  if (overlap === 0) {
    return null;
  }

  const ratio = Math.min(1, overlap / Math.max(source.categoryIds.length, 1));
  return {
    code: "category",
    label: "Похожая категория",
    weight: Math.round(SCORE_WEIGHTS.category * ratio),
  };
}

function scorePriceBand(
  source: CatalogProductRecord,
  candidate: CatalogProductRecord,
): RecommendationMatchReason | null {
  const sourceBand = getPriceBand(source.basePriceRub);
  const candidateBand = getPriceBand(candidate.basePriceRub);

  if (sourceBand !== candidateBand) {
    return null;
  }

  return {
    code: "price_band",
    label: "Похожая ценовая категория",
    weight: SCORE_WEIGHTS.priceBand,
  };
}

function scoreSeason(
  candidate: CatalogProductRecord,
  season: RecommendationSeason,
): RecommendationMatchReason | null {
  const seasons = candidate.seasons.map((value) => value.toLowerCase());
  if (
    seasons.includes(season) ||
    seasons.includes("all-season") ||
    candidate.seasonalScore >= 70
  ) {
    return {
      code: "season",
      label: "Подходит для сезона",
      weight: SCORE_WEIGHTS.season,
    };
  }

  return null;
}

function scoreOccasion(
  candidate: CatalogProductRecord,
  occasion: RecommendationOccasion | null,
): RecommendationMatchReason | null {
  if (!occasion) {
    return null;
  }

  const normalizedOccasions = candidate.occasions.map((value) =>
    value === "for_mom" ? "mother" : value,
  );

  if (!normalizedOccasions.includes(occasion)) {
    return null;
  }

  return {
    code: "occasion",
    label: "Подходит для повода",
    weight: SCORE_WEIGHTS.occasion,
  };
}

function scorePopularity(
  candidate: CatalogProductRecord,
): RecommendationMatchReason {
  const ratio = Math.min(1, candidate.popularityScore / 100);
  return {
    code: "popularity",
    label: "Популярный выбор",
    weight: Math.round(SCORE_WEIGHTS.popularity * ratio),
  };
}

function scoreAvailability(
  candidate: CatalogProductRecord,
): RecommendationMatchReason | null {
  if (!isProductVisibleInCatalog(candidate.availability, candidate.isPublished)) {
    return null;
  }

  const weight =
    candidate.availability === "in_stock"
      ? SCORE_WEIGHTS.availability
      : Math.round(SCORE_WEIGHTS.availability * 0.4);

  return {
    code: "availability",
    label:
      candidate.availability === "in_stock" ? "В наличии" : "Доступен к заказу",
    weight,
  };
}

export function scoreProductRecommendation(
  input: RecommendationScoreInput,
): RecommendationScoreResult {
  const { source, candidate, season, occasion, requireHigherPrice, requireLowerPrice } =
    input;

  if (candidate.id === source.id) {
    return { score: 0, reasons: [], reasonSummary: "" };
  }

  if (
    requireHigherPrice &&
    candidate.basePriceRub <= source.basePriceRub * 1.08
  ) {
    return { score: 0, reasons: [], reasonSummary: "" };
  }

  if (
    requireLowerPrice &&
    candidate.basePriceRub >= source.basePriceRub * 0.92
  ) {
    return { score: 0, reasons: [], reasonSummary: "" };
  }

  const reasons = [
    scoreColorOverlap(source, candidate),
    scoreFlowerOverlap(source, candidate),
    scoreCategoryOverlap(source, candidate),
    scorePriceBand(source, candidate),
    scoreSeason(candidate, season),
    scoreOccasion(candidate, occasion),
    scorePopularity(candidate),
    scoreAvailability(candidate),
  ].filter((reason): reason is RecommendationMatchReason => reason !== null);

  const score = reasons.reduce((total, reason) => total + reason.weight, 0);
  const reasonSummary = reasons
    .slice(0, 3)
    .map((reason) => reason.label)
    .join(" · ");

  return {
    score,
    reasons,
    reasonSummary,
  };
}

export function rankScoredProducts<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.score - left.score);
}

export function getCurrentSeason(now: Date = new Date()): RecommendationSeason {
  const month = now.getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return "spring";
  }

  if (month >= 6 && month <= 8) {
    return "summer";
  }

  if (month >= 9 && month <= 11) {
    return "autumn";
  }

  return "winter";
}

export function detectPrimaryOccasion(
  product: CatalogProductRecord,
): RecommendationOccasion | null {
  const normalized = product.occasions.map((value) =>
    value === "for_mom" ? "mother" : value,
  ) as RecommendationOccasion[];

  if (normalized.includes("wedding")) {
    return "wedding";
  }

  if (normalized.includes("birthday")) {
    return "birthday";
  }

  if (normalized.includes("romantic")) {
    return "romantic";
  }

  if (normalized.includes("mother")) {
    return "mother";
  }

  if (normalized.includes("vip")) {
    return "vip";
  }

  return normalized[0] ?? null;
}
