// ==================================================
// SECTION: Admin API — Promo banner slide (single) — update + delete
// ==================================================
import {
  deletePromoBannerSlide,
  PromoBannerSlideNotFoundError,
  updatePromoBannerSlide,
  type PromoBannerSlideUpdateInput,
} from "@/lib/promoBannerDb";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as { patch?: PromoBannerSlideUpdateInput };
    if (!body.patch || typeof body.patch !== "object") {
      return Response.json({ message: "Некорректные данные слайда." }, { status: 400 });
    }

    const patch: PromoBannerSlideUpdateInput = {};
    if (typeof body.patch.title === "string") patch.title = body.patch.title.trim();
    if (typeof body.patch.subtitle === "string") patch.subtitle = body.patch.subtitle.trim();
    if (typeof body.patch.buttonText === "string") patch.buttonText = body.patch.buttonText.trim();
    if (typeof body.patch.buttonLink === "string") patch.buttonLink = body.patch.buttonLink.trim();
    if (typeof body.patch.imageUrl === "string") patch.imageUrl = body.patch.imageUrl.trim();
    if (typeof body.patch.isEnabled === "boolean") patch.isEnabled = body.patch.isEnabled;

    const slide = await updatePromoBannerSlide(id, patch);
    return Response.json({ slide });
  } catch (error) {
    if (error instanceof PromoBannerSlideNotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    return Response.json({ message: "Не удалось обновить слайд." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;

  try {
    await deletePromoBannerSlide(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ message: "Не удалось удалить слайд." }, { status: 500 });
  }
}
