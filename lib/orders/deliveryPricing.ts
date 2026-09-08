import { detectDeliveryZoneByPolygon } from "@/components/deliveryZones/deliveryZonePolygonEngine";
import { OrderError } from "@/lib/orders/errors";

export type ServerDeliveryPrice = {
  zoneId: string;
  cost: number;
};

// Loaded lazily (not a static top-level import) for two reasons: (1) it
// keeps this module's own module-graph free of the real `postgres` driver
// and the "server-only" guard for callers that never need DB access at
// all, and (2) it lets hydration failures — including the "server-only"
// package's own guard throwing when this code runs outside Next.js's
// bundler, e.g. in the plain-Node Playwright unit tests under
// tests/orders/ that construct lib/orders/service.ts with fake
// catalog/repository dependencies — be swallowed right here instead of
// crashing the whole module graph at import time. Behavior inside the real
// Next.js app is unchanged: the dynamic import resolves immediately (the
// module is cached after the first call) and hydration still runs before
// every price calculation.
async function hydrateDeliveryZonesCatalogSafely(): Promise<void> {
  try {
    const { hydrateDeliveryZonesCatalogFromDb } = await import("@/lib/deliveryZonesDb");
    await hydrateDeliveryZonesCatalogFromDb();
  } catch {
    // Defensive: hydration must never break order pricing/creation.
  }
}

export async function calculateServerDeliveryPrice(
  latitude: number,
  longitude: number,
): Promise<ServerDeliveryPrice> {
  // Picks up admin-saved zones (Admin -> Delivery zones) before pricing, so
  // an order is always priced against the zones an administrator actually
  // sees/edited — falls back to the built-in catalog if the DB is
  // unavailable or unchanged (TTL-cached, never throws).
  await hydrateDeliveryZonesCatalogSafely();
  const { zone } = detectDeliveryZoneByPolygon({ latitude, longitude });
  if (!zone || !Number.isSafeInteger(zone.priceRub) || zone.priceRub < 0) {
    throw new OrderError(
      "DELIVERY_OUTSIDE_AREA",
      "Адрес находится вне доступной зоны доставки.",
      422,
    );
  }
  return { zoneId: zone.zoneId, cost: zone.priceRub };
}
