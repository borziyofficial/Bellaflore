// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Legacy Catalog Adapter
//
// Purpose (EN): Backward-compatible views for existing storefront catalog UI.
//
// Назначение (RU): Совместимость с текущим UI каталога без изменения контрактов.
// ==================================================
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { SearchableBouquet } from "@/components/search/searchFoundation";
import type { CatalogProduct } from "@/data/catalogProducts";

export function toLegacySearchableBouquet(
  product: CatalogProductRecord,
): SearchableBouquet {
  return {
    id: product.id,
    title: product.title,
    description: product.shortDescription,
    category: product.metadata.legacyCategory,
    flowerType: product.flowerTypes[0],
    stemCount: product.metadata.stemCount,
    tags: product.tags,
    searchTerms: product.searchTerms,
  };
}

export function toLegacyCatalogProduct(
  product: CatalogProductRecord,
): CatalogProduct {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];

  return {
    ...toLegacySearchableBouquet(product),
    src: primaryImage?.url ?? "",
    alt: primaryImage?.alt ?? product.title,
    priceRub: product.basePriceRub,
    width: primaryImage?.width ?? 1080,
    height: primaryImage?.height ?? 1350,
  };
}

/** Legacy-compatible product list for existing storefront imports. */
export function getLegacyCatalogProducts(): CatalogProduct[] {
  return getPublishedCatalogProducts().map(toLegacyCatalogProduct);
}

export function getLegacyCatalogProductById(
  productId: string,
): CatalogProduct | null {
  const products = getLegacyCatalogProducts();
  return products.find((product) => product.id === productId) ?? null;
}
