// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Server proxy for official Yandex Geosuggest HTTP API with client Referer forwarding.
//
// Назначение (RU):
// Серверный прокси официального HTTP API Yandex Geosuggest с пробросом Referer клиента.
// ==================================================
import { getYandexGeoSuggestApiKey } from "@/components/maps/mapProviderConfig";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;
const FALLBACK_RESULTS = 5;
const KNOWN_LATIN_MOSCOW_ADDRESS_ALIASES = [
  { pattern: /\btverskaya\b/i, replacement: "Тверская" },
  { pattern: /\bprospe?kt\s+mira\b/i, replacement: "проспект Мира" },
  { pattern: /\barbat\b/i, replacement: "Арбат" },
];

type YandexSuggestPayload = {
  results?: unknown[];
  error?: string;
};

type NominatimSearchItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    square?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

type FallbackSuggestResult = {
  title: { text: string };
  subtitle?: { text: string };
  address: { formatted_address: string };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  provider: "fallback";
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const text = requestUrl.searchParams.get("text")?.trim() ?? "";

  if (text.length < MIN_QUERY_LENGTH) {
    return Response.json(
      { results: [], error: "Query too short." },
      { status: 400 },
    );
  }

  const apiKey = getYandexGeoSuggestApiKey();
  if (!apiKey) {
    const fallbackResults = await fetchFallbackSuggestResults(text);
    if (fallbackResults.length > 0) {
      return Response.json(
        { results: fallbackResults, provider: "fallback" },
        noStoreResponseInit(),
      );
    }

    return Response.json(
      { results: [], error: "Yandex GeoSuggest API key is not configured." },
      { status: 503 },
    );
  }

  const clientReferer =
    request.headers.get("referer")?.trim() ||
    request.headers.get("origin")?.trim() ||
    requestUrl.origin;

  const yandexUrl = new URL("https://suggest-maps.yandex.ru/v1/suggest");
  yandexUrl.searchParams.set("apikey", apiKey);
  yandexUrl.searchParams.set("text", text);
  yandexUrl.searchParams.set("lang", "ru_RU");
  yandexUrl.searchParams.set("results", String(MAX_RESULTS));
  yandexUrl.searchParams.set("print_address", "1");
  yandexUrl.searchParams.set("attrs", "uri");
  yandexUrl.searchParams.set("types", "geo,street,house");
  yandexUrl.searchParams.set("countries", "ru");
  yandexUrl.searchParams.set("bbox", "35.05,55.05~39.2,56.95");

  try {
    const response = await fetch(yandexUrl.toString(), {
      headers: {
        Accept: "application/json",
        Referer: clientReferer,
        Origin: safeOrigin(clientReferer),
      },
      cache: "no-store",
      // Bounds the upstream Yandex call so this route always resolves —
      // without it, a slow/stuck upstream response left the address
      // suggestions stuck loading indefinitely instead of failing over.
      signal: AbortSignal.timeout(6_000),
    });

    const payload = (await response.json().catch(() => ({}))) as YandexSuggestPayload;

    if (!response.ok) {
      const fallbackResults = await fetchFallbackSuggestResults(text);
      if (fallbackResults.length > 0) {
        return Response.json(
          {
            results: fallbackResults,
            provider: "fallback",
            fallbackReason: `Yandex Geosuggest HTTP ${response.status}.`,
          },
          noStoreResponseInit(),
        );
      }

      return Response.json(
        {
          results: [],
          error:
            payload.error ??
            `Yandex Geosuggest HTTP ${response.status}.`,
          yandexStatus: response.status,
        },
        { status: response.status },
      );
    }

    if (!Array.isArray(payload.results) || payload.results.length === 0) {
      const fallbackResults = await fetchFallbackSuggestResults(text);
      if (fallbackResults.length > 0) {
        return Response.json(
          { results: fallbackResults, provider: "fallback" },
          noStoreResponseInit(),
        );
      }
    }

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        results: [],
        error:
          error instanceof Error
            ? error.message
            : "Yandex Geosuggest proxy request failed.",
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

  return matchedKnownAlias ? `Москва, ${normalizedQuery}` : null;
}

function readFallbackCoordinate(value: string | undefined): number | null {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

function compactAddressParts(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildFallbackTitle(item: NominatimSearchItem): string {
  const address = item.address ?? {};
  const street =
    address.road ??
    address.pedestrian ??
    address.footway ??
    address.square ??
    "";
  const house = address.house_number?.trim() ?? "";

  if (street && house) {
    return `${street}, ${house}`;
  }

  if (street) {
    return street;
  }

  return compactAddressParts(item.display_name ?? "").slice(0, 2).join(", ");
}

function buildFallbackSubtitle(item: NominatimSearchItem): string {
  const address = item.address ?? {};
  return [
    address.suburb,
    address.city_district,
    address.city ?? address.town ?? address.village,
    address.state,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
}

function mapFallbackSuggestItem(
  item: NominatimSearchItem,
): FallbackSuggestResult | null {
  const formattedAddress = item.display_name?.trim() ?? "";
  const latitude = readFallbackCoordinate(item.lat);
  const longitude = readFallbackCoordinate(item.lon);
  const title = buildFallbackTitle(item);

  if (!formattedAddress || !title || latitude === null || longitude === null) {
    return null;
  }

  const subtitle = buildFallbackSubtitle(item);

  return {
    title: { text: title },
    ...(subtitle ? { subtitle: { text: subtitle } } : {}),
    address: { formatted_address: formattedAddress },
    coordinates: { latitude, longitude },
    provider: "fallback",
  };
}

async function fetchFallbackSuggestResults(
  query: string,
): Promise<FallbackSuggestResult[]> {
  const fallbackQuery = buildFallbackQuery(query);
  if (!fallbackQuery) {
    return [];
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", fallbackQuery);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", String(FALLBACK_RESULTS));
  nominatimUrl.searchParams.set("countrycodes", "ru");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "BellaFloreCheckout/1.0 (delivery address suggestions)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => [])) as NominatimSearchItem[];
    const seen = new Set<string>();

    return payload
      .map((item) => mapFallbackSuggestItem(item))
      .filter((item): item is FallbackSuggestResult => item !== null)
      .filter((item) => {
        const key = item.address.formatted_address.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
}
