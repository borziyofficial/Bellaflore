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
import {
  buildRussianAddressQueryVariants,
  transliterateLatinAddressToRussian,
} from "@/components/maps/latinAddressTransliteration";

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 10;
const FALLBACK_RESULTS = 5;
// Upstream budgets are deliberately short. This route chains at most two
// upstream calls (Yandex, then the OSM fallback), and the browser hook caps
// the whole pipeline at 7s, so neither call may linger.
const UPSTREAM_TIMEOUT_MS = 2_500;

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

type RequestedFallbackTitle = {
  title: string;
  streetTokens: string[];
  house: string;
};

async function fetchYandexSuggestPayload(
  apiKey: string,
  text: string,
  clientReferer: string,
): Promise<{ ok: boolean; status: number; payload: YandexSuggestPayload }> {
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
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as YandexSuggestPayload;

  return { ok: response.ok, status: response.status, payload };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const text = requestUrl.searchParams.get("text")?.trim() ?? "";

  if (text.length < MIN_QUERY_LENGTH) {
    return Response.json(
      { results: [], error: "Query too short." },
      { status: 400 },
    );
  }

  // Cyrillic is the supported flow. Latin / transliterated input is
  // best-effort: it is converted to its Russian form once and queried once —
  // every upstream here runs with lang=ru_RU and returns nothing for Latin
  // street names, so retrying the raw Latin text only burns the time budget.
  const queryVariants = buildRussianAddressQueryVariants(text).slice(0, 1);

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

  let lastFailureStatus: number | null = null;
  let lastFailureMessage: string | null = null;

  for (const queryVariant of queryVariants) {
    try {
      const { ok, status, payload } = await fetchYandexSuggestPayload(
        apiKey,
        queryVariant,
        clientReferer,
      );

      if (!ok) {
        lastFailureStatus = status;
        lastFailureMessage =
          payload.error ?? `Yandex Geosuggest HTTP ${status}.`;
        continue;
      }

      if (Array.isArray(payload.results) && payload.results.length > 0) {
        return Response.json(payload, noStoreResponseInit());
      }
    } catch (error) {
      lastFailureStatus = 502;
      lastFailureMessage =
        error instanceof Error
          ? error.message
          : "Yandex Geosuggest proxy request failed.";
    }
  }

  const fallbackResults = await fetchFallbackSuggestResults(text);
  if (fallbackResults.length > 0) {
    return Response.json(
      {
        results: fallbackResults,
        provider: "fallback",
        ...(lastFailureMessage ? { fallbackReason: lastFailureMessage } : {}),
      },
      noStoreResponseInit(),
    );
  }

  // Every upstream failed outright — surface it as an error so the client can
  // retry through its SDK layers instead of telling the customer "not found".
  if (lastFailureMessage) {
    return Response.json(
      {
        results: [],
        error: lastFailureMessage,
        ...(lastFailureStatus ? { yandexStatus: lastFailureStatus } : {}),
      },
      { status: lastFailureStatus ?? 502 },
    );
  }

  // Every upstream answered successfully and none of them knows this address.
  // `exhausted` lets the client stop immediately with a definitive
  // "address not found" instead of grinding through more fallback layers.
  return Response.json({ results: [], exhausted: true }, noStoreResponseInit());
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

  if (!trimmedQuery) {
    return null;
  }

  // Generic transliteration replaces the old three-street alias whitelist,
  // so arbitrary Latin input ("Palekhskaya street 17") reaches the fallback
  // geocoder as "Палехская улица 17" instead of being dropped.
  const normalizedQuery = transliterateLatinAddressToRussian(trimmedQuery);

  if (!normalizedQuery) {
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

function compactAddressParts(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeFallbackAddressToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackStreetTokens(street: string): string[] {
  const stopWords = new Set([
    "д",
    "дом",
    "пр",
    "проспект",
    "ул",
    "улица",
  ]);

  return normalizeFallbackAddressToken(street)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function stripLeadingMoscowParts(query: string): string {
  let normalizedQuery = query.trim();

  while (/^(?:москва|moscow)\s*,\s*/i.test(normalizedQuery)) {
    normalizedQuery = normalizedQuery.replace(
      /^(?:москва|moscow)\s*,\s*/i,
      "",
    );
  }

  return normalizedQuery;
}

function buildRequestedFallbackTitle(
  fallbackQuery: string,
): RequestedFallbackTitle | null {
  const queryBody = stripLeadingMoscowParts(fallbackQuery);
  const match = queryBody.match(/^(.+?)\s*,?\s*(\d+[^\s,]*)\s*$/iu);
  const street = match?.[1]?.trim() ?? "";
  const house = match?.[2]?.trim() ?? "";

  if (!street || !house) {
    return null;
  }

  const streetTokens = buildFallbackStreetTokens(street);
  if (streetTokens.length === 0) {
    return null;
  }

  return {
    title: `${street}, ${house}`,
    streetTokens,
    house: normalizeFallbackAddressToken(house),
  };
}

function formattedAddressMatchesRequestedTitle(
  formattedAddress: string,
  requestedTitle: RequestedFallbackTitle,
): boolean {
  const formattedTokens = new Set(
    normalizeFallbackAddressToken(formattedAddress).split(" ").filter(Boolean),
  );

  return (
    requestedTitle.streetTokens.every((token) => formattedTokens.has(token)) &&
    formattedTokens.has(requestedTitle.house)
  );
}

function buildFallbackTitle(
  item: NominatimSearchItem,
  requestedTitle: RequestedFallbackTitle | null,
): string {
  if (
    requestedTitle &&
    formattedAddressMatchesRequestedTitle(
      item.display_name ?? "",
      requestedTitle,
    )
  ) {
    return requestedTitle.title;
  }

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
  requestedTitle: RequestedFallbackTitle | null,
): FallbackSuggestResult | null {
  const formattedAddress = item.display_name?.trim() ?? "";
  const latitude = readFallbackCoordinate(item.lat);
  const longitude = readFallbackCoordinate(item.lon);
  const title = buildFallbackTitle(item, requestedTitle);

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
  const requestedTitle = buildRequestedFallbackTitle(fallbackQuery);

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
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => [])) as NominatimSearchItem[];
    const seen = new Set<string>();

    return payload
      .map((item) => mapFallbackSuggestItem(item, requestedTitle))
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
