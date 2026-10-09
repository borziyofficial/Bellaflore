import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import { toAdminProductCard } from "@/components/adminCatalogManager/adminProductCard";
import {
  adminFormToStoredProduct,
  storedProductToCatalogRecord,
} from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  listAdminCatalogCards,
  listCatalogProducts,
  saveCatalogDraft,
  upsertCatalogProduct,
} from "@/lib/catalogDb";
import { buildCategoryTitleMap } from "@/lib/adminCategoriesDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import { getImageStorageWarning } from "@/lib/catalogStorage/config";
import { logCatalogServerError } from "@/lib/catalogDb/logging";
import {
  CatalogArticleFormatError,
  CatalogArticleTakenError,
} from "@/lib/catalog/catalogArticle";

export const runtime = "nodejs";
// This route reflects live writes made through publish/unpublish/save/delete
// and is polled right after those mutations to refresh the admin UI — it
// must never be statically cached or served stale.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function catalogUnavailableResponse(error: unknown, operation: string): Response {
  logCatalogServerError(operation, error);
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

  if (error instanceof CatalogArticleFormatError) {
    return Response.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof CatalogArticleTakenError) {
    return Response.json({ message: error.message }, { status: 409 });
  }

  return Response.json({ message: "Не удалось сохранить товар." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const cardView = new URL(request.url).searchParams.get("view") === "card";
    const [products, customCategoryTitleById] = await Promise.all([
      cardView ? listAdminCatalogCards() : listCatalogProducts(),
      buildCategoryTitleMap(),
    ]);
    return Response.json(
      {
        products: products.map((product) => {
          const record = storedProductToCatalogRecord(product, customCategoryTitleById);
          return cardView ? toAdminProductCard(record) : record;
        }),
        mode: getCatalogDatabaseMode(),
        imageStorageWarning: getImageStorageWarning(),
      },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch (error) {
    return catalogUnavailableResponse(error, "fetch_admin_catalog");
  }
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { form?: AdminProductFormState };
    if (!body.form) {
      return Response.json({ message: "Некорректные данные товара." }, { status: 400 });
    }

    const stored = adminFormToStoredProduct(body.form);
    const saved =
      body.form.status === "published"
        ? await upsertCatalogProduct({ ...stored, status: "published" })
        : await saveCatalogDraft(stored);

    return Response.json({
      product: storedProductToCatalogRecord(saved),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error, "create_admin_catalog_product");
  }
}
