// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Delivery Intelligence Engine
//
// Purpose (EN):
// Coordinate → zone → price → status pipeline for checkout and orders.
//
// Назначение (RU):
// Цепочка координаты → зона → цена → статус для checkout и заказов.
// ==================================================
import {
  DELIVERY_UNAVAILABLE_MESSAGE,
  formatDeliveryAvailableMessage,
} from "@/components/deliveryZones/deliveryIntelligenceMessages";
import type {
  AddressCoordinates,
  DeliveryIntelligenceResult,
} from "@/components/deliveryZones/deliveryIntelligenceTypes";
import { detectDeliveryZoneByPolygon } from "@/components/deliveryZones/deliveryZonePolygonEngine";
import {
  getDeliveryZoneCatalogEntry,
  type DeliveryZoneCatalogEntry,
} from "@/components/deliveryZones/deliveryZonesCatalog";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

type DetectDeliveryIntelligenceParams = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  addressConfirmed?: boolean;
};

function buildIntelligenceFromZone(
  params: DetectDeliveryIntelligenceParams,
  point: GeoCoordinate,
  zone: DeliveryZoneCatalogEntry,
): DeliveryIntelligenceResult {
  return {
    address: params.address.trim(),
    latitude: point.latitude,
    longitude: point.longitude,
    zoneId: zone.zoneId,
    zoneTitle: zone.title,
    zoneLabel: zone.label,
    deliveryPriceRub: zone.priceRub,
    estimatedTime: zone.estimatedTime,
    deliveryStatus: "available",
    message: formatDeliveryAvailableMessage(zone),
    addressConfirmed: params.addressConfirmed ?? true,
    detectionMethod: "polygon",
  };
}

function buildOutsideResult(
  params: DetectDeliveryIntelligenceParams,
  point: GeoCoordinate | null,
): DeliveryIntelligenceResult {
  return {
    address: params.address.trim(),
    latitude: point?.latitude ?? params.latitude,
    longitude: point?.longitude ?? params.longitude,
    zoneId: null,
    zoneTitle: null,
    zoneLabel: null,
    deliveryPriceRub: null,
    estimatedTime: null,
    deliveryStatus: "outside_delivery_area",
    message: DELIVERY_UNAVAILABLE_MESSAGE,
    addressConfirmed: params.addressConfirmed ?? false,
    detectionMethod: "polygon",
  };
}

function buildUnknownResult(
  params: DetectDeliveryIntelligenceParams,
): DeliveryIntelligenceResult {
  return {
    address: params.address.trim(),
    latitude: params.latitude,
    longitude: params.longitude,
    zoneId: null,
    zoneTitle: null,
    zoneLabel: null,
    deliveryPriceRub: null,
    estimatedTime: null,
    deliveryStatus: "unknown",
    message: "Введите адрес доставки, чтобы определить зону.",
    addressConfirmed: false,
    detectionMethod: "polygon",
  };
}

export function detectDeliveryIntelligence(
  params: DetectDeliveryIntelligenceParams,
): DeliveryIntelligenceResult {
  const address = params.address.trim();

  if (!address) {
    return buildUnknownResult(params);
  }

  const latitude = params.latitude;
  const longitude = params.longitude;

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return {
      ...buildUnknownResult(params),
      message: "Координаты адреса пока недоступны.",
      addressConfirmed: false,
    };
  }

  const point: GeoCoordinate = { latitude, longitude };
  const { zone } = detectDeliveryZoneByPolygon(point);

  if (!zone) {
    return buildOutsideResult(params, point);
  }

  return buildIntelligenceFromZone(params, point, zone);
}

export function mapRealDeliveryZoneToIntelligence(
  result: RealDeliveryZoneResult,
  options?: { addressConfirmed?: boolean },
): DeliveryIntelligenceResult {
  const catalogEntry = result.selectedZoneId
    ? getDeliveryZoneCatalogEntry(result.selectedZoneId)
    : null;

  if (result.status === "available" && catalogEntry) {
    return {
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      zoneId: catalogEntry.zoneId,
      zoneTitle: catalogEntry.title,
      zoneLabel: catalogEntry.label,
      deliveryPriceRub: result.deliveryPriceRub ?? catalogEntry.priceRub,
      estimatedTime: catalogEntry.estimatedTime,
      deliveryStatus: "available",
      message: formatDeliveryAvailableMessage(catalogEntry),
      addressConfirmed: options?.addressConfirmed ?? true,
      detectionMethod: "polygon",
    };
  }

  if (result.status === "outside_delivery_area") {
    return {
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      zoneId: null,
      zoneTitle: null,
      zoneLabel: null,
      deliveryPriceRub: null,
      estimatedTime: null,
      deliveryStatus: "outside_delivery_area",
      message: DELIVERY_UNAVAILABLE_MESSAGE,
      addressConfirmed: options?.addressConfirmed ?? false,
      detectionMethod: "distance",
    };
  }

  return {
    address: result.address,
    latitude: result.latitude,
    longitude: result.longitude,
    zoneId: result.selectedZoneId,
    zoneTitle: catalogEntry?.title ?? null,
    zoneLabel: catalogEntry?.label ?? result.selectedZoneLabel,
    deliveryPriceRub: result.deliveryPriceRub,
    estimatedTime: catalogEntry?.estimatedTime ?? null,
    deliveryStatus: result.status,
    message:
      result.warnings[0] ??
      "Введите адрес доставки, чтобы определить зону.",
    addressConfirmed: options?.addressConfirmed ?? false,
    detectionMethod: "distance",
  };
}

export function buildAddressCoordinatesPayload(
  result: Pick<RealDeliveryZoneResult, "latitude" | "longitude">,
): AddressCoordinates | undefined {
  if (
    result.latitude === null ||
    result.longitude === null ||
    !Number.isFinite(result.latitude) ||
    !Number.isFinite(result.longitude)
  ) {
    return undefined;
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export function getDeliveryZoneTitleById(
  zoneId: DeliveryZoneId | null,
): string | null {
  if (!zoneId) {
    return null;
  }

  return getDeliveryZoneCatalogEntry(zoneId)?.title ?? null;
}
