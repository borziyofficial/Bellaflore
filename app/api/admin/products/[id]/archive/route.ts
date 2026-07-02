import { storedProductToCatalogRecord } from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  archiveCatalogProduct,
} from "@/lib/catalogDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const saved = await archiveCatalogProduct(decodeURIComponent(id));
    if (!saved) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json({
      product: storedProductToCatalogRecord(saved),
    });
  } catch (error) {
    if (error instanceof CatalogDatabaseNotConfiguredError) {
      return Response.json({ message: error.message }, { status: 503 });
    }

    return Response.json({ message: "Не удалось архивировать товар." }, { status: 500 });
  }
}
