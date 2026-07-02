// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import { calculateDeliveryZoneByDistance } from "@/components/deliveryZones/deliveryZoneCalculator";
import {
  formatDeliveryAvailableMessage,
  DELIVERY_UNAVAILABLE_MESSAGE,
} from "@/components/deliveryZones/deliveryIntelligenceMessages";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import { detectDeliveryZoneByPolygon } from "@/components/deliveryZones/deliveryZonePolygonEngine";
import type { DeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZonesCatalog";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import {
  getApproxDistanceFromBaseZoneKm,
  getNearestMkadBoundaryPoint,
  getPointNorthOfBaseZoneAtDistanceKm,
  isPointInsideBaseZone,
} from "@/components/deliveryZones/mkadBoundary";
import type {
  DetectRealDeliveryZoneParams,
  DeliveryZoneDetectionMode,
  RealDeliveryZoneDistanceSource,
  RealDeliveryZoneResult,
  RealDeliveryZoneStatus,
} from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { RoadDistanceZoneResult } from "@/components/deliveryZones/roadDistanceZoneTypes";
import { calculateYandexRoadDistanceFromBoundary } from "@/components/deliveryZones/yandexRoadDistanceAdapter";
import { geocodeAddress } from "@/components/maps/geocodeAddress";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MOCK_DISTANCE_KM_PATTERN =
  /mockDistanceKm\s*[:=]\s*(\d+(?:[.,]\d+)?)/i;

const DEFAULT_DETECTION_MODE: DeliveryZoneDetectionMode = "hybrid";
const REAL_ZONE_PROVIDER = "bellaflore_real_zone_engine_v1";

const EMPTY_ROAD_FIELDS = {
  boundaryPoint: null,
  roadDistanceKm: null,
  roadDurationMinutes: null,
  roadDistanceStatus: null,
} as const;

