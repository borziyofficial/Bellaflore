import { listMergedCategories } from "@/lib/adminCategoriesDb";

export const runtime = "nodejs";

// Public storefront category list — active categories only, no auth.
export async function GET() {
  try {
    const categories = (await listMergedCategories()).filter((category) => category.isActive);
    return Response.json(
      { categories },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return Response.json({ categories: [] }, { status: 200 });
  }
}
