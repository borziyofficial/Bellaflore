// ==================================================
// SECTION: Admin Catalog Manager — data hook
// РАЗДЕЛ: Хук управления каталогом (server persistence)
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
  fetchAdminCatalogProducts,
  saveAdminCatalogProduct,
} from "@/components/adminCatalogManager/catalogApiClient";

export function useAdminCatalogManager() {
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageStorageWarning, setImageStorageWarning] = useState<string | null>(
    null,
  );

  const reload = useCallback(async () => {
    try {
      const response = await fetchAdminCatalogProducts();
      setProducts(response.products);
      setImageStorageWarning(response.imageStorageWarning ?? null);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "База данных каталога не настроена.",
      );
      setProducts([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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
