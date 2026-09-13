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
      setCatalog(mergePublicStorefrontCatalog(publishedProducts));
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

    void (async () => {
      try {
        const publishedProducts = await fetchPublishedStorefrontProducts();
        if (active) {
          setCatalog(mergePublicStorefrontCatalog(publishedProducts));
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
