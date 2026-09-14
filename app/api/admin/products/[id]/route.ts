import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  adminFormToStoredProduct,
  storedProductToCatalogRecord,
} from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  getCatalogProductById,
  deleteCatalogProduct,
  saveCatalogDraft,
  upsertCatalogProduct,
} from "@/lib/catalogDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import { logCatalogServerError } from "@/lib/catalogDb/logging";

export const runtime = "nodejs";
// Reflects live writes and is re-fetched right after mutations to refresh
// the admin UI — must never be statically cached or served stale.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function catalogUnavailableResponse(
  error: unknown,
  operation: string,
  productId?: string,
): Response {
  logCatalogServerError(operation, error, { productId });
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

  return Response.json({ message: "Не удалось сохранить товар." }, { status: 500 });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let productId: string | undefined;
  try {
    const { id } = await context.params;
    productId = decodeURIComponent(id);
    const product = await getCatalogProductById(productId);
    if (!product) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json(
      {
        product: storedProductToCatalogRecord(product),
        mode: getCatalogDatabaseMode(),
      },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch (error) {
    return catalogUnavailableResponse(error, "fetch_admin_catalog_product", productId);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let productId: string | undefined;
  try {
    const { id } = await context.params;
    productId = decodeURIComponent(id);
    const body = (await request.json()) as { form?: AdminProductFormState };
    if (!body.form) {
      return Response.json({ message: "Некорректные данные товара." }, { status: 400 });
    }

    const existing = await getCatalogProductById(productId);
    const stored = adminFormToStoredProduct(
      { ...body.form, id: productId },
      existing,
    );
    const saved =
      body.form.status === "published"
        ? await upsertCatalogProduct({ ...stored, status: "published" })
        : await saveCatalogDraft(stored);

    return Response.json({
      product: storedProductToCatalogRecord(saved),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error, "update_admin_catalog_product", productId);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let productId: string | undefined;
  try {
    const { id } = await context.params;
    productId = decodeURIComponent(id);
    const deleted = await deleteCatalogProduct(productId);
    if (!deleted) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json({
      product: storedProductToCatalogRecord(deleted),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error, "delete_admin_catalog_product", productId);
  }
}
