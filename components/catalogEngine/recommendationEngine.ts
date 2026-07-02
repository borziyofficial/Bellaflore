// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Recommendation Engine
//
// Purpose (EN): Similar, premium, budget, and bundle recommendations per product.
// Delegates scoring to Recommendation Intelligence (Stage 17).
//
// Назначение (RU): Рекомендации через Recommendation Intelligence.
// ==================================================
import type {
  CatalogProductRecord,
  CatalogRecommendationKind,
  CatalogRecommendationResult,
} from "@/components/catalogEngine/catalogTypes";
import { getCatalogAiHooks } from "@/components/catalogEngine/aiCatalogFoundation";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import { buildRecommendationIntelligenceSync } from "@/components/recommendationIntelligence/recommendationIntelligenceEngine";

function mapRecommendationProducts(
  allProducts: CatalogProductRecord[],
  productIds: string[],
): CatalogProductRecord[] {
  const productMap = new Map(allProducts.map((product) => [product.id, product]));

  return productIds
    .map((productId) => productMap.get(productId))
    .filter((product): product is CatalogProductRecord =>
      Boolean(product && isProductVisibleInCatalog(product.availability, product.isPublished)),
    );
}

function mapKindToIntelligenceKind(
  kind: CatalogRecommendationKind,
): "similar" | "premium" | "budget" | "bought_together" {
  return kind;
}

export async function resolveCatalogRecommendations(
  allProducts: CatalogProductRecord[],
  productId: string,
  kind: CatalogRecommendationKind,
  limit = 8,
): Promise<CatalogRecommendationResult> {
  const hooks = getCatalogAiHooks();
  const intelligence = buildRecommendationIntelligenceSync(
    { productId, limitPerSet: limit },
    allProducts,
  );

  const targetKind = mapKindToIntelligenceKind(kind);
  const targetSet = intelligence.sets.find((set) => set.kind === targetKind);
  let products = targetSet?.products.map((item) => item.product) ?? [];

  if (hooks.recommendations) {
    const aiIds = await hooks.recommendations(productId, kind);
    if (aiIds.length > 0) {
      products = mapRecommendationProducts(allProducts, aiIds).slice(0, limit);
    }
  }

  return {
    kind,
    productIds: products.map((product) => product.id),
    products: products.slice(0, limit),
  };
}

export function resolveAllCatalogRecommendationSets(
  allProducts: CatalogProductRecord[],
  productId: string,
): Record<CatalogRecommendationKind, CatalogRecommendationResult> {
  const intelligence = buildRecommendationIntelligenceSync(
    { productId },
    allProducts,
  );

  const kinds: CatalogRecommendationKind[] = [
    "similar",
    "premium",
    "budget",
    "bought_together",
  ];

  return kinds.reduce(
    (accumulator, kind) => {
      const targetSet = intelligence.sets.find((set) => set.kind === kind);
      const products = targetSet?.products.map((item) => item.product) ?? [];

      accumulator[kind] = {
        kind,
        productIds: products.map((product) => product.id),
        products,
      };

      return accumulator;
    },
    {} as Record<CatalogRecommendationKind, CatalogRecommendationResult>,
  );
}
