// ==================================================
// SECTION: Admin API — Delivery zones (per-zone metadata)
// РАЗДЕЛ: Admin API — зоны доставки (метаданные одной зоны)
// ==================================================
import { updateDeliveryZoneMeta, type DeliveryZoneMetaPatch } from "@/lib/deliveryZonesDb";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ZONE_IDS: DeliveryZoneId[] = [
  "base",
  "7km",
  "14km",
  "21km",
  "28km",
  "38km",
  "48km",
];

function isValidZoneId(value: string): value is DeliveryZoneId {
  return (VALID_ZONE_IDS as string[]).includes(value);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ zoneId: string }> },
) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const { zoneId } = await context.params;
  if (!isValidZoneId(zoneId)) {
    return Response.json({ message: "Неизвестная зона." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { zone?: Record<string, unknown> };
    if (!body.zone || typeof body.zone !== "object") {
      return Response.json({ message: "Некорректные данные зоны." }, { status: 400 });
    }

    const patch: DeliveryZoneMetaPatch = {};
    if (typeof body.zone.title === "string") patch.title = body.zone.title.trim();
    if (typeof body.zone.label === "string") patch.label = body.zone.label.trim();
    if (typeof body.zone.color === "string") patch.color = body.zone.color.trim();
    if (typeof body.zone.fillOpacity === "number") patch.fillOpacity = body.zone.fillOpacity;
    if (typeof body.zone.priceRub === "number") patch.priceRub = body.zone.priceRub;
    if (typeof body.zone.estimatedTime === "string") {
      patch.estimatedTime = body.zone.estimatedTime.trim();
    }
    if (typeof body.zone.isActive === "boolean") patch.isActive = body.zone.isActive;

    const result = await updateDeliveryZoneMeta(zoneId, patch);
    if (!result.ok) {
      return Response.json({ message: result.error }, { status: 400 });
    }
    return Response.json({ zones: result.zones });
  } catch {
    return Response.json({ message: "Не удалось сохранить зону." }, { status: 500 });
  }
}
