// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Server proxy for Nominatim geocoding when Yandex Geocoder is unavailable.
//
// Назначение (RU):
// Серверный прокси Nominatim для геокодирования, когда Yandex Geocoder недоступен.
// ==================================================
const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 1;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json(
      { results: [], error: "Query too short." },
      { status: 400 },
    );
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", String(MAX_RESULTS));
  nominatimUrl.searchParams.set("countrycodes", "ru");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "BellaFloreCheckout/1.0 (delivery address validation)",
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => [])) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    if (!response.ok) {
      return Response.json(
        { results: [], error: `Nominatim HTTP ${response.status}.` },
        { status: response.status },
      );
    }

    const results = payload
      .map((item) => {
        const latitude = Number.parseFloat(item.lat ?? "");
        const longitude = Number.parseFloat(item.lon ?? "");
        const formattedAddress = item.display_name?.trim() ?? "";

        if (
          !formattedAddress ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          formattedAddress,
          latitude,
          longitude,
          precision: "other",
        };
      })
      .filter(
        (
          result,
        ): result is {
          formattedAddress: string;
          latitude: number;
          longitude: number;
          precision: string;
        } => result !== null,
      );

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
            : "Nominatim geocode proxy request failed.",
      },
      { status: 502 },
    );
  }
}
