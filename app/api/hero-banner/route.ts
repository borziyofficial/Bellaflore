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
      { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } },
    );
  } catch {
    return Response.json({ settings: null }, { status: 200 });
  }
}
