// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Визуальная палитра карты зон (Yandex polygons only)
//
// Purpose (EN): Zone fill/border colors are derived from each zone's own
// `color` field in the catalog (components/deliveryZones/deliveryZonesCatalog.ts)
// — the single source of truth an administrator edits. There is no separate
// hardcoded color table here anymore: keeping one would let Admin edits and
// the map disagree, exactly the "parallel/incompatible system" this project
// explicitly avoids. Border color is derived automatically (a darker shade
// of the fill color) so admins only pick one color per zone, as specified.
//
// Назначение (RU): Цвет заливки/границы зоны берётся из поля `color` самой
// зоны в каталоге (components/deliveryZones/deliveryZonesCatalog.ts) —
// едином источнике, который редактирует администратор. Отдельной жёстко
// заданной таблицы цветов здесь больше нет — иначе правки в админке и карта
// могли бы разойтись. Цвет границы вычисляется автоматически (более тёмный
// оттенок заливки), поэтому администратор выбирает только один цвет на зону.
// ==================================================
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZonesCatalog";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

// ~20-25% fill opacity so Yandex map roads/labels stay legible under the
// zone shading; selected zone gets a bit more so it stands out. Per-zone
// opacity (zone.fillOpacity) is admin-editable and takes precedence — these
// remain only as the built-in default (see DEFAULT_DELIVERY_ZONE_FILL_OPACITY
// in deliveryZonesCatalog.ts, which this matches).
export const DELIVERY_ZONE_MAP_FILL_OPACITY = 0.22;
export const DELIVERY_ZONE_MAP_SELECTED_FILL_OPACITY_BOOST = 0.08;
export const DELIVERY_ZONE_MAP_STROKE_WIDTH = 2;
export const DELIVERY_ZONE_MAP_STROKE_OPACITY = 0.72;
export const DELIVERY_ZONE_MAP_SELECTED_STROKE_OPACITY = 0.88;

/** Darkens a "#rrggbb" color by `amount` (0–1) towards black. Falls back to
 * the input unchanged if it isn't a recognizable hex color. */
export function darkenHexColor(hex: string, amount: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) {
    return hex;
  }
  const value = match[1]!;
  const clampedAmount = Math.min(Math.max(amount, 0), 1);
  const channel = (start: number) => {
    const original = parseInt(value.slice(start, start + 2), 16);
    const darkened = Math.round(original * (1 - clampedAmount));
    return Math.min(Math.max(darkened, 0), 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

export function getDeliveryZoneMapDisplayColor(zoneId: DeliveryZoneId): string {
  return getDeliveryZoneCatalogEntry(zoneId)?.color ?? "#999999";
}

export function getDeliveryZoneMapBorderColor(zoneId: DeliveryZoneId): string {
  return darkenHexColor(getDeliveryZoneMapDisplayColor(zoneId), 0.24);
}

export function getDeliveryZoneMapFillOpacity(zoneId: DeliveryZoneId): number {
  return (
    getDeliveryZoneCatalogEntry(zoneId)?.fillOpacity ??
    DELIVERY_ZONE_MAP_FILL_OPACITY
  );
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
