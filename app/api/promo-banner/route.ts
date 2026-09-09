// ==================================================
// SECTION: Public API — Promo banner (storefront, between Hero and catalog)
// ==================================================
import { resolveCurrentPromoBannerSlides } from "@/lib/promoBannerResolve";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { isEnabled, mode, slides } = await resolveCurrentPromoBannerSlides();
    return Response.json(
      { isEnabled, mode, slides },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=120",
        },
      },
    );
  } catch {
    // Storefront hides the banner entirely on any failure — the Hero above
    // it is unaffected either way.
    return Response.json(
      { isEnabled: false, mode: "manual", slides: [] },
      { status: 200 },
    );
  }
}
