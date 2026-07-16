// ==================================================
// SECTION: Admin API — complete Smart Banner snapshot
// ==================================================
import { getPromoBannerSnapshot } from "@/lib/promoBannerDb";
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
    return Response.json(await getPromoBannerSnapshot(), {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch {
    return Response.json({ message: "Не удалось загрузить умный баннер." }, { status: 500 });
  }
}