function parseMockDistanceKm(address: string): number | null {
  const match = address.match(MOCK_DISTANCE_KM_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const parsedDistance = Number(match[1].replace(",", "."));
  return Number.isFinite(parsedDistance) ? parsedDistance : null;
}

function buildResult(
  partial: Omit<RealDeliveryZoneResult, "calculatedAt">,
): RealDeliveryZoneResult {
  return {
    ...partial,
    calculatedAt: new Date().toISOString(),
  };
}

function buildUnknownResult(
  address: string,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
): RealDeliveryZoneResult {
  return buildResult({
    address,
    latitude: null,
    longitude: null,
    isInsideBaseZone: false,
    distanceFromBaseKm: null,
    selectedZoneId: null,
    selectedZoneLabel: null,
    deliveryPriceRub: null,
    status: "unknown",
    detectionMode,
    provider,
    warnings,
    distanceSource: "none",
    ...EMPTY_ROAD_FIELDS,
  });
}

function buildErrorResult(
  address: string,
  latitude: number | null,
  longitude: number | null,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
): RealDeliveryZoneResult {
  return buildResult({
    address,
    latitude,
    longitude,
    isInsideBaseZone: false,
    distanceFromBaseKm: null,
    selectedZoneId: null,
    selectedZoneLabel: null,
    deliveryPriceRub: null,
    status: "error",
    detectionMode,
    provider,
    warnings,
    distanceSource: "none",
    ...EMPTY_ROAD_FIELDS,
  });
}

function mapCalculationStatus(
  status: "available" | "outside_delivery_area" | "unknown",
): RealDeliveryZoneStatus {
  switch (status) {
    case "available":
      return "available";
    case "outside_delivery_area":
      return "outside_delivery_area";
    case "unknown":
    default:
      return "unknown";
  }
}

function buildZoneResultFromDistance(
  address: string,
  point: GeoCoordinate,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
  isInsideBaseZone: boolean,
  distanceFromBaseKm: number,
  distanceSource: RealDeliveryZoneDistanceSource,
  roadFields: Pick<
    RealDeliveryZoneResult,
    | "boundaryPoint"
    | "roadDistanceKm"
    | "roadDurationMinutes"
    | "roadDistanceStatus"
  >,
): RealDeliveryZoneResult {
  const zoneCalculation = calculateDeliveryZoneByDistance(distanceFromBaseKm);

  return buildResult({
    address,
    latitude: point.latitude,
    longitude: point.longitude,
    isInsideBaseZone,
    distanceFromBaseKm,
    selectedZoneId: zoneCalculation.zone?.zoneId ?? null,
    selectedZoneLabel: zoneCalculation.zone?.label ?? null,
    deliveryPriceRub: zoneCalculation.deliveryPriceRub,
    status: mapCalculationStatus(zoneCalculation.status),
    detectionMode,
    provider,
    warnings,
    distanceSource,
    ...roadFields,
  });
}

function buildResultFromMockDistance(
  address: string,
  mockDistanceKm: number,
  detectionMode: DeliveryZoneDetectionMode,
): RealDeliveryZoneResult {
  const mockPoint =
    mockDistanceKm === 0
      ? { latitude: 55.7558, longitude: 37.6173 }
      : getPointNorthOfBaseZoneAtDistanceKm(mockDistanceKm);

  return buildZoneResultFromDistance(
    address,
    mockPoint,
    detectionMode,
    `${REAL_ZONE_PROVIDER}:mock_distance`,
    ["Mock distance override is active for zone preview testing."],
    mockDistanceKm === 0,
    mockDistanceKm,
    mockDistanceKm === 0 ? "none" : "approx",
    EMPTY_ROAD_FIELDS,
  );
}

function buildZoneResultFromCatalogEntry(
  address: string,
  point: GeoCoordinate,
  zone: DeliveryZoneCatalogEntry,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
): RealDeliveryZoneResult {
  return buildResult({
    address,
    latitude: point.latitude,
    longitude: point.longitude,
    isInsideBaseZone: zone.isBaseZone,
    distanceFromBaseKm: zone.maxDistanceFromBaseKm,
    selectedZoneId: zone.zoneId,
    selectedZoneLabel: zone.label,
    deliveryPriceRub: zone.priceRub,
    status: "available",
    detectionMode,
    provider: `${provider}:polygon`,
    warnings,
    distanceSource: zone.isBaseZone ? "none" : "approx",
    ...EMPTY_ROAD_FIELDS,
  });
}

function detectWithPolygonFirst(
  address: string,
  point: GeoCoordinate,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
): RealDeliveryZoneResult | null {
  const { zone } = detectDeliveryZoneByPolygon(point);

  if (!zone) {
    return null;
  }

  return buildZoneResultFromCatalogEntry(
    address,
    point,
    zone,
    detectionMode,
    provider,
    warnings,
  );
}

function detectWithApproxDistance(
  address: string,
  point: GeoCoordinate,
  detectionMode: DeliveryZoneDetectionMode,
  provider: string,
  warnings: string[],
): RealDeliveryZoneResult {
  const isInsideBaseZone = isPointInsideBaseZone(point);

  if (isInsideBaseZone) {
    return buildZoneResultFromDistance(
      address,
      point,
      detectionMode,
      provider,
      warnings,
      true,
      0,
      "none",
      EMPTY_ROAD_FIELDS,
    );
  }

  const approxDistanceKm = getApproxDistanceFromBaseZoneKm(point);
  const boundaryPoint = getNearestMkadBoundaryPoint(point);

  return buildZoneResultFromDistance(
    address,
    point,
    detectionMode,
    provider,
    warnings,
    false,
    approxDistanceKm,
    "approx",
    {
      boundaryPoint,
      roadDistanceKm: null,
      roadDurationMinutes: null,
      roadDistanceStatus: null,
    },
  );
}

function shouldAttemptRoadDistance(
  detectionMode: DeliveryZoneDetectionMode,
  isInsideBaseZone: boolean,
): boolean {
  if (isInsideBaseZone) {
    return false;
  }

  return detectionMode === "hybrid" || detectionMode === "road_distance";
}

function buildFallbackWarning(roadResult: RoadDistanceZoneResult): string {
  if (roadResult.status === "fallback_to_approx") {
    return (
      roadResult.errorMessage ??
      "Road distance is unavailable. Using approximate distance from MKAD boundary."
    );
  }

  if (roadResult.status === "provider_error") {
    return (
      roadResult.errorMessage ??
      "Road distance request failed. Using approximate distance from MKAD boundary."
    );
  }

  if (roadResult.status === "unavailable") {
    return "Road distance provider is unavailable. Using approximate distance from MKAD boundary.";
  }

  return "Using approximate distance from MKAD boundary.";
}

function applyRoadDistanceResult(
  baseResult: RealDeliveryZoneResult,
  roadResult: RoadDistanceZoneResult,
): RealDeliveryZoneResult {
  const warnings = [...baseResult.warnings];

  if (
    roadResult.status === "ready" &&
    roadResult.roadDistanceKm !== null &&
    Number.isFinite(roadResult.roadDistanceKm)
  ) {
    const zoneCalculation = calculateDeliveryZoneByDistance(roadResult.roadDistanceKm);

    return buildResult({
      ...baseResult,
      distanceFromBaseKm: roadResult.roadDistanceKm,
      selectedZoneId: zoneCalculation.zone?.zoneId ?? null,
      selectedZoneLabel: zoneCalculation.zone?.label ?? null,
      deliveryPriceRub: zoneCalculation.deliveryPriceRub,
      status: mapCalculationStatus(zoneCalculation.status),
      distanceSource: "road",
      boundaryPoint: roadResult.fromBoundaryPoint,
      roadDistanceKm: roadResult.roadDistanceKm,
      roadDurationMinutes: roadResult.roadDurationMinutes,
      roadDistanceStatus: roadResult.status,
      provider: roadResult.provider,
      warnings,
    });
  }

  warnings.push(buildFallbackWarning(roadResult));

  return buildResult({
    ...baseResult,
    boundaryPoint: roadResult.fromBoundaryPoint,
    roadDistanceKm: roadResult.roadDistanceKm,
    roadDurationMinutes: roadResult.roadDurationMinutes,
    roadDistanceStatus: roadResult.status,
    warnings,
  });
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export async function enrichRealDeliveryZoneWithRoadDistance(
  result: RealDeliveryZoneResult,
): Promise<RealDeliveryZoneResult> {
  if (
    result.latitude === null ||
    result.longitude === null ||
    result.isInsideBaseZone ||
    !shouldAttemptRoadDistance(result.detectionMode, result.isInsideBaseZone)
  ) {
    return result;
  }

  const customerPoint: GeoCoordinate = {
    latitude: result.latitude,
    longitude: result.longitude,
  };
  const boundaryPoint =
    result.boundaryPoint ?? getNearestMkadBoundaryPoint(customerPoint);

  const roadResult = await calculateYandexRoadDistanceFromBoundary({
    fromBoundaryPoint: boundaryPoint,
    toCustomerPoint: customerPoint,
  });

  return applyRoadDistanceResult(result, roadResult);
}

export function detectRealDeliveryZone(
  params: DetectRealDeliveryZoneParams,
): RealDeliveryZoneResult {
  const address = params.address.trim();
  const detectionMode = params.detectionMode ?? DEFAULT_DETECTION_MODE;
  const provider = params.provider ?? REAL_ZONE_PROVIDER;
  const warnings: string[] = [];

  if (!address) {
    return buildUnknownResult(address, detectionMode, provider, [
      "Введите адрес доставки, чтобы определить зону.",
    ]);
  }

  const latitude = params.latitude;
  const longitude = params.longitude;

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return buildUnknownResult(address, detectionMode, provider, [
      "Delivery coordinates are unavailable for this address.",
    ]);
  }

  try {
    const polygonResult = detectWithPolygonFirst(
      address,
      { latitude, longitude },
      detectionMode,
      provider,
      warnings,
    );

    if (polygonResult) {
      return polygonResult;
    }

    return detectWithApproxDistance(
      address,
      { latitude, longitude },
      detectionMode,
      provider,
      warnings,
    );
  } catch {
    return buildErrorResult(
      address,
      latitude,
      longitude,
      detectionMode,
      provider,
      ["Unable to calculate delivery zone from coordinates."],
    );
  }
}

export function resolveRealDeliveryZoneForCheckout(
  address: string,
  detectionMode: DeliveryZoneDetectionMode = DEFAULT_DETECTION_MODE,
): RealDeliveryZoneResult {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return detectRealDeliveryZone({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      detectionMode,
    });
  }

  const mockDistanceKm = parseMockDistanceKm(normalizedAddress);
  if (mockDistanceKm !== null) {
    return buildResultFromMockDistance(
      normalizedAddress,
      mockDistanceKm,
      detectionMode,
    );
  }

  const geocoding = geocodeAddress(normalizedAddress);

  if (
    geocoding.status === "error" ||
    geocoding.latitude === null ||
    geocoding.longitude === null
  ) {
    const warnings =
      geocoding.status === "pending"
        ? ["Address geocoding is pending. Zone preview will update after lookup."]
        : geocoding.status === "not_found"
          ? ["Address could not be geocoded."]
          : ["Geocoding failed for this address."];

    return buildUnknownResult(
      normalizedAddress,
      detectionMode,
      geocoding.provider,
      warnings,
    );
  }

  return detectRealDeliveryZone({
    address: normalizedAddress,
    latitude: geocoding.latitude,
    longitude: geocoding.longitude,
    detectionMode,
    provider: geocoding.provider,
  });
}

