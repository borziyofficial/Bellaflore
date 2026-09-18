import {
  createReview,
  listApprovedReviews,
  ReviewStorageNotConfiguredError,
  type ReviewRecord,
} from "@/lib/reviews/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRequestBody = {
  name?: unknown;
  rating?: unknown;
  text?: unknown;
  productId?: unknown;
};

function publicReview(review: ReviewRecord) {
  return {
    id: review.id,
    name: review.name,
    rating: review.rating,
    text: review.text,
    createdAtDisplay: new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Moscow",
    }).format(new Date(review.createdAt)),
  };
}

function errorResponse(error: unknown): Response {
  if (error instanceof ReviewStorageNotConfiguredError) {
    return Response.json({ message: error.message }, { status: 503 });
  }

  console.error("[reviews-api]", error);
  return Response.json(
    { message: "Не удалось обработать отзывы. Попробуйте позже." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const reviews = await listApprovedReviews();
    return Response.json({ reviews: reviews.map(publicReview) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: ReviewRequestBody;

  try {
    body = (await request.json()) as ReviewRequestBody;
  } catch {
    return Response.json({ message: "Некорректный JSON." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const rating =
    typeof body.rating === "number" && Number.isInteger(body.rating)
      ? body.rating
      : NaN;
  const productId =
    typeof body.productId === "string" && body.productId.trim()
      ? body.productId.trim()
      : null;

  if (name.length < 2 || name.length > 80) {
    return Response.json(
      { message: "Имя должно содержать от 2 до 80 символов." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { message: "Оценка должна быть от 1 до 5." },
      { status: 400 },
    );
  }

  if (text.length < 5 || text.length > 1200) {
    return Response.json(
      { message: "Текст отзыва должен содержать от 5 до 1200 символов." },
      { status: 400 },
    );
  }

  try {
    const review = await createReview({ name, rating, text, productId });
    const published = review.status === "approved";

    return Response.json(
      {
        review: publicReview(review),
        published,
        status: review.status,
        message: published
          ? "Спасибо! Отзыв опубликован."
          : "Спасибо! Отзыв отправлен на модерацию.",
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
