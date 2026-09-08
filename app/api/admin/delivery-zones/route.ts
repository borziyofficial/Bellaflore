// ==================================================
// SECTION: Admin API — Delivery zones (list)
// РАЗДЕЛ: Admin API — зоны доставки (список)
// ==================================================
import { getDeliveryZonesForAdmin } from "@/lib/deliveryZonesDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const zones = await getDeliveryZonesForAdmin();
    if (!zones) {
      return Response.json(
        {
          zones: null,
          message:
            "Хранилище зон доставки недоступно (нет DATABASE_URL или ошибка подключения).",
        },
        { status: 200 },
      );
    }
    return Response.json(
      { zones },
      { headers: { "Cache-Control": "no-store, must-revalidate" } },
    );
  } catch {
    return Response.json(
      { message: "Не удалось загрузить зоны доставки." },
      { status: 500 },
    );
  }
}
