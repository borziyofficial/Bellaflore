// ==================================================
// SECTION: Public Catalog Merge
// РАЗДЕЛ: Безопасное объединение seed + database витрины
// ==================================================
import type { CatalogProduct } from "@/data/catalogProducts";
import { catalogProducts as SEED_CATALOG } from "@/data/catalogProducts";

export const PUBLIC_CATALOG_PLACEHOLDER_IMAGE = "/roza rouze royal.PNG";

function getSeedFallbackCatalog(): CatalogProduct[] {
  return process.env.NODE_ENV === "production" ? [] : SEED_CATALOG;
}

export function isPublicStorefrontProductOrderable(product: CatalogProduct): boolean {
  return (
    product.sizes?.some(
      (size) =>
        Number.isSafeInteger(size.price) &&
        size.price > 0 &&
        typeof size.label === "string" &&
        size.label.length > 0,
    ) ?? false
  );
}

/**
 * publicProducts = publishedDatabaseProducts.
 * Seed entries are only a development fallback when the persisted catalog is unavailable.
 */
export function mergePublicStorefrontCatalog(
  publishedDatabaseProducts: CatalogProduct[] = [],
): CatalogProduct[] {
  const orderableProducts = publishedDatabaseProducts.filter(
    isPublicStorefrontProductOrderable,
  );

  if (orderableProducts.length > 0) {
    return orderableProducts;
  }

  return getSeedFallbackCatalog();
}

export function findPublicStorefrontProduct(
  productId: string,
  catalog: CatalogProduct[] = mergePublicStorefrontCatalog(),
): CatalogProduct | null {
  const normalized = productId.trim();
  if (!normalized) {
    return null;
  }

  return (
    catalog.find((product) => product.id === normalized) ??
    catalog.find(
      (product) =>
        product.slug === normalized ||
        product.slug === normalized.replace(/^\/+/, ""),
    ) ??
    null
  );
}

export function getPublicStorefrontProductUrl(product: CatalogProduct): string {
  const slug = product.slug?.trim();
  if (slug) {
    return `https://www.bellaflore.ru/catalog/${encodeURIComponent(slug)}`;
  }

  if (typeof window === "undefined") {
    return `https://www.bellaflore.ru/?product=${encodeURIComponent(product.id)}`;
  }

  const url = new URL(window.location.origin);
  url.searchParams.set("product", product.id);
  url.hash = "catalog";
  return url.toString();
}
