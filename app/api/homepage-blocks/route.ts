// ==================================================
// SECTION: Public API — Homepage content blocks (storefront)
// ==================================================
import { getAllHomepageBlocks } from "@/lib/homepageBlocksDb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const blocks = await getAllHomepageBlocks();
    return Response.json(
      { blocks },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json({ blocks: null }, { status: 200 });
  }
}
