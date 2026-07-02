// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Reverse geocode (Yandex production)
// ==================================================
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import { fetchYandexGeocodeViaApiProxy } from "@/components/maps/yandexHttpGeocoder";
import { iterateGeoObjects } from "@/components/maps/yandexJsGeocoder";

export type ReverseGeocodeStatus = "found" | "error";

export type ReverseGeocodeResult = {
  latitude: number;
  longitude: number;
  status: ReverseGeocodeStatus;
  address: string | null;
};

export type MapClickCoordinates = {
  latitude: number;
  longitude: number;
};

export function parseYandexMapClickCoordinates(
  coords: unknown,
): MapClickCoordinates | null {
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const latitude = Number(coords[0]);
  const longitude = Number(coords[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function extractAddressFromGeoObject(geoObject: {
  getAddressLine?: () => string;
  properties: { get: (key: string) => unknown };
}): string | null {
  const addressLine = geoObject.getAddressLine?.();
  if (typeof addressLine === "string" && addressLine.trim()) {
    return addressLine.trim();
  }

  const meta = geoObject.properties.get("metaDataProperty.GeocoderMetaData") as
    | { text?: string; Address?: { formatted?: string } }
    | undefined;
  const formatted = meta?.Address?.formatted ?? meta?.text;
  return typeof formatted === "string" && formatted.trim() ? formatted.trim() : null;
}

export async function reverseGeocodeFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      latitude,
      longitude,
      status: "error",
      address: null,
    };
  }

  try {
    const httpResults = await fetchYandexGeocodeViaApiProxy(
      `${longitude},${latitude}`,
    );

    if (httpResults[0]?.formattedAddress) {
      return {
        latitude,
        longitude,
        status: "found",
        address: httpResults[0].formattedAddress,
      };
    }
  } catch {
    // fall through to SDK
  }

  try {
    const ymaps = await loadConfiguredYandexMapsSdk();
    await new Promise<void>((resolve) => {
      ymaps.ready(() => resolve());
    });

    const raw = await ymaps.geocode(`${longitude},${latitude}`, { results: 1 });
    const geoObjects = iterateGeoObjects(raw);
    const first = geoObjects[0];
    const address = first ? extractAddressFromGeoObject(first) : null;

    if (address) {
      return {
        latitude,
        longitude,
        status: "found",
        address,
      };
    }
  } catch {
    // handled below
  }

  return {
    latitude,
    longitude,
    status: "error",
    address: null,
  };
}
