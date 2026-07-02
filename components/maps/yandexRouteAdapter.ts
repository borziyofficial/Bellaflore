// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import { getCourierMapColor } from "@/components/maps/courierMapColors";
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import { isYandexMapsPreviewEnabled } from "@/components/maps/mapProviderRegistry";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import {
  buildYandexRouteCacheKey,
  readYandexRouteCacheEntry,
  writeYandexRouteCacheEntry,
} from "@/components/maps/yandexRouteCache";
import { enrichCourierRouteWithProviderEta } from "@/components/maps/yandexRouteProviderEta";
import type {
  YandexCourierRoute,
  YandexRouteCoordinate,
} from "@/components/maps/yandexRoutingTypes";

type YandexRouteRequestOptions = {
  mapStateAutoApply?: boolean;
  routingMode?: string;
  avoidTrafficJams?: boolean;
};

type YandexRouteApi = {
  route?: (
    referencePoints: [number, number][],
    options?: YandexRouteRequestOptions,
  ) => Promise<unknown>;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createBaseRoute(routeLine: CourierRouteLine): YandexCourierRoute {
  const updatedAt = new Date().toISOString();

  return enrichCourierRouteWithProviderEta({
    courierId: routeLine.courierId,
    courierName: routeLine.courierName,
    color: routeLine.color || getCourierMapColor(routeLine.courierId),
    orderIds: routeLine.orderIds,
    requestPoints: [],
    routeCoordinates: [],
    distanceMeters: null,
    durationSeconds: null,
    providerDistanceMeters: null,
    providerDurationSeconds: null,
    providerDurationWithTrafficSeconds: null,
    averageSpeedKmh: null,
    trafficDelaySeconds: null,
    trafficDelayLevel: "none",
    providerUpdatedAt: null,
    status: "fallback",
    updatedAt,
  });
}

function toRequestPoints(routeLine: CourierRouteLine): YandexRouteCoordinate[] {
  return routeLine.points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

function appendCoordinates(
  target: [number, number][],
  coordinates: unknown,
): void {
  if (!Array.isArray(coordinates)) {
    return;
  }

  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      continue;
    }

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    target.push([latitude, longitude]);
  }
}

function extractPathCollectionCoordinates(
  paths: unknown,
  target: [number, number][],
): void {
  if (!paths || typeof paths !== "object") {
    return;
  }

  const pathCollection = paths as {
    get?: (index: number) => unknown;
    getLength?: () => number;
    each?: (callback: (path: unknown) => void) => void;
  };

  if (typeof pathCollection.each === "function") {
    pathCollection.each((path) => {
      extractPathCoordinates(path, target);
    });
    return;
  }

  if (typeof pathCollection.get !== "function") {
    return;
  }

  const pathCount =
    typeof pathCollection.getLength === "function"
      ? pathCollection.getLength()
      : 0;

  for (let index = 0; index < pathCount; index += 1) {
    extractPathCoordinates(pathCollection.get(index), target);
  }
}

function extractPathCoordinates(path: unknown, target: [number, number][]): void {
  if (!path || typeof path !== "object") {
    return;
  }

  const pathObject = path as {
    getCoordinates?: () => unknown;
    getSegments?: () => unknown;
  };

  if (typeof pathObject.getCoordinates === "function") {
    appendCoordinates(target, pathObject.getCoordinates());
  }

  if (typeof pathObject.getSegments !== "function") {
    return;
  }

  const segments = pathObject.getSegments() as {
    get?: (index: number) => unknown;
    getLength?: () => number;
    each?: (callback: (segment: unknown) => void) => void;
  };

  if (typeof segments.each === "function") {
    segments.each((segment) => {
      if (
        segment &&
        typeof segment === "object" &&
        typeof (segment as { getCoordinates?: () => unknown }).getCoordinates ===
          "function"
      ) {
        appendCoordinates(
          target,
          (segment as { getCoordinates: () => unknown }).getCoordinates(),
        );
      }
    });
    return;
  }

  if (typeof segments.get !== "function") {
    return;
  }

  const segmentCount =
    typeof segments.getLength === "function" ? segments.getLength() : 0;

  for (let index = 0; index < segmentCount; index += 1) {
    const segment = segments.get(index) as { getCoordinates?: () => unknown };
    if (typeof segment?.getCoordinates === "function") {
      appendCoordinates(target, segment.getCoordinates());
    }
  }
}

