// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Loads the official Yandex Maps JavaScript API with Maps and GeoSuggest keys.
//
// Назначение (RU):
// Загружает официальный JavaScript API Яндекс.Карт с ключами Maps и GeoSuggest.
// ==================================================
import {
  getYandexGeoSuggestApiKey,
  getYandexMapsApiKey,
} from "@/components/maps/mapProviderConfig";
import type { YandexMapsApi } from "@/components/maps/yandexMapsApi.types";

const YANDEX_MAPS_SCRIPT_ID = "bellaflore-yandex-maps-sdk";
const YANDEX_MAPS_API_READY_TIMEOUT_MS = 10_000;
const YANDEX_MAPS_API_READY_POLL_MS = 50;

export type YandexMapsSdkLoadOptions = {
  apiKey: string;
  suggestApiKey?: string;
};

let loadPromise: Promise<YandexMapsApi> | null = null;
let loadedOptionsKey: string | null = null;

function redactYandexMapsSdkUrl(url: string): string {
  if (!url) {
    return "unknown";
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.searchParams.has("apikey")) {
      parsedUrl.searchParams.set("apikey", "<redacted>");
    }
    if (parsedUrl.searchParams.has("suggest_apikey")) {
      parsedUrl.searchParams.set("suggest_apikey", "<redacted>");
    }
    return parsedUrl.toString();
  } catch {
    return "unreadable";
  }
}

function waitForYandexMapsApi(scriptUrl?: string): Promise<YandexMapsApi> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let readyTimerId: number | null = null;
    let pollTimerId: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (readyTimerId !== null) {
        window.clearTimeout(readyTimerId);
      }
      if (pollTimerId !== null) {
        window.clearTimeout(pollTimerId);
      }
    };

    const fail = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(
        new Error(
          `Yandex Maps SDK loaded but window.ymaps was not created. SDK URL: ${redactYandexMapsSdkUrl(
            scriptUrl ?? getExistingScript()?.src ?? "",
          )}`,
        ),
      );
    };

    const waitForReady = (ymaps: YandexMapsApi) => {
      readyTimerId = window.setTimeout(fail, YANDEX_MAPS_API_READY_TIMEOUT_MS);
      ymaps.ready(() => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        resolve(ymaps);
      });
    };

    const pollForGlobal = () => {
      const ymaps = window.ymaps;

      if (ymaps) {
        waitForReady(ymaps);
        return;
      }

      if (Date.now() - startedAt >= YANDEX_MAPS_API_READY_TIMEOUT_MS) {
        fail();
        return;
      }

      pollTimerId = window.setTimeout(
        pollForGlobal,
        YANDEX_MAPS_API_READY_POLL_MS,
      );
    };

    pollForGlobal();
  });
}

function buildLoadOptionsKey(options: YandexMapsSdkLoadOptions): string {
  return `${options.apiKey.trim()}::${options.suggestApiKey?.trim() ?? ""}`;
}

function buildYandexMapsSdkUrl(options: YandexMapsSdkLoadOptions): string {
  const params = new URLSearchParams({
    apikey: options.apiKey.trim(),
    lang: "ru_RU",
  });

  const suggestApiKey = options.suggestApiKey?.trim();
  if (suggestApiKey) {
    params.set("suggest_apikey", suggestApiKey);
  }

  return `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
}

function getExistingScript(): HTMLScriptElement | null {
  return document.getElementById(
    YANDEX_MAPS_SCRIPT_ID,
  ) as HTMLScriptElement | null;
}

function existingScriptMatchesOptions(
  script: HTMLScriptElement,
  options: YandexMapsSdkLoadOptions,
): boolean {
  try {
    const url = new URL(script.src);
    const expectedSuggestKey = options.suggestApiKey?.trim() ?? "";
    const actualSuggestKey = url.searchParams.get("suggest_apikey")?.trim() ?? "";

    return (
      url.searchParams.get("apikey")?.trim() === options.apiKey.trim() &&
      actualSuggestKey === expectedSuggestKey
    );
  } catch {
    return false;
  }
}

function teardownYandexMapsSdk(): void {
  loadPromise = null;
  loadedOptionsKey = null;
  getExistingScript()?.remove();

  if (window.ymaps) {
    delete window.ymaps;
  }
}

export function loadYandexMapsSdk(
  options: YandexMapsSdkLoadOptions,
): Promise<YandexMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Yandex Maps SDK can only be loaded on the client"),
    );
  }

  if (!options.apiKey.trim()) {
    return Promise.reject(
      new Error("Карта временно недоступна"),
    );
  }

  const optionsKey = buildLoadOptionsKey(options);
  const existingScript = getExistingScript();

  if (existingScript && !existingScriptMatchesOptions(existingScript, options)) {
    teardownYandexMapsSdk();
  } else if (window.ymaps && !existingScript) {
    teardownYandexMapsSdk();
  }

  if (window.ymaps && loadedOptionsKey === optionsKey) {
    return waitForYandexMapsApi();
  }

  if (loadPromise && loadedOptionsKey === optionsKey) {
    return loadPromise;
  }

  const pendingPromise = new Promise<YandexMapsApi>((resolve, reject) => {
    const script = getExistingScript();

    if (script && existingScriptMatchesOptions(script, options)) {
      void waitForYandexMapsApi(script.src).then(resolve).catch(reject);
      return;
    }

    if (script) {
      script.remove();
      if (window.ymaps) {
        delete window.ymaps;
      }
    }

    const nextScript = document.createElement("script");
    nextScript.id = YANDEX_MAPS_SCRIPT_ID;
    nextScript.async = true;
    nextScript.src = buildYandexMapsSdkUrl(options);
    nextScript.onerror = () => {
      loadPromise = null;
      loadedOptionsKey = null;
      reject(new Error("Failed to load Yandex Maps SDK"));
    };
    nextScript.onload = () => {
      loadedOptionsKey = optionsKey;
      void waitForYandexMapsApi(nextScript.src).then(resolve).catch(reject);
    };

    document.head.appendChild(nextScript);
  });

  loadPromise = pendingPromise;
  loadedOptionsKey = optionsKey;

  return pendingPromise;
}

export function loadConfiguredYandexMapsSdk(): Promise<YandexMapsApi> {
  return loadYandexMapsSdk({
    apiKey: getYandexMapsApiKey(),
    suggestApiKey: getYandexGeoSuggestApiKey(),
  });
}

export function loadConfiguredYandexMapsSdkWithoutSuggest(): Promise<YandexMapsApi> {
  return loadYandexMapsSdk({
    apiKey: getYandexMapsApiKey(),
  });
}
