import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";
import {
  listAdminReviews,
  ReviewStorageNotConfiguredError,
  setReviewStatus,
} from "@/lib/reviews/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown): Response {
  if (error instanceof ReviewStorageNotConfiguredError) {
    return Response.json({ message: error.message }, { status: 503 });
  }

  console.error("[admin-reviews-api]", error);
  return Response.json(
    { message: "Не удалось обработать отзывы." },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const reviews = await listAdminReviews();
    return Response.json({ reviews });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let body: { id?: unknown; action?: unknown };

  try {
    body = (await request.json()) as { id?: unknown; action?: unknown };
  } catch {
    return Response.json({ message: "Некорректный JSON." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action =
    body.action === "approve" || body.action === "reject" ? body.action : null;

  if (!id || !action) {
    return Response.json(
      { message: "Укажите отзыв и действие модерации." },
      { status: 400 },
    );
  }

  try {
    const review = await setReviewStatus(
      id,
      action === "approve" ? "approved" : "rejected",
    );

    if (!review) {
      return Response.json({ message: "Отзыв не найден." }, { status: 404 });
    }

    return Response.json({ review });
  } catch (error) {
    return errorResponse(error);
  }
}
