// ==================================================
// SECTION: Public API — Delivery zones (storefront)
// РАЗДЕЛ: Публичный API — зоны доставки (витрина)
// ==================================================
import { getDeliveryZoneEntriesFromDb } from "@/lib/deliveryZonesDb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const zones = await getDeliveryZoneEntriesFromDb();
    return Response.json(
      { zones },
      {
        headers: {
          "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return Response.json({ zones: null }, { status: 200 });
  }
}
