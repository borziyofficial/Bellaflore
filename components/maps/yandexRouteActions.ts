// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import { buildYandexRouteForCourier } from "@/components/maps/yandexRouteAdapter";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";

export async function buildRoadRoutesForRouteLines(
  routeLines: CourierRouteLine[],
): Promise<Record<string, YandexCourierRoute>> {
  const results: Record<string, YandexCourierRoute> = {};

  for (const routeLine of routeLines) {
    results[routeLine.courierId] = await buildYandexRouteForCourier(routeLine);
  }

  return results;
}
