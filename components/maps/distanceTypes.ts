// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for maps.
//
// Назначение (RU): Определения типов для maps.
// ==================================================
export type DistanceCalculationMethod = "straight_line" | "provider";

export type DistanceLegStatus = "calculated" | "missing_coordinates" | "error";

export type DistanceLeg = {
  fromOrderId: string;
  toOrderId: string;
  fromAddress: string;
  toAddress: string;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  method: DistanceCalculationMethod;
  status: DistanceLegStatus;
  updatedAt: string;
};

export type CourierRouteDistancePlan = {
  courierId: string;
  courierName: string;
  legs: DistanceLeg[];
  totalDistanceKm: number | null;
  totalEstimatedMinutes: number | null;
  missingCoordinateCount: number;
};

export type RouteDistancePlanSummary = {
  courierCount: number;
  totalActiveLegs: number;
  calculatedLegs: number;
  missingCoordinateLegs: number;
  totalDistanceKm: number | null;
  totalEstimatedMinutes: number | null;
};

export type RouteDistancePlan = {
  courierPlans: CourierRouteDistancePlan[];
  summary: RouteDistancePlanSummary;
};

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};
