import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  getCatalogProductBySlug,
  listCatalogProducts,
  listPublishedCatalogProducts,
} from "@/lib/catalogDb";
import {
  storedProductToCatalogRecord,
  storedProductToLegacyCatalogProduct,
} from "@/lib/catalogDb/mappers";

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

    const products = publishedOnly
      ? await listPublishedCatalogProducts()
      : await listCatalogProducts();

    return Response.json({
      products: products.map(storedProductToLegacyCatalogProduct),
      records: products.map(storedProductToCatalogRecord),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error);
  }
}

export async function resolvePublicCatalogProductBySlug(slug: string) {
  const product = await getCatalogProductBySlug(slug);
  if (!product || product.status !== "published") {
    return null;
  }

  return {
    product: storedProductToLegacyCatalogProduct(product),
    record: storedProductToCatalogRecord(product),
  };
}
