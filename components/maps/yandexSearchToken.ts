// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Reads the Yandex JS API search token from recent network activity.
//
// Назначение (RU):
// Читает search-токен Yandex JS API из недавних сетевых запросов.
// ==================================================
const YANDEX_SEARCH_V2_MARKER = "services/search/v2";

function readTokenFromUrl(url: string): string | null {
  try {
    return new URL(url).searchParams.get("token")?.trim() || null;
  } catch {
    return null;
  }
}

function readTokenFromScripts(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const scripts = document.querySelectorAll(`script[src*="${YANDEX_SEARCH_V2_MARKER}"]`);

  for (let index = scripts.length - 1; index >= 0; index -= 1) {
    const script = scripts[index];
    if (!(script instanceof HTMLScriptElement)) {
      continue;
    }

    const token = readTokenFromUrl(script.src);
    if (token) {
      return token;
    }
  }

  return null;
}

function readTokenFromPerformanceEntries(): string | null {
  if (typeof performance === "undefined") {
    return null;
  }

  const entries = performance.getEntriesByType("resource");

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!entry.name.includes(YANDEX_SEARCH_V2_MARKER)) {
      continue;
    }

    const token = readTokenFromUrl(entry.name);
    if (token) {
      return token;
    }
  }

  return null;
}

function waitForYandexJsApiSearchToken(timeoutMs = 2500): Promise<string | null> {
  const existingToken = readYandexJsApiSearchToken();
  if (existingToken) {
    return Promise.resolve(existingToken);
  }

  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (token: string | null) => {
      if (settled) {
        return;
      }

      settled = true;
      observer.disconnect();
      mutationObserver.disconnect();
      window.clearTimeout(timer);
      resolve(token);
    };

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.name.includes(YANDEX_SEARCH_V2_MARKER)) {
          continue;
        }

        const token = readTokenFromUrl(entry.name);
        if (token) {
          finish(token);
          return;
        }
      }
    });

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLScriptElement)) {
            continue;
          }

          if (!node.src.includes(YANDEX_SEARCH_V2_MARKER)) {
            continue;
          }

          const token = readTokenFromUrl(node.src);
          if (token) {
            finish(token);
            return;
          }
        }
      }
    });

    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      // PerformanceObserver unsupported.
    }

    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const timer = window.setTimeout(() => {
      finish(readYandexJsApiSearchToken());
    }, timeoutMs);
  });
}

export function readYandexJsApiSearchToken(): string | null {
  return readTokenFromPerformanceEntries() ?? readTokenFromScripts();
}

export async function ensureYandexJsApiSearchToken(
  primeGeocodeQuery?: string,
): Promise<string | null> {
  const existingToken = readYandexJsApiSearchToken();
  if (existingToken) {
    return existingToken;
  }

  if (typeof window === "undefined" || !window.ymaps || !primeGeocodeQuery) {
    return null;
  }

  const tokenPromise = waitForYandexJsApiSearchToken();
  const ymaps = window.ymaps;

  await new Promise<void>((resolve) => {
    ymaps.ready(() => resolve());
  });

  try {
    await ymaps.geocode(primeGeocodeQuery, { results: 1 });
  } catch {
    // JSONP may fail in some browsers; the request still exposes a search token.
  }

  return tokenPromise;
}
