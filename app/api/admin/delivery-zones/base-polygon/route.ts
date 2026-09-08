// ==================================================
// SECTION: Admin API — Delivery zones (Zone 1 / MKAD polygon)
// РАЗДЕЛ: Admin API — зоны доставки (полигон зоны 1 / МКАД)
// ==================================================
import { updateBaseZonePolygon } from "@/lib/deliveryZonesDb";
import { isAdminRequestAuthorized, unauthorizedAdminResponse } from "@/lib/adminApiAuth";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCoordinateArray(value: unknown): value is GeoCoordinate[] {
  return (
    Array.isArray(value) &&
    value.every(
      (point) =>
        point &&
        typeof point === "object" &&
        typeof (point as GeoCoordinate).latitude === "number" &&
        typeof (point as GeoCoordinate).longitude === "number",
    )
  );
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = (await request.json()) as { polygon?: unknown };
    if (!isCoordinateArray(body.polygon)) {
      return Response.json(
        { message: "polygon должен быть массивом точек {latitude, longitude}." },
        { status: 400 },
      );
    }

    const result = await updateBaseZonePolygon(body.polygon);
    if (!result.ok) {
      return Response.json({ message: result.error }, { status: 400 });
    }
    return Response.json({ zones: result.zones });
  } catch {
    return Response.json({ message: "Не удалось сохранить полигон." }, { status: 500 });
  }
}
