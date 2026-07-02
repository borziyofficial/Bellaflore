import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  adminFormToStoredProduct,
  storedProductToCatalogRecord,
} from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  listCatalogProducts,
  saveCatalogDraft,
  upsertCatalogProduct,
} from "@/lib/catalogDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import { getImageStorageWarning } from "@/lib/catalogStorage/config";

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

  return Response.json({ message: "Не удалось сохранить товар." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const products = await listCatalogProducts();
    return Response.json({
      products: products.map(storedProductToCatalogRecord),
      mode: getCatalogDatabaseMode(),
      imageStorageWarning: getImageStorageWarning(),
    });
  } catch (error) {
    return catalogUnavailableResponse(error);
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
    return catalogUnavailableResponse(error);
  }
}
