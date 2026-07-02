import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  adminFormToStoredProduct,
  storedProductToCatalogRecord,
} from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  getCatalogProductById,
  saveCatalogDraft,
  upsertCatalogProduct,
} from "@/lib/catalogDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  return Response.json({ message: "Не удалось сохранить товар." }, { status: 500 });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const product = await getCatalogProductById(decodeURIComponent(id));
    if (!product) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json({
      product: storedProductToCatalogRecord(product),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { form?: AdminProductFormState };
    if (!body.form) {
      return Response.json({ message: "Некорректные данные товара." }, { status: 400 });
    }

    const existing = await getCatalogProductById(decodeURIComponent(id));
    const stored = adminFormToStoredProduct(
      { ...body.form, id: decodeURIComponent(id) },
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
    return catalogUnavailableResponse(error);
  }
}
