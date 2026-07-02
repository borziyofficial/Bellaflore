// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type MkadPolygonPoint = GeoCoordinate;

/**
 * MKAD ring polygon coordinates (clockwise, northwest to northwest).
 *
 * TODO(production-geometry): Replace with survey-grade MKAD polygon from GIS
 * import when available. Current ring is a detailed approximation — sufficient
 * for zone pricing/detection but not an official cadastral boundary.
 *
 * Debug-safe examples (comments only, not runtime fixtures):
 * - Central Moscow { latitude: 55.7558, longitude: 37.6173 } → inside MKAD → base zone
 * - Near outside MKAD north { latitude: 55.935, longitude: 37.620 } → ~7 km zone
 * - Far outside north { latitude: 56.25, longitude: 37.620 } → outside_delivery_area
 */
export const MKAD_POLYGON_COORDINATES: MkadPolygonPoint[] = [
  { latitude: 55.8267, longitude: 37.391 },
  { latitude: 55.8445, longitude: 37.418 },
  { latitude: 55.8592, longitude: 37.4455 },
  { latitude: 55.872, longitude: 37.474 },
  { latitude: 55.8835, longitude: 37.5045 },
  { latitude: 55.8928, longitude: 37.5365 },
  { latitude: 55.8998, longitude: 37.57 },
  { latitude: 55.9045, longitude: 37.605 },
  { latitude: 55.907, longitude: 37.641 },
  { latitude: 55.9072, longitude: 37.678 },
  { latitude: 55.905, longitude: 37.7155 },
  { latitude: 55.8995, longitude: 37.752 },
  { latitude: 55.8908, longitude: 37.787 },
  { latitude: 55.879, longitude: 37.8195 },
  { latitude: 55.8642, longitude: 37.8485 },
  { latitude: 55.8465, longitude: 37.872 },
  { latitude: 55.826, longitude: 37.8895 },
  { latitude: 55.8035, longitude: 37.9 },
  { latitude: 55.7798, longitude: 37.9035 },
  { latitude: 55.7558, longitude: 37.9 },
  { latitude: 55.732, longitude: 37.89 },
  { latitude: 55.7092, longitude: 37.874 },
  { latitude: 55.688, longitude: 37.8515 },
  { latitude: 55.6688, longitude: 37.8235 },
  { latitude: 55.652, longitude: 37.7905 },
  { latitude: 55.6382, longitude: 37.7535 },
  { latitude: 55.6275, longitude: 37.7135 },
  { latitude: 55.62, longitude: 37.671 },
  { latitude: 55.6158, longitude: 37.6265 },
  { latitude: 55.6148, longitude: 37.5805 },
  { latitude: 55.617, longitude: 37.5345 },
  { latitude: 55.6225, longitude: 37.4895 },
  { latitude: 55.631, longitude: 37.4465 },
  { latitude: 55.6425, longitude: 37.406 },
  { latitude: 55.657, longitude: 37.369 },
  { latitude: 55.674, longitude: 37.336 },
  { latitude: 55.693, longitude: 37.307 },
  { latitude: 55.714, longitude: 37.284 },
  { latitude: 55.7365, longitude: 37.268 },
  { latitude: 55.76, longitude: 37.259 },
  { latitude: 55.784, longitude: 37.2575 },
  { latitude: 55.8075, longitude: 37.263 },
  { latitude: 55.83, longitude: 37.276 },
  { latitude: 55.85, longitude: 37.296 },
  { latitude: 55.867, longitude: 37.322 },
  { latitude: 55.8805, longitude: 37.352 },
  { latitude: 55.89, longitude: 37.384 },
];
