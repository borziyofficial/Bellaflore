// ==================================================
// SECTION: Admin API — Promo banner slides reorder
// ==================================================
import { reorderPromoBannerSlides } from "@/lib/promoBannerDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { orderedIds?: unknown };
    if (!Array.isArray(body.orderedIds)) {
      return Response.json({ message: "Некорректный порядок слайдов." }, { status: 400 });
    }

    const orderedIds = body.orderedIds.filter((id): id is string => typeof id === "string");
    const slides = await reorderPromoBannerSlides(orderedIds);
    return Response.json({ slides });
  } catch {
    return Response.json({ message: "Не удалось сохранить порядок." }, { status: 500 });
  }
}
