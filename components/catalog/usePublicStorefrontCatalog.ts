// ==================================================
// SECTION: Public Storefront Catalog Hook
// РАЗДЕЛ: React-хук каталога витрины (server persistence)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPublishedStorefrontProducts } from "@/components/adminCatalogManager/catalogApiClient";
import { mergePublicStorefrontCatalog } from "@/components/catalog/publicCatalogMerge";
import type { CatalogProduct } from "@/data/catalogProducts";
import { catalogProducts as SEED_CATALOG } from "@/data/catalogProducts";

const INITIAL_STOREFRONT_CATALOG =
  process.env.NODE_ENV === "production" ? [] : SEED_CATALOG;

const STOREFRONT_CACHE_KEY = "bellaflore:storefront-catalog:v1";
const STOREFRONT_CACHE_MAX_AGE_MS = 15 * 60 * 1000;

type CachedStorefrontCatalog = {
  savedAt: number;
  products: CatalogProduct[];
};

function readCachedStorefrontCatalog(): CatalogProduct[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STOREFRONT_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedStorefrontCatalog;
    if (
      !Array.isArray(parsed.products) ||
      parsed.products.length === 0 ||
      !Number.isFinite(parsed.savedAt) ||
      Date.now() - parsed.savedAt > STOREFRONT_CACHE_MAX_AGE_MS
    ) {
      return null;
    }

    return parsed.products;
  } catch {
    return null;
  }
}

function writeCachedStorefrontCatalog(products: CatalogProduct[]) {
  if (typeof window === "undefined" || products.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      STOREFRONT_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        products,
      } satisfies CachedStorefrontCatalog),
    );
  } catch {
    // Cache is only a UX optimization; storefront data still comes from the API.
  }
}

type PublicStorefrontCatalogStatus = "loading" | "ready" | "error";

export function usePublicStorefrontCatalog() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>(INITIAL_STOREFRONT_CATALOG);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<PublicStorefrontCatalogStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const reload = useCallback(async () => {
    setStatus((currentStatus) => (catalog.length > 0 ? currentStatus : "loading"));
    setErrorMessage("");
    try {
      const publishedProducts = await fetchPublishedStorefrontProducts();
      const mergedCatalog = mergePublicStorefrontCatalog(publishedProducts);
      setCatalog(mergedCatalog);
      writeCachedStorefrontCatalog(mergedCatalog);
      setStatus("ready");
    } catch {
      setCatalog((currentCatalog) =>
        currentCatalog.length > 0 ? currentCatalog : INITIAL_STOREFRONT_CATALOG,
      );
      setStatus("error");
      setErrorMessage("Не удалось загрузить каталог. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsReady(true);
    }
  }, [catalog.length]);

  useEffect(() => {
    let active = true;

    const cachedCatalog = readCachedStorefrontCatalog();
    if (cachedCatalog && cachedCatalog.length > 0) {
      setCatalog(cachedCatalog);
      setStatus("ready");
      setIsReady(true);
    }

    void (async () => {
      try {
        const publishedProducts = await fetchPublishedStorefrontProducts();
        if (active) {
          const mergedCatalog = mergePublicStorefrontCatalog(publishedProducts);
          setCatalog(mergedCatalog);
          writeCachedStorefrontCatalog(mergedCatalog);
          setStatus("ready");
          setErrorMessage("");
        }
      } catch {
        if (active) {
          setCatalog((currentCatalog) =>
            currentCatalog.length > 0 ? currentCatalog : INITIAL_STOREFRONT_CATALOG,
          );
          setStatus("error");
          setErrorMessage("Не удалось загрузить каталог. Проверьте соединение и попробуйте снова.");
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { catalog, isReady, status, errorMessage, reload };
}
