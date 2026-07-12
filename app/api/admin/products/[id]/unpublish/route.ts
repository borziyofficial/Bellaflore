import { storedProductToCatalogRecord } from "@/lib/catalogDb/mappers";
import {
  CatalogDatabaseNotConfiguredError,
  getCatalogDatabaseMode,
  unpublishCatalogProduct,
} from "@/lib/catalogDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const saved = await unpublishCatalogProduct(decodeURIComponent(id));
    if (!saved) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json({
      product: storedProductToCatalogRecord(saved),
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    if (error instanceof CatalogDatabaseNotConfiguredError) {
      return Response.json({ message: error.message }, { status: 503 });
    }

    return Response.json({ message: "Не удалось снять товар с публикации." }, { status: 500 });
  }
}