function extractRouteCoordinates(routeResult: unknown): YandexRouteCoordinate[] {
  const collected: [number, number][] = [];

  if (!routeResult || typeof routeResult !== "object") {
    return [];
  }

  const routeObject = routeResult as {
    getActiveRoute?: () => unknown;
    getPaths?: () => unknown;
    getCoordinates?: () => unknown;
  };

  if (typeof routeObject.getActiveRoute === "function") {
    const activeRoute = routeObject.getActiveRoute();
    if (activeRoute && typeof activeRoute === "object") {
      const activeRouteObject = activeRoute as {
        getPaths?: () => unknown;
        getCoordinates?: () => unknown;
      };

      if (typeof activeRouteObject.getPaths === "function") {
        extractPathCollectionCoordinates(activeRouteObject.getPaths(), collected);
      }

      if (typeof activeRouteObject.getCoordinates === "function") {
        appendCoordinates(collected, activeRouteObject.getCoordinates());
      }
    }
  }

  if (typeof routeObject.getPaths === "function") {
    extractPathCollectionCoordinates(routeObject.getPaths(), collected);
  }

  if (typeof routeObject.getCoordinates === "function") {
    appendCoordinates(collected, routeObject.getCoordinates());
  }

  return collected.map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
}

function extractRouteMetrics(routeResult: unknown): {
  distanceMeters: number | null;
  durationSeconds: number | null;
  durationWithTrafficSeconds: number | null;
} {
  if (!routeResult || typeof routeResult !== "object") {
    return {
      distanceMeters: null,
      durationSeconds: null,
      durationWithTrafficSeconds: null,
    };
  }

  const routeObject = routeResult as {
    getActiveRoute?: () => unknown;
    getLength?: () => number;
    getJamsTime?: () => number;
    getTime?: () => number;
    properties?: {
      get?: (key: string) => { value?: number } | undefined;
    };
  };

  const activeRoute =
    typeof routeObject.getActiveRoute === "function"
      ? routeObject.getActiveRoute()
      : routeResult;

  const activeRouteObject = activeRoute as {
    getLength?: () => number;
    getJamsTime?: () => number;
    getTime?: () => number;
    properties?: {
      get?: (key: string) => { value?: number } | undefined;
    };
  };

  let distanceMeters: number | null = null;
  let durationSeconds: number | null = null;
  let durationWithTrafficSeconds: number | null = null;

  const properties = activeRouteObject?.properties;
  if (properties && typeof properties.get === "function") {
    const distance = properties.get("distance");
    const duration = properties.get("duration");
    const durationInTraffic =
      properties.get("durationInTraffic") ??
      properties.get("DurationWithTraffic") ??
      properties.get("durationWithTraffic");

    if (typeof distance?.value === "number") {
      distanceMeters = distance.value;
    }

    if (typeof duration?.value === "number") {
      durationSeconds = duration.value;
    }

    if (typeof durationInTraffic?.value === "number") {
      durationWithTrafficSeconds = durationInTraffic.value;
    }
  }

  if (
    distanceMeters === null &&
    typeof activeRouteObject?.getLength === "function"
  ) {
    const lengthValue = activeRouteObject.getLength();
    if (Number.isFinite(lengthValue)) {
      distanceMeters = lengthValue;
    }
  }

  if (
    durationSeconds === null &&
    typeof activeRouteObject?.getTime === "function"
  ) {
    const durationValue = activeRouteObject.getTime();
    if (Number.isFinite(durationValue)) {
      durationSeconds = durationValue;
    }
  }

  if (
    durationWithTrafficSeconds === null &&
    typeof activeRouteObject?.getJamsTime === "function"
  ) {
    const jamsTimeValue = activeRouteObject.getJamsTime();
    if (Number.isFinite(jamsTimeValue)) {
      durationWithTrafficSeconds = jamsTimeValue;
    }
  }

  if (
    durationWithTrafficSeconds === null &&
    durationSeconds !== null
  ) {
    durationWithTrafficSeconds = durationSeconds;
  }

  return {
    distanceMeters,
    durationSeconds,
    durationWithTrafficSeconds,
  };
}

