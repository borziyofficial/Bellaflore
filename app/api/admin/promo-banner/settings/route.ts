// ==================================================
// SECTION: Admin API — Promo banner settings (mode + auto-source)
// ==================================================
import {
  getPromoBannerSettings,
  updatePromoBannerSettings,
  type PromoBannerSettingsUpdateInput,
} from "@/lib/promoBannerDb";
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
    const settings = await getPromoBannerSettings();
    return Response.json(
      { settings },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить настройки баннера." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { settings?: PromoBannerSettingsUpdateInput };
    if (!body.settings || typeof body.settings !== "object") {
      return Response.json({ message: "Некорректные данные баннера." }, { status: 400 });
    }

    const patch: PromoBannerSettingsUpdateInput = {};
    if (body.settings.mode === "manual" || body.settings.mode === "auto") {
      patch.mode = body.settings.mode;
    }
    if (
      typeof body.settings.autoSource === "string" &&
      ["featured", "popular", "new", "bestsellers", "admin_selected"].includes(
        body.settings.autoSource,
      )
    ) {
      patch.autoSource = body.settings.autoSource;
    }
    if (Array.isArray(body.settings.autoSelectedProductIds)) {
      patch.autoSelectedProductIds = body.settings.autoSelectedProductIds.filter(
        (id): id is string => typeof id === "string",
      );
    }
    if (
      typeof body.settings.autoSlideLimit === "number" &&
      Number.isFinite(body.settings.autoSlideLimit) &&
      body.settings.autoSlideLimit > 0
    ) {
      patch.autoSlideLimit = Math.min(20, Math.round(body.settings.autoSlideLimit));
    }

    const settings = await updatePromoBannerSettings(patch);
    return Response.json({ settings });
  } catch {
    return Response.json({ message: "Не удалось сохранить настройки баннера." }, { status: 500 });
  }
}
