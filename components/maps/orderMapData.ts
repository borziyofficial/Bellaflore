// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import type { GeocodingResult, GeocodingStatus } from "@/components/maps/geocodingTypes";
import { geocodeAddress } from "@/components/maps/geocodeAddress";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";
import { getOrderStatus } from "@/components/orders/orderStatus";

export type GeocodingOverrides = Record<string, GeocodingResult>;


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type OrderMapPoint = {
  orderId: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  geocodingStatus: GeocodingStatus;
  geocoding: GeocodingResult;
  customer: string;
  deliveryDate: string;
  deliveryInterval: string;
  courier: string | null;
  courierId: string | null;
  status: string;
};

export type MapsFoundationSummary = {
  totalDeliveryAddresses: number;
  geocodedCount: number;
  pendingCount: number;
  notFoundCount: number;
  errorCount: number;
};

export type MapsFoundationData = {
  summary: MapsFoundationSummary;
  points: OrderMapPoint[];
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isEligibleMapOrder(order: AdminOrderRecord): boolean {
  return getOrderStatus(order.status)?.id !== "CANCELLED";
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildOrderMapPoint(
  order: AdminOrderRecord,
  geocodingOverrides?: GeocodingOverrides,
): OrderMapPoint {
  const normalizedAddress = normalizeGeocodingAddress(order.deliveryAddress);
  const override = normalizedAddress
    ? geocodingOverrides?.[normalizedAddress]
    : undefined;
  const geocoding = geocodeAddress(order.deliveryAddress, { override });

  return {
    orderId: order.orderId,
    address: order.deliveryAddress.trim(),
    coordinates:
      geocoding.latitude !== null && geocoding.longitude !== null
        ? {
            latitude: geocoding.latitude,
            longitude: geocoding.longitude,
          }
        : null,
    geocodingStatus: geocoding.status,
    geocoding,
    customer: order.customerName,
    deliveryDate: order.deliveryDate,
    deliveryInterval: order.deliveryTime,
    courier: order.assignedCourierName?.trim() || null,
    courierId: order.assignedCourierId?.trim() || null,
    status: order.status,
  };
}

export function buildMapsFoundationData(
  orders: AdminOrderRecord[],
  geocodingOverrides?: GeocodingOverrides,
): MapsFoundationData {
  const points = orders
    .filter(isEligibleMapOrder)
    .map((order) => buildOrderMapPoint(order, geocodingOverrides))
    .sort((firstPoint, secondPoint) =>
      firstPoint.orderId.localeCompare(secondPoint.orderId, "ru"),
    );

  const summary: MapsFoundationSummary = {
    totalDeliveryAddresses: points.length,
    geocodedCount: points.filter((point) => point.geocodingStatus === "found")
      .length,
    pendingCount: points.filter((point) => point.geocodingStatus === "pending")
      .length,
    notFoundCount: points.filter(
      (point) => point.geocodingStatus === "not_found",
    ).length,
    errorCount: points.filter((point) => point.geocodingStatus === "error")
      .length,
  };

  return {
    summary,
    points,
  };
}

export function getGeocodingStatusLabel(status: GeocodingStatus): string {
  switch (status) {
    case "found":
      return "Found";
    case "pending":
      return "Pending";
    case "not_found":
      return "Not found";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function getGeocodingResultStatusLabel(result: GeocodingResult): string {
  if (result.fromCache) {
    return "Cached";
  }

  return getGeocodingStatusLabel(result.status);
}

export function getGeocodingResultStatusClassSuffix(
  result: GeocodingResult,
): "Found" | "Pending" | "NotFound" | "Error" | "Cached" {
  if (result.fromCache) {
    return "Cached";
  }

  switch (result.status) {
    case "found":
      return "Found";
    case "pending":
      return "Pending";
    case "error":
      return "Error";
    case "not_found":
    default:
      return "NotFound";
  }
}

export function formatMapCoordinates(
  coordinates: OrderMapPoint["coordinates"],
): string {
  if (!coordinates) {
    return "—";
  }

  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}

export function getGeocodedMapPoints(points: OrderMapPoint[]): OrderMapPoint[] {
  return points.filter((point) => point.coordinates !== null);
}

export function getNeedsGeocodingMapPoints(
  points: OrderMapPoint[],
): OrderMapPoint[] {
  return points.filter(
    (point) =>
      point.geocodingStatus === "pending" ||
      point.geocodingStatus === "not_found",
  );
}