async function requestYandexRouteGeometry(
  referencePoints: [number, number][],
  options?: {
    includeTraffic?: boolean;
  },
): Promise<{
  routeCoordinates: YandexRouteCoordinate[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  durationWithTrafficSeconds: number | null;
}> {
  const ymaps = (await loadConfiguredYandexMapsSdk()) as YandexRouteApi;

  if (typeof ymaps.route !== "function") {
    throw new Error("Yandex routing API is unavailable in the loaded SDK.");
  }

  const routeResult = await ymaps.route(referencePoints, {
    mapStateAutoApply: false,
    routingMode: "auto",
    avoidTrafficJams: options?.includeTraffic ? false : true,
  });

  const metrics = extractRouteMetrics(routeResult);

  return {
    routeCoordinates: extractRouteCoordinates(routeResult),
    distanceMeters: metrics.distanceMeters,
    durationSeconds: metrics.durationSeconds,
    durationWithTrafficSeconds: metrics.durationWithTrafficSeconds,
  };
}

function finalizeBuiltRoute(
  routeLine: CourierRouteLine,
  partialRoute: YandexCourierRoute,
  routeGeometry: {
    routeCoordinates: YandexRouteCoordinate[];
    distanceMeters: number | null;
    durationSeconds: number | null;
    durationWithTrafficSeconds: number | null;
  },
  fromCache = false,
): YandexCourierRoute {
  const providerUpdatedAt = new Date().toISOString();
  const builtRoute = enrichCourierRouteWithProviderEta({
    ...partialRoute,
    routeCoordinates: routeGeometry.routeCoordinates,
    distanceMeters: routeGeometry.distanceMeters,
    durationSeconds: routeGeometry.durationSeconds,
    providerDistanceMeters: routeGeometry.distanceMeters,
    providerDurationSeconds: routeGeometry.durationSeconds,
    providerDurationWithTrafficSeconds: routeGeometry.durationWithTrafficSeconds,
    providerUpdatedAt,
    status: "ready",
    updatedAt: providerUpdatedAt,
    fromCache,
  });

  writeYandexRouteCacheEntry(buildYandexRouteCacheKey(routeLine), builtRoute);
  return builtRoute;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export async function refreshYandexRouteTraffic(
  routeLine: CourierRouteLine,
  existingRoute?: YandexCourierRoute,
): Promise<YandexCourierRoute> {
  const baseRoute = createBaseRoute(routeLine);
  const requestPoints = toRequestPoints(routeLine);

  if (routeLine.points.length < 2) {
    return {
      ...baseRoute,
      requestPoints,
      status: "incomplete",
    };
  }

  if (!existingRoute || existingRoute.status !== "ready") {
    return {
      ...(existingRoute ?? baseRoute),
      requestPoints,
      status: existingRoute?.status ?? "incomplete",
      errorMessage: existingRoute?.errorMessage ?? "Road route is missing.",
    };
  }

  if (!isYandexMapsPreviewEnabled()) {
    return enrichCourierRouteWithProviderEta({
      ...existingRoute,
      requestPoints,
      status: "fallback",
      errorMessage: "Yandex provider or API key is unavailable.",
    });
  }

  try {
    const referencePoints = routeLine.points.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    );
    const routeGeometry = await requestYandexRouteGeometry(referencePoints, {
      includeTraffic: true,
    });

    const refreshedRoute = enrichCourierRouteWithProviderEta({
      ...existingRoute,
      requestPoints,
      routeCoordinates:
        routeGeometry.routeCoordinates.length >= 2
          ? routeGeometry.routeCoordinates
          : existingRoute.routeCoordinates,
      distanceMeters:
        routeGeometry.distanceMeters ?? existingRoute.distanceMeters,
      durationSeconds:
        routeGeometry.durationSeconds ?? existingRoute.durationSeconds,
      providerDistanceMeters:
        routeGeometry.distanceMeters ?? existingRoute.providerDistanceMeters,
      providerDurationSeconds:
        routeGeometry.durationSeconds ?? existingRoute.providerDurationSeconds,
      providerDurationWithTrafficSeconds:
        routeGeometry.durationWithTrafficSeconds ??
        routeGeometry.durationSeconds ??
        existingRoute.providerDurationWithTrafficSeconds,
      providerUpdatedAt: new Date().toISOString(),
      status: "ready",
      fromCache: false,
      errorMessage: undefined,
    });

    writeYandexRouteCacheEntry(
      buildYandexRouteCacheKey(routeLine),
      refreshedRoute,
    );
    return refreshedRoute;
  } catch (error) {
    return enrichCourierRouteWithProviderEta({
      ...existingRoute,
      requestPoints,
      status: "fallback",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Provider traffic refresh failed.",
      providerUpdatedAt: new Date().toISOString(),
    });
  }
}

export async function buildYandexRouteForCourier(
  routeLine: CourierRouteLine,
  options?: {
    skipCache?: boolean;
  },
): Promise<YandexCourierRoute> {
  const baseRoute = createBaseRoute(routeLine);
  const requestPoints = toRequestPoints(routeLine);

  if (routeLine.points.length < 2) {
    return {
      ...baseRoute,
      requestPoints,
      status: "incomplete",
    };
  }

  if (!isYandexMapsPreviewEnabled()) {
    return {
      ...baseRoute,
      requestPoints,
      status: "fallback",
      errorMessage: "Yandex provider or API key is unavailable.",
    };
  }

  const cacheKey = buildYandexRouteCacheKey(routeLine);
  if (!options?.skipCache) {
    const cachedRoute = readYandexRouteCacheEntry(cacheKey);
    if (cachedRoute) {
      return enrichCourierRouteWithProviderEta({
        ...cachedRoute,
        fromCache: true,
      });
    }
  }

  try {
    const referencePoints = routeLine.points.map(
      (point) => [point.latitude, point.longitude] as [number, number],
    );
    const routeGeometry = await requestYandexRouteGeometry(referencePoints, {
      includeTraffic: true,
    });

    if (routeGeometry.routeCoordinates.length < 2) {
      return {
        ...baseRoute,
        requestPoints,
        status: "error",
        errorMessage: "Yandex routing returned no usable road geometry.",
      };
    }

    return finalizeBuiltRoute(
      routeLine,
      {
        ...baseRoute,
        requestPoints,
      },
      routeGeometry,
    );
  } catch (error) {
    return {
      ...baseRoute,
      requestPoints,
      status: "fallback",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Yandex routing request failed.",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function requestYandexRouteBetweenPoints(
  from: YandexRouteCoordinate,
  to: YandexRouteCoordinate,
  options?: {
    includeTraffic?: boolean;
  },
): Promise<{
  distanceMeters: number | null;
  durationSeconds: number | null;
  durationWithTrafficSeconds: number | null;
}> {
  const routeGeometry = await requestYandexRouteGeometry(
    [
      [from.latitude, from.longitude],
      [to.latitude, to.longitude],
    ],
    options,
  );

  return {
    distanceMeters: routeGeometry.distanceMeters,
    durationSeconds: routeGeometry.durationSeconds,
    durationWithTrafficSeconds: routeGeometry.durationWithTrafficSeconds,
  };
}
