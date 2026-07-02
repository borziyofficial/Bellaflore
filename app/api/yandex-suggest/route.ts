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
    });

    const payload = (await response.json().catch(() => ({}))) as {
      results?: unknown[];
      error?: string;
    };

    if (!response.ok) {
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

function safeOrigin(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return referer;
  }
}
