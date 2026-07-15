// ==================================================
// SECTION: Admin API — Promo banner live preview (unsaved draft settings)
//
// Lets the admin UI show what the storefront banner would look like while
// toggling Manual/Automatic and the auto-source, before hitting "Сохранить".
// Manual-mode preview just reuses the saved slides (nothing to draft there).
// ==================================================
import {
  getPromoBannerSettings,
  type PromoBannerAutoSource,
} from "@/lib/promoBannerDb";
import { resolvePromoBannerSlidesForSettings } from "@/lib/promoBannerResolve";
import {
  isAdminRequestAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SOURCES: PromoBannerAutoSource[] = [
  "featured",
  "popular",
  "new",
  "bestsellers",
  "admin_selected",
];

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as {
      mode?: string;
      autoSource?: string;
      autoSelectedProductIds?: string[];
      autoSlideLimit?: number;
    };

    const current = await getPromoBannerSettings();
    const draftSettings = {
      mode: body.mode === "auto" ? ("auto" as const) : ("manual" as const),
      autoSource: VALID_SOURCES.includes(body.autoSource as PromoBannerAutoSource)
        ? (body.autoSource as PromoBannerAutoSource)
        : current.autoSource,
      autoSelectedProductIds: Array.isArray(body.autoSelectedProductIds)
        ? body.autoSelectedProductIds.filter((id): id is string => typeof id === "string")
        : current.autoSelectedProductIds,
      autoSlideLimit:
        typeof body.autoSlideLimit === "number" && body.autoSlideLimit > 0
          ? Math.min(20, Math.round(body.autoSlideLimit))
          : current.autoSlideLimit,
      updatedAt: current.updatedAt,
    };

    const slides = await resolvePromoBannerSlidesForSettings(draftSettings);
    return Response.json({ slides });
  } catch {
    return Response.json({ message: "Не удалось построить предпросмотр." }, { status: 500 });
  }
}
