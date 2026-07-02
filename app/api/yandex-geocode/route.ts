// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Server proxy for official Yandex Geocoder HTTP API (geocode-maps.yandex.ru/v1).
//
// Назначение (RU):
// Серверный прокси официального HTTP API Yandex Geocoder (geocode-maps.yandex.ru/v1).
// ==================================================
import { getYandexGeocoderApiKey } from "@/components/maps/mapProviderConfig";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

type YandexGeocoderFeature = {
  GeoObject?: {
    metaDataProperty?: {
      GeocoderMetaData?: {
        precision?: string;
        text?: string;
        Address?: { formatted?: string };
      };
    };
    Point?: { pos?: string };
  };
};

type YandexGeocoderResponse = {
  response?: {
    GeoObjectCollection?: {
      featureMember?: YandexGeocoderFeature[];
    };
  };
  error?: string;
  message?: string;
};

export type YandexHttpGeocodeResult = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  precision?: string;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const geocode = requestUrl.searchParams.get("geocode")?.trim() ?? "";
  const uri = requestUrl.searchParams.get("uri")?.trim() ?? "";

  if (!uri && geocode.length < MIN_QUERY_LENGTH) {
    return Response.json(
      { results: [], error: "Query too short." },
      { status: 400 },
    );
  }

  const apiKey = getYandexGeocoderApiKey();
  if (!apiKey) {
    return Response.json(
      { results: [], error: "Yandex Geocoder API key is not configured." },
      { status: 503 },
    );
  }

  const clientReferer =
    request.headers.get("referer")?.trim() ||
    request.headers.get("origin")?.trim() ||
    requestUrl.origin;

  const yandexUrl = new URL("https://geocode-maps.yandex.ru/v1/");
  yandexUrl.searchParams.set("apikey", apiKey);
  yandexUrl.searchParams.set("format", "json");
  yandexUrl.searchParams.set("lang", "ru_RU");
  yandexUrl.searchParams.set("results", String(MAX_RESULTS));

  if (uri) {
    yandexUrl.searchParams.set("uri", uri);
  } else {
    yandexUrl.searchParams.set("geocode", geocode);
  }

  try {
    const response = await fetch(yandexUrl.toString(), {
      headers: {
        Accept: "application/json",
        Referer: clientReferer,
        Origin: safeOrigin(clientReferer),
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as YandexGeocoderResponse;

    if (!response.ok) {
      return Response.json(
        {
          results: [],
          error:
            payload.error ??
            payload.message ??
            `Yandex Geocoder HTTP ${response.status}.`,
          yandexStatus: response.status,
        },
        { status: response.status },
      );
    }

    const results = mapGeocoderPayload(payload);

    return Response.json(
      { results },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        results: [],
        error:
          error instanceof Error
            ? error.message
            : "Yandex geocode proxy request failed.",
      },
      { status: 502 },
    );
  }
}

function safeOrigin(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return referer;
  }
}

function mapGeocoderPayload(
  payload: YandexGeocoderResponse,
): YandexHttpGeocodeResult[] {
  const members =
    payload.response?.GeoObjectCollection?.featureMember?.filter(Boolean) ?? [];

  return members
    .map((member) => mapGeocoderFeature(member))
    .filter((result): result is YandexHttpGeocodeResult => result !== null);
}

function mapGeocoderFeature(
  member: YandexGeocoderFeature,
): YandexHttpGeocodeResult | null {
  const geoObject = member.GeoObject;
  const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
  const pos = geoObject?.Point?.pos?.trim();

  if (!meta || !pos) {
    return null;
  }

  const [longitudeRaw, latitudeRaw] = pos.split(/\s+/);
  const latitude = Number.parseFloat(latitudeRaw ?? "");
  const longitude = Number.parseFloat(longitudeRaw ?? "");

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const formattedAddress =
    meta.Address?.formatted?.trim() || meta.text?.trim() || "";

  if (!formattedAddress) {
    return null;
  }

  return {
    formattedAddress,
    latitude,
    longitude,
    precision: meta.precision,
  };
}
