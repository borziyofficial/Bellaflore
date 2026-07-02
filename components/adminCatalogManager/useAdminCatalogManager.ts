// ==================================================
// SECTION: Admin Catalog Manager — data hook
// РАЗДЕЛ: Хук управления каталогом
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import {
  archiveCatalogEngineProduct,
  deleteCatalogEngineProduct,
  getAllCatalogProducts,
  refreshCatalogEngineSnapshot,
  upsertCatalogEngineProduct,
} from "@/components/catalogEngine/productCatalogEngine";
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  adminFormToCatalogUpsertInput,
  canDeleteAdminProduct,
  finalizeCatalogRecord,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";

export function useAdminCatalogManager() {
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [isReady, setIsReady] = useState(false);

  const reload = useCallback(() => {
    refreshCatalogEngineSnapshot();
    setProducts(getAllCatalogProducts());
    setIsReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveProduct = useCallback(
    (form: AdminProductFormState): CatalogProductRecord => {
      const existing = form.id
        ? products.find((product) => product.id === form.id) ?? null
        : null;
      const input = adminFormToCatalogUpsertInput(form, existing);
      const saved = upsertCatalogEngineProduct(input);
      reload();
      return saved;
    },
    [products, reload],
  );

  const archiveProduct = useCallback(
    (productId: string) => {
      archiveCatalogEngineProduct(productId);
      reload();
    },
    [reload],
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      const product = products.find((item) => item.id === productId);
      if (!product || !canDeleteAdminProduct(product)) {
        return false;
      }

      deleteCatalogEngineProduct(productId);
      reload();
      return true;
    },
    [products, reload],
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
    reload,
    saveProduct,
    archiveProduct,
    deleteProduct,
    getProductById,
    getPublishedPreviewProducts,
    buildPreviewRecord: (form: AdminProductFormState) =>
      finalizeCatalogRecord(
        adminFormToCatalogUpsertInput(
          form,
          form.id ? getProductById(form.id) : null,
        ),
      ),
  };
}
