// ==================================================
// SECTION: Admin Catalog Manager — data hook
// РАЗДЕЛ: Хук управления каталогом (server persistence, session cache)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  adminFormToCatalogUpsertInput,
  catalogRecordToAdminForm,
  finalizeCatalogRecord,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import {
  archiveAdminCatalogProduct,
  saveAdminCatalogProduct,
} from "@/components/adminCatalogManager/catalogApiClient";
import {
  ADMIN_CATALOG_CACHE_EVENT,
  ensureCatalogLoaded,
  getCachedImageStorageWarning,
  getCachedLoadError,
  getCachedProducts,
  hasCatalogFetchedOnce,
  refreshCatalog,
} from "@/components/adminCatalogManager/adminCatalogCache";

export function useAdminCatalogManager() {
  const [products, setProducts] = useState<CatalogProductRecord[]>(getCachedProducts());
  const [isReady, setIsReady] = useState(hasCatalogFetchedOnce());
  const [loadError, setLoadError] = useState<string | null>(getCachedLoadError());
  const [imageStorageWarning, setImageStorageWarning] = useState<string | null>(
    getCachedImageStorageWarning(),
  );

  const syncFromCache = useCallback(() => {
    setProducts(getCachedProducts());
    setLoadError(getCachedLoadError());
    setImageStorageWarning(getCachedImageStorageWarning());
    setIsReady(true);
  }, []);

  const reload = useCallback(async () => {
    await refreshCatalog();
    syncFromCache();
  }, [syncFromCache]);

  useEffect(() => {
    let active = true;

    // Cache-first: if another admin page already warmed the catalog this
    // session, this resolves instantly with no network request. Otherwise
    // it fetches once and every mounted consumer picks up the result.
    ensureCatalogLoaded().then(() => {
      if (active) {
        syncFromCache();
      }
    });

    const onCacheChange = () => {
      if (active) {
        syncFromCache();
      }
    };
    window.addEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);
    };
  }, [syncFromCache]);

  const saveProduct = useCallback(
    async (form: AdminProductFormState): Promise<CatalogProductRecord> => {
      const saved = await saveAdminCatalogProduct(form);
      await reload();
      return saved;
    },
    [reload],
  );

  const archiveProduct = useCallback(
    async (productId: string) => {
      await archiveAdminCatalogProduct(productId);
      await reload();
    },
    [reload],
  );

  const getProductById = useCallback(
    (productId: string) =>
      products.find((product) => product.id === productId) ?? null,
    [products],
  );

  const getPublishedPreviewProducts = useCallback(() => {
    return products.filter(
      (product) => product.isPublished && product.status !== "ARCHIVED",
    );
  }, [products]);

  return {
    products,
    isReady,
    loadError,
    imageStorageWarning,
    reload,
    saveProduct,
    archiveProduct,
    getProductById,
    getPublishedPreviewProducts,
    buildPreviewRecord: (form: AdminProductFormState) =>
      finalizeCatalogRecord(
        adminFormToCatalogUpsertInput(
          form,
          form.id ? getProductById(form.id) : null,
        ),
      ),
    catalogRecordToAdminForm,
  };
}
