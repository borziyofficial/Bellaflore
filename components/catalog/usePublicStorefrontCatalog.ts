// ==================================================
// SECTION: Public Storefront Catalog Hook
// РАЗДЕЛ: React-хук каталога витрины
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import { CATALOG_ADMIN_STORAGE_KEY } from "@/components/catalogEngine/catalogAdminStore";
import { mergePublicStorefrontCatalog } from "@/components/catalog/publicCatalogMerge";
import type { CatalogProduct } from "@/data/catalogProducts";
import { catalogProducts as SEED_CATALOG } from "@/data/catalogProducts";

export function usePublicStorefrontCatalog() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>(SEED_CATALOG);
  const [isReady, setIsReady] = useState(false);

  const reload = useCallback(() => {
    setCatalog(mergePublicStorefrontCatalog());
    setIsReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CATALOG_ADMIN_STORAGE_KEY) {
        reload();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [reload]);

  return { catalog, isReady, reload };
}
