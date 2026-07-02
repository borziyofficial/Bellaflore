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

export function usePublicStorefrontCatalog() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>(SEED_CATALOG);
  const [isReady, setIsReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const publishedProducts = await fetchPublishedStorefrontProducts();
      setCatalog(mergePublicStorefrontCatalog(publishedProducts));
    } catch {
      setCatalog(SEED_CATALOG);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { catalog, isReady, reload };
}
