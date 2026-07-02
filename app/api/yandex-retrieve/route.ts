// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Server proxy for Yandex Geosuggest retrieve by uri to resolve coordinates.
//
// Назначение (RU):
// Серверный прокси Yandex Geosuggest retrieve по uri для получения координат.
// ==================================================
import { getYandexGeocoderApiKey } from "@/components/maps/mapProviderConfig";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const uri = requestUrl.searchParams.get("uri")?.trim() ?? "";

  if (!uri) {
    return Response.json(
      { result: null, error: "Uri is required." },
      { status: 400 },
    );
  }

  const apiKey = getYandexGeocoderApiKey();

  const clientReferer =
    request.headers.get("referer")?.trim() ||
    request.headers.get("origin")?.trim() ||
    requestUrl.origin;

  const endpoints = [
    {
      url: "https://geocode-maps.yandex.ru/v1/",
      params: { uri, lang: "ru_RU", format: "json", results: "1" },
    },
    {
      url: "https://geocode-maps.yandex.ru/1.x/",
      params: { uri, lang: "ru_RU", format: "json", results: "1" },
    },
  ];

  if (!apiKey) {
    return Response.json(
      { result: null, error: "Yandex API keys are not configured." },
      { status: 503 },
    );
  }

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    const yandexUrl = new URL(endpoint.url);
    yandexUrl.searchParams.set("apikey", apiKey);
    for (const [key, value] of Object.entries(endpoint.params)) {
      yandexUrl.searchParams.set(key, value);
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

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          errors.push(`${endpoint.url}: HTTP ${response.status}`);
          continue;
        }

        const resolved = extractCoordinates(payload);
        if (resolved) {
          return Response.json(
            { result: resolved },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        errors.push(`${endpoint.url}: no coordinates in payload`);
      } catch (error) {
        errors.push(
          `${endpoint.url}: ${
            error instanceof Error ? error.message : "request failed"
          }`,
        );
      }
    }

  return Response.json(
    {
      result: null,
      error: errors.join(" | "),
    },
    { status: 502 },
  );
}

function safeOrigin(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return referer;
  }
}

function extractCoordinates(payload: unknown): {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  precision?: string;
} | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;

  const geocoderMembers =
    (
      root.response as
        | {
            GeoObjectCollection?: {
              featureMember?: Array<{
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
              }>;
            };
          }
        | undefined
    )?.GeoObjectCollection?.featureMember ?? [];

  for (const member of geocoderMembers) {
    const resolved = mapPointToResult(member.GeoObject);
    if (resolved) {
      return resolved;
    }
  }

  const retrieveResult = root.result;
  if (retrieveResult && typeof retrieveResult === "object") {
    const resolved = mapPointToResult(
      retrieveResult as {
        metaDataProperty?: {
          GeocoderMetaData?: {
            precision?: string;
            text?: string;
            Address?: { formatted?: string };
          };
        };
        Point?: { pos?: string };
        address?: { formatted_address?: string };
        title?: { text?: string };
      },
    );
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function mapPointToResult(geoObject: {
  metaDataProperty?: {
    GeocoderMetaData?: {
      precision?: string;
      text?: string;
      Address?: { formatted?: string };
    };
  };
  Point?: { pos?: string };
  address?: { formatted_address?: string };
  title?: { text?: string };
} | null | undefined) {
  if (!geoObject?.Point?.pos) {
    return null;
  }

  const [longitudeRaw, latitudeRaw] = geoObject.Point.pos.trim().split(/\s+/);
  const latitude = Number.parseFloat(latitudeRaw ?? "");
  const longitude = Number.parseFloat(longitudeRaw ?? "");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const meta = geoObject.metaDataProperty?.GeocoderMetaData;
  const formattedAddress =
    meta?.Address?.formatted?.trim() ||
    geoObject.address?.formatted_address?.trim() ||
    meta?.text?.trim() ||
    geoObject.title?.text?.trim() ||
    "";

  if (!formattedAddress) {
    return null;
  }

  return {
    formattedAddress,
    latitude,
    longitude,
    precision: meta?.precision,
  };
}
