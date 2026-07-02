// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Визуальная палитра карты зон (Yandex polygons only)
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

/** Premium map palette — display only. */
export const DELIVERY_ZONE_MAP_DISPLAY_COLORS: Record<DeliveryZoneId, string> = {
  base: "#5CB176",
  "7km": "#F28B82",
  "14km": "#F6AD55",
  "21km": "#FFD166",
  "28km": "#FFE08A",
  "38km": "#D5DFE6",
  "48km": "#E8EEF2",
};

export const DELIVERY_ZONE_MAP_BORDER_COLORS: Record<DeliveryZoneId, string> = {
  base: "#6FAF84",
  "7km": "#E57373",
  "14km": "#F4A261",
  "21km": "#F2C94C",
  "28km": "#F7D774",
  "38km": "#B8C5CE",
  "48km": "#C8D3DB",
};

export const DELIVERY_ZONE_MAP_FILL_OPACITY = 0.34;
export const DELIVERY_ZONE_MAP_SELECTED_FILL_OPACITY = 0.38;
export const DELIVERY_ZONE_MAP_STROKE_WIDTH = 2;
export const DELIVERY_ZONE_MAP_STROKE_OPACITY = 0.72;
export const DELIVERY_ZONE_MAP_SELECTED_STROKE_OPACITY = 0.88;

export function getDeliveryZoneMapDisplayColor(zoneId: DeliveryZoneId): string {
  return DELIVERY_ZONE_MAP_DISPLAY_COLORS[zoneId];
}

export function getDeliveryZoneMapBorderColor(zoneId: DeliveryZoneId): string {
  return DELIVERY_ZONE_MAP_BORDER_COLORS[zoneId];
}

export function reversePolygonRing(ring: GeoCoordinate[]): GeoCoordinate[] {
  return [...ring].reverse();
}

export function buildZoneRingCoordinates(
  outerRing: GeoCoordinate[],
  innerRing: GeoCoordinate[] | null,
): GeoCoordinate[][] {
  if (!innerRing || innerRing.length === 0) {
    return [outerRing.map((point) => ({ ...point }))];
  }

  return [
    outerRing.map((point) => ({ ...point })),
    reversePolygonRing(innerRing).map((point) => ({ ...point })),
  ];
}
