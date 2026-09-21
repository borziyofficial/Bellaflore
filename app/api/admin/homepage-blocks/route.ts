// ==================================================
// SECTION: Admin API — Homepage content blocks (list all)
// ==================================================
import { getAllHomepageBlocks } from "@/lib/homepageBlocksDb";
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
    const blocks = await getAllHomepageBlocks();
    return Response.json(
      { blocks },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ message: "Не удалось загрузить блоки главной страницы." }, { status: 500 });
  }
}
