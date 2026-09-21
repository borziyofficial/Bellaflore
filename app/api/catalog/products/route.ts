import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  listCatalogProducts,
} from "@/lib/catalogDb";
import {
  readCategoryStorage,
  listBouquets,
} from "@/lib/bouquetDb";
import { storedBouquetsToLegacyCatalogProducts } from "@/lib/bouquetDb/publicCatalogMapper";
import { isPublicStorefrontProductOrderable } from "@/components/catalog/publicCatalogMerge";
import {
  storedProductToCatalogRecord,
  storedProductToLegacyCatalogProduct,
} from "@/lib/catalogDb/mappers";
import { resolvePublishedCatalogProduct } from "@/lib/catalogDb/resolvePublishedCatalogProduct";
import { buildCategoryTitleMap } from "@/lib/adminCategoriesDb";
import { logCatalogServerError } from "@/lib/catalogDb/logging";
import { loadPublishedStorefrontCatalog } from "@/lib/catalogDb/publicStorefront";

export const runtime = "nodejs";

function catalogUnavailableResponse(error: unknown): Response {
  logCatalogServerError("fetch_public_catalog", error);
  if (error instanceof CatalogDatabaseNotConfiguredError) {
    return Response.json(
      {
        message: error.message,
        configured: false,
        mode: getCatalogDatabaseMode(),
      },
      { status: 503 },
    );
  }

  return Response.json({ message: "Не удалось загрузить каталог." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publishedOnly = url.searchParams.get("published") === "1";

    if (publishedOnly) {
      // Use shared server-only helper for published storefront
      const catalogResult = await loadPublishedStorefrontCatalog();

      if (catalogResult.status === "unconfigured") {
        return Response.json(
          {
            message: catalogResult.error || "Catalog database is not configured.",
            configured: false,
            mode: getCatalogDatabaseMode(),
          },
          { status: 503 },
        );
      }

      if (catalogResult.status === "error") {
        return Response.json(
          { message: "Не удалось загрузить каталог." },
          { status: 500 },
        );
      }

      return Response.json({
        products: catalogResult.products,
        mode: getCatalogDatabaseMode(),
      });
    }

    // Non-published products (admin view)
    const [products, customCategoryTitleById] = await Promise.all([
      listCatalogProducts(),
      buildCategoryTitleMap(),
    ]);
    const bouquetProducts = await listPublishedBouquetCatalogProducts();

    const storefrontProducts = [
      ...products.map((product) =>
        storedProductToLegacyCatalogProduct(product, customCategoryTitleById),
      ),
      ...bouquetProducts,
    ];

    return Response.json({
      products: storefrontProducts,
      records: products.map((product) =>
        storedProductToCatalogRecord(product, customCategoryTitleById),
      ),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error);
  }
}

async function listPublishedBouquetCatalogProducts() {
  try {
    const [bouquets, categoryStorage] = await Promise.all([
      listBouquets(),
      readCategoryStorage(),
    ]);
    return storedBouquetsToLegacyCatalogProducts(bouquets, categoryStorage);
  } catch {
    return [];
  }
}

export async function resolvePublicCatalogProductBySlug(slug: string) {
  const resolved = await resolvePublishedCatalogProduct(slug);
  if (!resolved || !isPublicStorefrontProductOrderable(resolved.product)) {
    return null;
  }

  return resolved;
}
