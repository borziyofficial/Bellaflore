// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Storefront bridge
// ==================================================
import { toLegacyCatalogProduct } from "@/components/catalogEngine/legacyCatalogAdapter";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { buildRecommendationIntelligenceSync } from "@/components/recommendationIntelligence/recommendationIntelligenceEngine";
import type {
  RecommendationContext,
  RecommendationIntelligenceResult,
  RecommendationSet,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";
import type { CatalogProductBase } from "@/components/product/productExperienceTypes";

export type RecommendationUiProduct = CatalogProductBase & {
  score: number;
  reasonSummary: string;
};

export type RecommendationUiSet = Omit<RecommendationSet, "products"> & {
  products: RecommendationUiProduct[];
};

export type RecommendationUiResult = Omit<
  RecommendationIntelligenceResult,
  "sets"
> & {
  sets: RecommendationUiSet[];
};

function toUiProduct(
  scored: { product: CatalogProductRecord; score: number; reasonSummary: string },
): RecommendationUiProduct {
  const legacy = toLegacyCatalogProduct(scored.product);

  return {
    id: legacy.id,
    src: legacy.src,
    alt: legacy.alt,
    title: legacy.title,
    description: legacy.description,
    priceRub: legacy.priceRub,
    width: legacy.width,
    height: legacy.height,
    category: legacy.category,
    stemCount: legacy.stemCount,
    score: scored.score,
    reasonSummary: scored.reasonSummary,
  };
}

export function buildProductPageRecommendations(
  productId: string,
  options?: Omit<RecommendationContext, "productId">,
): RecommendationUiResult {
  const result = buildRecommendationIntelligenceSync({
    productId,
    ...options,
  });

  return {
    ...result,
    sets: result.sets.map((set) => ({
      ...set,
      products: set.products.map(toUiProduct),
    })),
  };
}
