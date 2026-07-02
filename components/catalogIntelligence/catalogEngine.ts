// ==================================================
// SECTION: CATALOG INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import {
  getRelatedProducts,
  getSimilarBouquets,
  listAvailabilityRegistry,
  listCatalogProducts,
  listFeaturedCatalogProducts,
  listFeaturedEntries,
  listPopularProducts,
  listProductGroups,
  listSeasonalProducts,
  listSmartCollections,
  seedCatalogProductRegistry,
} from "@/components/catalogIntelligence/catalogProductRegistry";
import {
  buildCatalogFilters,
  listAiProductSuggestions,
  listSearchIndexEntries,
  searchCatalog,
  seedCatalogSearchRegistry,
} from "@/components/catalogIntelligence/catalogSearchRegistry";
import { buildCatalogExampleRegistryState } from "@/components/catalogIntelligence/catalogExamples";
import { listSmartCategories, seedCatalogCategoryRegistry } from "@/components/catalogIntelligence/catalogCategoryRegistry";
import type {
  CatalogIntelligenceSnapshot,
  CatalogReadOnlySummary,
  CatalogRelatedProductsResult,
  CatalogStatistics,
} from "@/components/catalogIntelligence/catalogTypes";

export const CATALOG_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_catalog_intelligence_v1";

export function calculateCatalogStatistics(): CatalogStatistics {
  const products = listCatalogProducts();
  const published = products.length;
  const featured = products.filter((product) => product.isFeatured).length;
  const seasonal = products.filter((product) => product.isSeasonal).length;
  const outOfStock = products.filter(
    (product) => product.availability === "out_of_stock",
  ).length;

  const averagePriceRub =
    published > 0
      ? Math.round(
          products.reduce((sum, product) => sum + product.basePriceRub, 0) / published,
        )
      : 0;

  const categoryCounts = new Map<string, number>();
  const flowerCounts = new Map<string, number>();

  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }

    for (const flower of product.flowerTypes) {
      flowerCounts.set(flower, (flowerCounts.get(flower) ?? 0) + 1);
    }
  }

  const topCategoryId =
    [...categoryCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null;

  const topFlowerType =
    [...flowerCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    null;

  return {
    totalProducts: products.length,
    publishedProducts: published,
    featuredProducts: featured,
    seasonalProducts: seasonal,
    outOfStockProducts: outOfStock,
    averagePriceRub,
    topCategoryId,
    topFlowerType,
    searchIndexSize: listSearchIndexEntries().length,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildCatalogIntelligenceSnapshot(
  at: Date = new Date(),
): CatalogIntelligenceSnapshot {
  return {
    categories: listSmartCategories(),
    collections: listSmartCollections(),
    productGroups: listProductGroups(),
    products: listCatalogProducts(),
    featured: listFeaturedEntries(),
    availability: listAvailabilityRegistry(),
    searchIndex: listSearchIndexEntries(),
    filters: buildCatalogFilters(),
    aiSuggestions: listAiProductSuggestions(),
    statistics: calculateCatalogStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeCatalogIntelligence(): CatalogIntelligenceSnapshot {
  seedCatalogCategoryRegistry();
  seedCatalogProductRegistry();
  seedCatalogSearchRegistry();
  return buildCatalogIntelligenceSnapshot();
}

export function getCatalogIntelligenceExample() {
  return buildCatalogExampleRegistryState().products[0];
}

export function getCatalogReadOnlySummary(): CatalogReadOnlySummary {
  const products = listCatalogProducts();

  return {
    productCount: products.length,
    categoryCount: listSmartCategories().length,
    collectionCount: listSmartCollections().length,
    featuredCount: listFeaturedCatalogProducts().length,
    seasonalCount: listSeasonalProducts().length,
    inStockCount: products.filter((product) => product.availability === "in_stock")
      .length,
  };
}

export function readRelatedAndSimilarProducts(
  productId: string,
): CatalogRelatedProductsResult {
  return {
    productId,
    related: getRelatedProducts(productId),
    similar: getSimilarBouquets(productId),
  };
}

export function listAllCatalogFoundationCapabilities() {
  return {
    smartCategories: listSmartCategories(),
    smartCollections: listSmartCollections(),
    productGroups: listProductGroups(),
    seasonalProducts: listSeasonalProducts(),
    aiProductSuggestions: listAiProductSuggestions(),
    popularProducts: listPopularProducts(),
    relatedProductsEngine: "getRelatedProducts",
    similarBouquetsEngine: "getSimilarBouquets",
    catalogStatistics: calculateCatalogStatistics(),
    searchIndex: listSearchIndexEntries(),
    catalogFilters: buildCatalogFilters(),
    availabilityRegistry: listAvailabilityRegistry(),
    featuredCatalog: listFeaturedCatalogProducts(),
    search: searchCatalog,
  };
}

export const CATALOG_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "catalogIntelligence",
  storageKeys: [
    CATALOG_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_catalog_intelligence_categories_v1",
    "bellaflore_catalog_intelligence_smart_categories_v1",
    "bellaflore_catalog_intelligence_products_v1",
    "bellaflore_catalog_intelligence_collections_v1",
    "bellaflore_catalog_intelligence_groups_v1",
    "bellaflore_catalog_intelligence_featured_v1",
    "bellaflore_catalog_intelligence_availability_v1",
    "bellaflore_catalog_intelligence_search_index_v1",
    "bellaflore_catalog_intelligence_ai_suggestions_v1",
  ],
  capabilities: [
    "smart_categories",
    "smart_collections",
    "product_groups",
    "seasonal_products",
    "ai_product_suggestions",
    "popular_products",
    "related_products",
    "similar_bouquets",
    "catalog_statistics",
    "search_index",
    "catalog_filters",
    "availability_registry",
    "featured_catalog",
  ],
  layers: [
    { id: "types", file: "catalogTypes.ts" },
    { id: "examples", file: "catalogExamples.ts" },
    {
      id: "registries",
      files: [
        "catalogCategoryRegistry.ts",
        "catalogProductRegistry.ts",
        "catalogSearchRegistry.ts",
      ],
    },
    { id: "engine", file: "catalogEngine.ts" },
    { id: "foundation", file: "catalogIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;
