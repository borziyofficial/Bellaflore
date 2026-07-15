import {
  CategoryInUseError,
  CategoryValidationError,
  deleteCustomCategory,
  renameCustomCategory,
} from "@/lib/adminCategoriesDb";
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

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { title?: unknown };
    if (typeof body.title !== "string") {
      return Response.json({ message: "Укажите название категории." }, { status: 400 });
    }

    const category = await renameCustomCategory(decodeURIComponent(id), body.title);
    if (!category) {
      return Response.json({ message: "Категория не найдена." }, { status: 404 });
    }

    return Response.json({ category });
  } catch (error) {
    if (error instanceof CategoryValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: "Не удалось изменить категорию." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const reassignTo = url.searchParams.get("reassignTo") || undefined;

    const result = await deleteCustomCategory(decodeURIComponent(id), { reassignTo });
    if (!result.deleted) {
      return Response.json({ message: "Категория не найдена." }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return Response.json(
        { message: error.message, count: error.count, code: "CATEGORY_IN_USE" },
        { status: 409 },
      );
    }
    if (error instanceof CategoryValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: "Не удалось удалить категорию." }, { status: 500 });
  }
}
