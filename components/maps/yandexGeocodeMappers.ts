// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { LiveGeocoderSuggestion } from "@/components/addressIntelligence/liveGeocoderTypes";
import type {
  YandexGeocoderAddressComponent,
  YandexGeocoderMetaData,
  YandexJsGeocodeGeoObject,
} from "@/components/maps/yandexMapsApi.types";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type NormalizedYandexGeocodeFeature = {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  name?: string;
  description?: string;
  precision?: string;
  text?: string;
  components?: YandexGeocoderAddressComponent[];
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function mapPrecisionToConfidence(precision: string | undefined): number {
  switch (precision) {
    case "exact":
      return 0.95;
    case "number":
      return 0.85;
    case "near":
      return 0.75;
    case "range":
      return 0.65;
    case "street":
      return 0.55;
    default:
      return 0.5;
  }
}


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getGeocoderMetaData(
  geoObject: YandexJsGeocodeGeoObject,
): YandexGeocoderMetaData | undefined {
  const dottedMeta = geoObject.properties.get(
    "metaDataProperty.GeocoderMetaData",
  ) as YandexGeocoderMetaData | undefined;

  if (dottedMeta) {
    return dottedMeta;
  }

  const metaDataProperty = geoObject.properties.get("metaDataProperty") as
    | {
        GeocoderMetaData?: YandexGeocoderMetaData;
      }
    | YandexGeocoderMetaData
    | undefined;

  if (!metaDataProperty) {
    return undefined;
  }

  if ("GeocoderMetaData" in metaDataProperty) {
    return metaDataProperty.GeocoderMetaData;
  }

  if (
    "precision" in metaDataProperty ||
    "text" in metaDataProperty ||
    "Address" in metaDataProperty
  ) {
    return metaDataProperty;
  }

  return undefined;
}

export function normalizeJsGeoObject(
  geoObject: YandexJsGeocodeGeoObject,
): NormalizedYandexGeocodeFeature | null {
  const coordinates = geoObject.geometry.getCoordinates();
  if (!coordinates) {
    return null;
  }

  const [latitude, longitude] = coordinates;
  const meta = getGeocoderMetaData(geoObject);
  const name = geoObject.properties.get("name");
  const description = geoObject.properties.get("description");
  const addressLine = geoObject.getAddressLine?.();

  const formattedAddress =
    meta?.Address?.formatted?.trim() ||
    meta?.text?.trim() ||
    (typeof addressLine === "string" ? addressLine.trim() : "") ||
    undefined;

  return {
    latitude,
    longitude,
    formattedAddress,
    name: typeof name === "string" ? name : undefined,
    description: typeof description === "string" ? description : undefined,
    precision: meta?.precision,
    text: meta?.text,
    components: meta?.Address?.Components,
  };
}

function getAddressComponent(
  components: YandexGeocoderAddressComponent[] | undefined,
  kind: string,
): string {
  return (
    components?.find((component) => component.kind === kind)?.name?.trim() ?? ""
  );
}

function buildSuggestionId(fullAddress: string, index: number): string {
  return `yandex-${index}-${fullAddress.toLowerCase().replace(/\s+/g, "-").slice(0, 80)}`;
}

export function mapNormalizedFeatureToSuggestion(
  feature: NormalizedYandexGeocodeFeature,
  index: number,
): LiveGeocoderSuggestion | null {
  const formattedAddress =
    feature.formattedAddress ||
    [feature.description, feature.name].filter(Boolean).join(", ");

  if (!formattedAddress) {
    return null;
  }

  const components = feature.components;
  const city =
    getAddressComponent(components, "locality") ||
    getAddressComponent(components, "province") ||
    "Москва";
  const street =
    getAddressComponent(components, "street") || feature.description?.trim() || "";
  const house =
    getAddressComponent(components, "house") || feature.name?.trim() || "";

  return {
    id: buildSuggestionId(formattedAddress, index),
    label: formattedAddress,
    fullAddress: formattedAddress,
    city,
    street,
    house,
    building: getAddressComponent(components, "building") || undefined,
    corpus: getAddressComponent(components, "entrance") || undefined,
    latitude: feature.latitude,
    longitude: feature.longitude,
    confidence: mapPrecisionToConfidence(feature.precision),
    provider: "yandex",
    raw: feature.text,
  };
}

export function mapJsGeoObjectToSuggestion(
  geoObject: YandexJsGeocodeGeoObject,
  index: number,
): LiveGeocoderSuggestion | null {
  const feature = normalizeJsGeoObject(geoObject);
  if (!feature) {
    return null;
  }

  return mapNormalizedFeatureToSuggestion(feature, index);
}
