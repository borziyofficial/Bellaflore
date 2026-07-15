import {
  CategoryValidationError,
  createCustomCategory,
  listMergedCategories,
} from "@/lib/adminCategoriesDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const categories = await listMergedCategories();
    return Response.json(
      { categories },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить категории." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { title?: unknown };
    if (typeof body.title !== "string") {
      return Response.json({ message: "Укажите название категории." }, { status: 400 });
    }

    const category = await createCustomCategory(body.title);
    return Response.json({ category });
  } catch (error) {
    if (error instanceof CategoryValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: "Не удалось создать категорию." }, { status: 500 });
  }
}
