// ==================================================
// SECTION: Admin API — Hero banner (Умный баннер)
// ==================================================
import {
  getHeroBannerSettings,
  updateHeroBannerSettings,
  type HeroBannerUpdateInput,
} from "@/lib/heroBannerDb";
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
    const settings = await getHeroBannerSettings();
    return Response.json(
      { settings },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить баннер." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { settings?: HeroBannerUpdateInput };
    if (!body.settings || typeof body.settings !== "object") {
      return Response.json({ message: "Некорректные данные баннера." }, { status: 400 });
    }

    const patch: HeroBannerUpdateInput = {};
    if (typeof body.settings.title === "string") patch.title = body.settings.title.trim();
    if (typeof body.settings.subtitle === "string") patch.subtitle = body.settings.subtitle.trim();
    if (typeof body.settings.buttonText === "string") patch.buttonText = body.settings.buttonText.trim();
    if (typeof body.settings.buttonLink === "string") patch.buttonLink = body.settings.buttonLink.trim();
    if (typeof body.settings.imageUrl === "string") patch.imageUrl = body.settings.imageUrl.trim();
    if (typeof body.settings.isEnabled === "boolean") patch.isEnabled = body.settings.isEnabled;

    const settings = await updateHeroBannerSettings(patch);
    return Response.json({ settings });
  } catch {
    return Response.json({ message: "Не удалось сохранить баннер." }, { status: 500 });
  }
}
