// ==================================================
// SECTION: Public API — Hero banner (storefront)
// ==================================================
import { getHeroBannerSettings } from "@/lib/heroBannerDb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getHeroBannerSettings();
    return Response.json(
      { settings },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ settings: null }, { status: 200 });
  }
}
