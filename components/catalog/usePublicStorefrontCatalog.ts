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

type UsePublicStorefrontCatalogProps = {
  initialProducts?: CatalogProduct[];
  initialStatus?: "ready" | "error";
};

export function usePublicStorefrontCatalog(
  props?: UsePublicStorefrontCatalogProps,
) {
  const initialProducts = props?.initialProducts;
  const initialStatus = props?.initialStatus;

  const [catalog, setCatalog] = useState<CatalogProduct[]>(
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : INITIAL_STOREFRONT_CATALOG,
  );

  // If initialStatus is "error", mark as error instead of ready
  const [isReady, setIsReady] = useState(!!initialProducts?.length);
  const [status, setStatus] = useState<PublicStorefrontCatalogStatus>(
    initialStatus === "error"
      ? "error"
      : initialProducts?.length
        ? "ready"
        : "loading",
  );

  const [errorMessage, setErrorMessage] = useState(
    initialStatus === "error"
      ? "Не удалось загрузить каталог. Попробуйте обновить страницу."
      : "",
  );

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

    // If we already have initialProducts from SSR and status is ready, skip API call
    if (initialProducts?.length && initialStatus !== "error") {
      writeCachedStorefrontCatalog(initialProducts);
      // State already initialized correctly, just mark as ready
      void Promise.resolve().then(() => {
        if (active) {
          setIsReady(true);
        }
      });
      return;
    }

    // If initialStatus is "error", skip API call (state already initialized with error)
    if (initialStatus === "error") {
      // Mark as ready without state change (already set during init)
      void Promise.resolve().then(() => {
        if (active) {
          setIsReady(true);
        }
      });
      return;
    }

    // No initial products: try to load from cache or API
    const cachedCatalog = readCachedStorefrontCatalog();
    if (cachedCatalog && cachedCatalog.length > 0) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setCatalog(cachedCatalog);
        setStatus("ready");
        setIsReady(true);
      });
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
  }, [initialProducts, initialStatus]);

  return { catalog, isReady, status, errorMessage, reload };
}
