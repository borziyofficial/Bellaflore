// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Catalog bridge (read-only)
// ==================================================
import {
  getAllCatalogProducts,
  getPublishedCatalogProducts,
} from "@/components/catalogEngine/productCatalogEngine";
import { isProductPurchasable } from "@/components/catalogEngine/availabilityEngine";

export type AiCatalogBridgeSnapshot = {
  totalProducts: number;
  publishedProducts: number;
  unavailableProductIds: string[];
  purchasableProductIds: string[];
  topPublishedProductIds: string[];
  generatedAt: string;
};

export function readAiCatalogSnapshot(): AiCatalogBridgeSnapshot {
  const allProducts = getAllCatalogProducts();
  const publishedProducts = getPublishedCatalogProducts();

  const unavailableProductIds = publishedProducts
    .filter((product) => !isProductPurchasable(product.availability))
    .map((product) => product.id);

  const purchasableProductIds = publishedProducts
    .filter((product) => isProductPurchasable(product.availability))
    .map((product) => product.id);

  return {
    totalProducts: allProducts.length,
    publishedProducts: publishedProducts.length,
    unavailableProductIds,
    purchasableProductIds,
    topPublishedProductIds: publishedProducts.slice(0, 5).map((product) => product.id),
    generatedAt: new Date().toISOString(),
  };
}
