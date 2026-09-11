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
const KNOWN_LATIN_MOSCOW_ADDRESS_ALIASES = [
  { pattern: /\btverskaya\b/i, replacement: "Тверская" },
  { pattern: /\bprospe?kt\s+mira\b/i, replacement: "проспект Мира" },
  { pattern: /\barbat\b/i, replacement: "Арбат" },
];

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

type NominatimSearchItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

type NominatimReverseResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
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
    const fallbackResults = uri ? [] : await fetchFallbackGeocodeResults(geocode);
    if (fallbackResults.length > 0) {
      return Response.json(
        { results: fallbackResults, provider: "fallback" },
        noStoreResponseInit(),
      );
    }

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
      // Bounds the upstream Yandex call so this route always resolves —
      // without it, a slow/stuck upstream response left checkout stuck on
      // "Проверяем адрес…" indefinitely instead of failing over cleanly.
      signal: AbortSignal.timeout(6_000),
    });

    const payload = (await response.json().catch(() => ({}))) as YandexGeocoderResponse;

    if (!response.ok) {
      const fallbackResults = uri ? [] : await fetchFallbackGeocodeResults(geocode);
      if (fallbackResults.length > 0) {
        return Response.json(
          { results: fallbackResults, provider: "fallback" },
          noStoreResponseInit(),
        );
      }

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
    if (results.length === 0 && !uri) {
      const fallbackResults = await fetchFallbackGeocodeResults(geocode);
      if (fallbackResults.length > 0) {
        return Response.json(
          { results: fallbackResults, provider: "fallback" },
          noStoreResponseInit(),
        );
      }
    }

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

function noStoreResponseInit(): ResponseInit {
  return {
    headers: {
      "Cache-Control": "no-store",
    },
  };
}

function safeOrigin(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return referer;
  }
}

function parseCoordinateQuery(
  query: string,
): { latitude: number; longitude: number } | null {
  const match = query.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  );

  if (!match) {
    return null;
  }

  const longitude = Number.parseFloat(match[1] ?? "");
  const latitude = Number.parseFloat(match[2] ?? "");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function buildFallbackQuery(query: string): string | null {
  const trimmedQuery = query.trim();

  if (!/[a-z]/i.test(trimmedQuery)) {
    return /(?:^|[\s,])москва(?:[\s,]|$)/i.test(trimmedQuery)
      ? trimmedQuery
      : `Москва, ${trimmedQuery}`;
  }

  let normalizedQuery = trimmedQuery;
  let matchedKnownAlias = false;
  for (const alias of KNOWN_LATIN_MOSCOW_ADDRESS_ALIASES) {
    if (!alias.pattern.test(normalizedQuery)) {
      continue;
    }

    normalizedQuery = normalizedQuery.replace(alias.pattern, alias.replacement);
    matchedKnownAlias = true;
  }

  if (!matchedKnownAlias) {
    return null;
  }

  return /(?:^|[\s,])москва(?:[\s,]|$)/i.test(normalizedQuery)
    ? normalizedQuery
    : `Москва, ${normalizedQuery}`;
}

function readFallbackCoordinate(value: string | undefined): number | null {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function mapFallbackGeocodeItem(
  item: NominatimSearchItem,
): YandexHttpGeocodeResult | null {
  const formattedAddress = item.display_name?.trim() ?? "";
  const latitude = readFallbackCoordinate(item.lat);
  const longitude = readFallbackCoordinate(item.lon);

  if (!formattedAddress || latitude === null || longitude === null) {
    return null;
  }

  return {
    formattedAddress,
    latitude,
    longitude,
    precision: "other",
  };
}

async function fetchFallbackReverseGeocode(
  latitude: number,
  longitude: number,
): Promise<YandexHttpGeocodeResult[]> {
  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatimUrl.searchParams.set("lat", String(latitude));
  nominatimUrl.searchParams.set("lon", String(longitude));
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("zoom", "18");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "BellaFloreCheckout/1.0 (delivery address reverse geocode)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => ({}))) as NominatimReverseResult;
    const mapped = mapFallbackGeocodeItem(payload);
    return mapped ? [mapped] : [];
  } catch {
    return [];
  }
}

async function fetchFallbackSearchGeocode(
  query: string,
): Promise<YandexHttpGeocodeResult[]> {
  const fallbackQuery = buildFallbackQuery(query);
  if (!fallbackQuery) {
    return [];
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", fallbackQuery);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", String(MAX_RESULTS));
  nominatimUrl.searchParams.set("countrycodes", "ru");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "BellaFloreCheckout/1.0 (delivery address geocode)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => [])) as NominatimSearchItem[];
    return payload
      .map((item) => mapFallbackGeocodeItem(item))
      .filter((item): item is YandexHttpGeocodeResult => item !== null);
  } catch {
    return [];
  }
}

async function fetchFallbackGeocodeResults(
  query: string,
): Promise<YandexHttpGeocodeResult[]> {
  const coordinates = parseCoordinateQuery(query);
  if (coordinates) {
    return fetchFallbackReverseGeocode(
      coordinates.latitude,
      coordinates.longitude,
    );
  }

  return fetchFallbackSearchGeocode(query);
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
