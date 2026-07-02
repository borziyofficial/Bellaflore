// ==================================================
// SECTION: Public Catalog Merge
// РАЗДЕЛ: Безопасное объединение seed + admin витрины
//
// TODO: replace local persistence with production database.
// ==================================================
import { toLegacyCatalogProduct } from "@/components/catalogEngine/legacyCatalogAdapter";
import {
  getAllCatalogProducts,
  refreshCatalogEngineSnapshot,
} from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProduct } from "@/data/catalogProducts";
import { catalogProducts as SEED_CATALOG } from "@/data/catalogProducts";

export const PUBLIC_CATALOG_PLACEHOLDER_IMAGE = "/roza rouze royal.PNG";

export function isAdminPublishedStorefrontProduct(product: {
  id: string;
  isPublished: boolean;
  status: string;
  metadata: { adminCreated?: boolean };
}): boolean {
  if (!product.isPublished || product.status === "ARCHIVED") {
    return false;
  }

  return (
    product.metadata.adminCreated === true ||
    product.id.startsWith("admin-product-")
  );
}

/**
 * publicProducts = seedCatalogProducts + publishedAdminProducts
 * Seed entries are never replaced or removed.
 */
export function mergePublicStorefrontCatalog(): CatalogProduct[] {
  if (typeof window !== "undefined") {
    refreshCatalogEngineSnapshot();
  }

  const seedIds = new Set(SEED_CATALOG.map((product) => product.id));

  const publishedAdminProducts = getAllCatalogProducts()
    .filter(isAdminPublishedStorefrontProduct)
    .map(toLegacyCatalogProduct)
    .filter((product) => !seedIds.has(product.id));

  return [...SEED_CATALOG, ...publishedAdminProducts];
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
  if (typeof window === "undefined") {
    return `https://www.bellaflore.ru/?product=${encodeURIComponent(product.id)}`;
  }

  const url = new URL(window.location.origin);
  url.searchParams.set("product", product.id);
  url.hash = "collections";
  return url.toString();
}
