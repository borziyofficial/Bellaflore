// ==================================================
// SECTION: Public Storefront Catalog — Server-Only Helper
// РАЗДЕЛ: Серверный helper для публичного каталога
//
// Purpose (EN): Server-side data source for public storefront catalog.
// Direct database access for SSR and API — no client-side fetch, no seed fallback in production.
//
// Назначение (RU): Серверный источник данных для публичного каталога.
// Прямой доступ к БД для SSR и API — без клиентского fetch, без seed-данных в production.
// ==================================================

import {
  listPublishedCatalogProducts,
  CatalogDatabaseNotConfiguredError,
} from "@/lib/catalogDb/index";
import {
  readCategoryStorage,
  listBouquets,
} from "@/lib/bouquetDb";
import { storedBouquetsToLegacyCatalogProducts } from "@/lib/bouquetDb/publicCatalogMapper";
import { isPublicStorefrontProductOrderable } from "@/components/catalog/publicCatalogMerge";
import { storedProductToLegacyCatalogProduct } from "@/lib/catalogDb/mappers";
import { buildCategoryTitleMap } from "@/lib/adminCategoriesDb";
import { logCatalogServerError } from "@/lib/catalogDb/logging";
import type { CatalogProduct } from "@/data/catalogProducts";

export type PublishStorefrontStatus = "success" | "error" | "unconfigured";

export type PublishedStorefrontResult = {
  status: PublishStorefrontStatus;
  products: CatalogProduct[];
  error?: string;
};

/**
 * Load published storefront products directly from server data layer.
 *
 * Server-only helper for SSR and API routes.
 * Direct database access — no client-side fetch, no self-referential API calls.
 *
 * Returns:
 * - status: "success" if products loaded
 * - status: "error" if database error
 * - status: "unconfigured" if catalog not configured
 * - products: array of orderable published products
 * - error: error message if applicable
 */
export async function loadPublishedStorefrontCatalog(): Promise<PublishedStorefrontResult> {
  try {
    const [products, customCategoryTitleById] = await Promise.all([
      listPublishedCatalogProducts(),
      buildCategoryTitleMap(),
    ]);

    const bouquetProducts = await loadPublishedBouquetProducts();

    const storefrontProducts = [
      ...products.map((product) =>
        storedProductToLegacyCatalogProduct(product, customCategoryTitleById),
      ),
      ...bouquetProducts,
    ];

    const orderableProducts = storefrontProducts.filter(
      isPublicStorefrontProductOrderable,
    );

    return {
      status: "success",
      products: orderableProducts,
    };
  } catch (error) {
    logCatalogServerError("load_published_storefront", error);

    if (error instanceof CatalogDatabaseNotConfiguredError) {
      return {
        status: "unconfigured",
        products: [],
        error: error.message,
      };
    }

    return {
      status: "error",
      products: [],
      error:
        error instanceof Error ? error.message : "Не удалось загрузить каталог.",
    };
  }
}

/**
 * Load published bouquet catalog products.
 * Fails gracefully if bouquets are unavailable.
 */
async function loadPublishedBouquetProducts(): Promise<CatalogProduct[]> {
  try {
    const [bouquets, categoryStorage] = await Promise.all([
      listBouquets(),
      readCategoryStorage(),
    ]);
    return storedBouquetsToLegacyCatalogProducts(bouquets, categoryStorage);
  } catch (error) {
    logCatalogServerError("load_published_bouquets", error);
    return [];
  }
}
