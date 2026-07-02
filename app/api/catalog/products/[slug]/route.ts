import { resolvePublicCatalogProductBySlug } from "@/app/api/catalog/products/route";
import { CatalogDatabaseNotConfiguredError, getCatalogDatabaseMode } from "@/lib/catalogDb";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const resolved = await resolvePublicCatalogProductBySlug(decodeURIComponent(slug));

    if (!resolved) {
      return Response.json({ message: "Товар не найден." }, { status: 404 });
    }

    return Response.json({
      ...resolved,
      mode: getCatalogDatabaseMode(),
    });
  } catch (error) {
    if (error instanceof CatalogDatabaseNotConfiguredError) {
      return Response.json(
        { message: error.message, configured: false },
        { status: 503 },
      );
    }

    return Response.json({ message: "Не удалось загрузить товар." }, { status: 500 });
  }
}
