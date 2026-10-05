import {
  getApprovedReviewSummary,
  ReviewStorageNotConfiguredError,
} from "@/lib/reviews/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim() || null;
    const summary = await getApprovedReviewSummary(productId);

    return Response.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ReviewStorageNotConfiguredError) {
      return Response.json({ message: error.message }, { status: 503 });
    }

    console.error("[reviews-summary-api]", error);
    return Response.json(
      { message: "Не удалось загрузить рейтинг." },
      { status: 500 },
    );
  }
}
