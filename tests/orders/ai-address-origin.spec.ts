import { expect, test } from "@playwright/test";

// Next.js resolves this marker itself; the isolated Node tests do not run Next.
const nodeModule = require("node:module");
const originalLoad = nodeModule._load;
let POST: (request: Request) => Promise<Response>;
try {
  nodeModule._load = function (id: string, ...args: unknown[]) {
    return id === "server-only" ? {} : originalLoad.call(this, id, ...args);
  };
  ({ POST } = require("../../app/api/ai-florist-tools/route"));
} finally {
  nodeModule._load = originalLoad;
}
const { GET } = require("../../app/api/yandex-geocode/route");

async function validate(origin: string) {
  return POST(new Request(`${origin}/api/ai-florist-tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: "validate_address", params: { address: "Москва, Тверская улица, 7" } }),
  }));
}

for (const origin of ["https://branch-preview.example", "https://deployment.example"]) {
  test(`address tool uses incoming origin ${origin}, not site env or localhost`, async () => {
    const originalFetch = globalThis.fetch;
    const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      expect(url.origin).toBe(origin);
      expect(url.pathname).toBe("/api/yandex-geocode");
      expect(url.searchParams.get("geocode")).toBe("Москва, Тверская улица, 7");
      const headers = new Headers(init?.headers);
      expect(headers.get("referer")).toBe(`${origin}/ai-consultant`);
      expect(headers.get("origin")).toBe(origin);
      expect(init?.cache).toBe("no-store");
      expect(init?.signal).toBeTruthy();
      return Response.json({ provider: "yandex", results: [{
        formattedAddress: "Россия, Москва, Тверская улица, 7", latitude: 55.761, longitude: 37.612, precision: "exact",
      }] });
    };
    try {
      const result = await (await validate(origin)).json();
      expect(result).toMatchObject({ status: "ok", data: {
        provider: "yandex", validated: true, latitude: 55.761, longitude: 37.612,
      } });
    } finally {
      globalThis.fetch = originalFetch;
      if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    }
  });
}

test("fallback coordinates cannot be accepted as Yandex validation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ provider: "fallback", fallbackReason: "yandex_http_error", yandexStatus: 403,
    results: [{ formattedAddress: "Другой адрес", latitude: 55.7, longitude: 37.6 }] });
  try {
    const result = await (await validate("https://branch-preview.example")).json();
    expect(result.status).toBe("error");
    expect(result.data).toMatchObject({ provider: "fallback", validated: false, yandexStatus: 403 });
    expect(result.data.latitude).toBeUndefined();
    expect(result.data.longitude).toBeUndefined();
  } finally { globalThis.fetch = originalFetch; }
});

test("zero coordinates and upstream errors are rejected", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ provider: "yandex", results: [{ latitude: 0, longitude: 0 }] });
    expect((await (await validate("https://branch-preview.example")).json()).status).toBe("error");
    globalThis.fetch = async () => Response.json({ results: [] }, { status: 502 });
    expect((await (await validate("https://branch-preview.example")).json()).status).toBe("error");
  } finally { globalThis.fetch = originalFetch; }
});

test("proxy reports the real Yandex failure without exposing a credential", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.YANDEX_GEOCODER_API_KEY;
  process.env.YANDEX_GEOCODER_API_KEY = "test-placeholder";
  globalThis.fetch = async (input) => {
    if (new URL(String(input)).hostname === "geocode-maps.yandex.ru") {
      return Response.json({ error: "Forbidden", message: "Rejected test-placeholder" }, { status: 403 });
    }
    return Response.json([{ lat: "55.7", lon: "37.6", display_name: "Fallback address" }]);
  };
  try {
    const response = await GET(new Request("https://branch-preview.example/api/yandex-geocode?geocode=Москва"));
    const result = await response.json();
    expect(result).toMatchObject({ provider: "fallback", fallbackReason: "yandex_http_error", yandexStatus: 403,
      yandexError: "Forbidden", yandexMessage: "Rejected [REDACTED]", yandexKeyConfigured: true,
      yandexKeySource: "YANDEX_GEOCODER_API_KEY" });
    expect(JSON.stringify(result)).not.toContain("test-placeholder");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.YANDEX_GEOCODER_API_KEY;
    else process.env.YANDEX_GEOCODER_API_KEY = originalKey;
  }
});
