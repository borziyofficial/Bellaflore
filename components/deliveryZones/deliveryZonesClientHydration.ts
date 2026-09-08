// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Гидратация каталога зон на клиенте
//
// Purpose (EN): Browser-side counterpart to
// lib/deliveryZonesDb.ts#hydrateDeliveryZonesCatalogFromDb — fetches the
// public GET /api/delivery-zones endpoint once per page load and applies
// the result to the same shared catalog array
// (deliveryZonesCatalog.ts#applyDeliveryZoneOverrides) that zone
// detection, pricing labels, and the Yandex map all read from. This is what
// lets a customer's live checkout preview reflect admin-saved zones without
// a redeploy, exactly like the server-side path already does for the real
// order price. Safe no-op on any failure (offline, API error, etc.) — the
// built-in default catalog stays in effect.
//
// Назначение (RU): Клиентская версия гидратации из
// lib/deliveryZonesDb.ts#hydrateDeliveryZonesCatalogFromDb — один раз за
// загрузку страницы запрашивает публичный GET /api/delivery-zones и
// применяет результат к тому же общему массиву каталога, из которого
// читают определение зоны, подписи тарифов и карта Yandex. Благодаря этому
// живой предпросмотр в checkout отражает изменения из админки без деплоя —
// так же, как уже работает серверный путь для реальной цены заказа.
// Безопасно ничего не делает при любой ошибке (офлайн, ошибка API и т.д.) —
// остаётся встроенный каталог по умолчанию.
// ==================================================
"use client";

import { applyDeliveryZoneOverrides } from "@/components/deliveryZones/deliveryZonesCatalog";
import { applyMkadPolygonOverride } from "@/components/deliveryZones/mkadGeometry";
import type { DeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZonesCatalog";

let hydrationPromise: Promise<void> | null = null;

type PublicDeliveryZonesResponse = {
  zones: DeliveryZoneCatalogEntry[] | null;
};

/** Idempotent — safe to call from every component that needs fresh zones;
 * the actual fetch happens at most once per page load. */
export function ensureDeliveryZonesHydratedOnClient(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      try {
        const response = await fetch("/api/delivery-zones", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as PublicDeliveryZonesResponse;
        if (body.zones && body.zones.length > 0) {
          applyDeliveryZoneOverrides(body.zones);
          const baseEntry = body.zones.find((zone) => zone.isBaseZone);
          if (baseEntry) {
            applyMkadPolygonOverride(baseEntry.polygonCoordinates);
          }
        }
      } catch {
        // Storefront falls back to the static built-in catalog.
      }
    })();
  }
  return hydrationPromise;
}
