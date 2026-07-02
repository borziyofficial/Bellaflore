// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import { refreshYandexRouteTraffic } from "@/components/maps/yandexRouteAdapter";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";

export async function refreshTrafficForRouteLines(
  routeLines: CourierRouteLine[],
  existingRoutes: Record<string, YandexCourierRoute>,
): Promise<Record<string, YandexCourierRoute>> {
  const results: Record<string, YandexCourierRoute> = {};

  for (const routeLine of routeLines) {
    results[routeLine.courierId] = await refreshYandexRouteTraffic(
      routeLine,
      existingRoutes[routeLine.courierId],
    );
  }

  return results;
}