export async function resolveRealDeliveryZoneForCheckoutAsync(
  address: string,
  detectionMode: DeliveryZoneDetectionMode = DEFAULT_DETECTION_MODE,
): Promise<RealDeliveryZoneResult> {
  const syncResult = resolveRealDeliveryZoneForCheckout(address, detectionMode);
  return enrichRealDeliveryZoneWithRoadDistance(syncResult);
}

export function getRealDeliveryZoneColor(
  zoneId: DeliveryZoneId | null,
): string | null {
  if (!zoneId) {
    return null;
  }

  return getDeliveryZoneCatalogEntry(zoneId)?.color ?? null;
}

export function getRealDeliveryZoneStatusMessage(
  result: RealDeliveryZoneResult,
): string {
  if (result.warnings.length > 0 && result.status === "unknown") {
    return result.warnings[0] ?? "Delivery zone is unknown.";
  }

  if (result.status === "available" && result.selectedZoneId) {
    const catalogEntry = getDeliveryZoneCatalogEntry(result.selectedZoneId);

    if (catalogEntry) {
      return formatDeliveryAvailableMessage(catalogEntry);
    }

    const priceLabel =
      result.deliveryPriceRub !== null
        ? ` · ${result.deliveryPriceRub.toLocaleString("ru-RU")} ₽`
        : "";
    return `${result.selectedZoneLabel ?? "Зона доставки"}${priceLabel}`;
  }

  if (result.status === "outside_delivery_area") {
    return DELIVERY_UNAVAILABLE_MESSAGE;
  }

  if (result.status === "error") {
    return result.warnings[0] ?? "Unable to detect delivery zone.";
  }

  return (
    result.warnings[0] ??
    "Delivery zone preview is unavailable for this address yet."
  );
}

export function getRealDeliveryZoneDistanceLabel(
  result: RealDeliveryZoneResult,
): string {
  switch (result.distanceSource) {
    case "road":
      return "Road distance from MKAD";
    case "approx":
      return "Approximate distance from MKAD";
    case "none":
    default:
      return "Inside MKAD base zone";
  }
}
