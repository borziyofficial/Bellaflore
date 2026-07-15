import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  listCatalogProducts,
  listPublishedCatalogProducts,
} from "@/lib/catalogDb";
import {
  readCategoryStorage,
  listBouquets,
} from "@/lib/bouquetDb";
import { storedBouquetsToLegacyCatalogProducts } from "@/lib/bouquetDb/publicCatalogMapper";
import {
  storedProductToCatalogRecord,
  storedProductToLegacyCatalogProduct,
} from "@/lib/catalogDb/mappers";
import { resolvePublishedCatalogProduct } from "@/lib/catalogDb/resolvePublishedCatalogProduct";
import { buildCategoryTitleMap } from "@/lib/adminCategoriesDb";

export const runtime = "nodejs";

function catalogUnavailableResponse(error: unknown): Response {
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

    const [products, customCategoryTitleById] = await Promise.all([
      publishedOnly ? listPublishedCatalogProducts() : listCatalogProducts(),
      buildCategoryTitleMap(),
    ]);
    const bouquetProducts = publishedOnly ? await listPublishedBouquetCatalogProducts() : [];

    return Response.json({
      products: [
        ...products.map((product) =>
          storedProductToLegacyCatalogProduct(product, customCategoryTitleById),
        ),
        ...bouquetProducts,
      ],
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
  return resolvePublishedCatalogProduct(slug);
}
