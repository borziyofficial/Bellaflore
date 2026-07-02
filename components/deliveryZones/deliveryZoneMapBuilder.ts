// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Карта зон
//
// Purpose (EN): Build map layers from admin-ready zone catalog polygons.
//
// Назначение (RU): Сборка слоёв карты из полигонов каталога зон.
// ==================================================
import { DELIVERY_ZONES_CATALOG } from "@/components/deliveryZones/deliveryZoneConfig";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type {
  BuildDeliveryZoneMapModelParams,
  DeliveryZoneMapLayer,
  DeliveryZoneMapLegendItem,
  DeliveryZoneMapModel,
} from "@/components/deliveryZones/deliveryZoneMapTypes";
import { mapRealZoneStatusToMapAvailability } from "@/components/deliveryZones/deliveryZoneMapTypes";
import { buildDeliveryZoneMapRingCoordinates } from "@/components/deliveryZones/deliveryZoneMapRingGeometry";
import {
  DELIVERY_ZONE_MAP_FILL_OPACITY,
  DELIVERY_ZONE_MAP_SELECTED_FILL_OPACITY,
  DELIVERY_ZONE_MAP_SELECTED_STROKE_OPACITY,
  DELIVERY_ZONE_MAP_STROKE_OPACITY,
  DELIVERY_ZONE_MAP_STROKE_WIDTH,
  getDeliveryZoneMapBorderColor,
  getDeliveryZoneMapDisplayColor,
} from "@/components/deliveryZones/deliveryZoneMapVisualFoundation";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

const MOSCOW_MAP_CENTER: GeoCoordinate = {
  latitude: 55.7558,
  longitude: 37.6173,
};

function buildLegendItems(
  selectedZoneId: DeliveryZoneId | null,
  zoneAvailability: ReturnType<typeof mapRealZoneStatusToMapAvailability>,
): DeliveryZoneMapLegendItem[] {
  return DELIVERY_ZONES_CATALOG.filter((zone) => zone.isActive).map((zone) => ({
    zoneId: zone.zoneId,
    label: zone.label,
    color: getDeliveryZoneMapDisplayColor(zone.zoneId),
    priceRub: zone.priceRub,
    maxDistanceFromBaseKm: zone.maxDistanceFromBaseKm,
    availability:
      selectedZoneId === zone.zoneId ? zoneAvailability : "available",
    isSelected: selectedZoneId === zone.zoneId,
    isBaseZone: zone.isBaseZone,
  }));
}

function buildZoneLayers(selectedZoneId: DeliveryZoneId | null): DeliveryZoneMapLayer[] {
  const activeZones = DELIVERY_ZONES_CATALOG.filter(
    (zone) => zone.isActive && !zone.isBaseZone,
  ).sort((left, right) => left.sortOrder - right.sortOrder);

  return activeZones
    .map((zone) => {
      const isSelected = selectedZoneId === zone.zoneId;
      const ringCoordinates = buildDeliveryZoneMapRingCoordinates(zone.zoneId);

      if (!ringCoordinates) {
        return null;
      }

      return {
        zoneId: zone.zoneId,
        label: zone.label,
        color: getDeliveryZoneMapDisplayColor(zone.zoneId),
        borderColor: getDeliveryZoneMapBorderColor(zone.zoneId),
        priceRub: zone.priceRub,
        maxDistanceFromBaseKm: zone.maxDistanceFromBaseKm,
        polygonCoordinates: ringCoordinates[0]!.map((point) => ({ ...point })),
        ringCoordinates,
        strokeWidth: DELIVERY_ZONE_MAP_STROKE_WIDTH,
        fillOpacity: isSelected
          ? DELIVERY_ZONE_MAP_SELECTED_FILL_OPACITY
          : DELIVERY_ZONE_MAP_FILL_OPACITY,
        strokeOpacity: isSelected
          ? DELIVERY_ZONE_MAP_SELECTED_STROKE_OPACITY
          : DELIVERY_ZONE_MAP_STROKE_OPACITY,
        isSelected,
        sortOrder: zone.sortOrder,
      };
    })
    .filter((layer): layer is DeliveryZoneMapLayer => layer !== null)
    .sort((left, right) => right.sortOrder - left.sortOrder);
}

export function buildDeliveryZoneMapModel(
  params: BuildDeliveryZoneMapModelParams,
): DeliveryZoneMapModel {
  const zoneStatus = params.zoneStatus ?? "unknown";
  const zoneAvailability = mapRealZoneStatusToMapAvailability(zoneStatus);
  const marker = params.marker ?? null;
  const center = marker ?? MOSCOW_MAP_CENTER;

  return {
    center,
    defaultZoom: marker ? 11 : 10,
    layers: buildZoneLayers(params.selectedZoneId),
    legend: buildLegendItems(params.selectedZoneId, zoneAvailability),
    marker,
    selectedZoneId: params.selectedZoneId,
    zoneStatus,
    usesYandexMap: params.usesYandexMap ?? false,
  };
}

export function getDeliveryZoneMapBounds(
  model: DeliveryZoneMapModel,
): GeoCoordinate[] {
  const points = model.layers.flatMap((layer) => layer.polygonCoordinates);

  if (model.marker) {
    points.push({
      latitude: model.marker.latitude,
      longitude: model.marker.longitude,
    });
  }

  return points;
}

export function formatDeliveryZoneMapDistanceLabel(
  maxDistanceFromBaseKm: number,
  isBaseZone: boolean,
): string {
  if (isBaseZone) {
    return "Inside MKAD";
  }

  return `Up to ${maxDistanceFromBaseKm} km from MKAD`;
}
