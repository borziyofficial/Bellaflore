// ==================================================
// SECTION: Admin Catalog Manager — Stage 2.9 Product Studio wrapper
// РАЗДЕЛ: Контейнер студии товаров Stage 2.9
// ==================================================
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminProductStudio } from "@/components/adminCatalogManager/AdminProductStudio";
import { fetchAdminCatalogProduct } from "@/components/adminCatalogManager/catalogApiClient";
import { useAdminCatalogManager } from "@/components/adminCatalogManager/useAdminCatalogManager";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

type AdminCatalogManagerProps = {
  embedded?: boolean;
  initialMode?: "list" | "create" | "edit";
  initialEditId?: string | null;
};

export function AdminCatalogManager({
  embedded = false,
  initialMode = "list",
  initialEditId = null,
}: AdminCatalogManagerProps) {
  const {
    products,
    isReady,
    loadError,
    imageStorageWarning,
    reload,
    getProductById,
    getPublishedPreviewProducts,
  } = useAdminCatalogManager();
  const [seedState, setSeedState] = useState<{
    id: string;
    product: CatalogProductRecord | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!initialEditId) {
      return;
    }

    let active = true;
    fetchAdminCatalogProduct(initialEditId)
      .then((product) => {
        if (active) {
          setSeedState({ id: initialEditId, product, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSeedState({
            id: initialEditId,
            product: null,
            error: error instanceof Error ? error.message : "Не удалось загрузить товар.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [initialEditId]);

  const seedMatches = seedState?.id === initialEditId;
  const seedProduct = seedMatches ? seedState.product : null;
  const seedError = seedMatches ? seedState.error : null;

  // The create flow doesn't need the existing product list at all (only
  // categories, which load independently) — never block the empty form
  // behind a full-catalog fetch.
  const isCreateOnly = initialMode === "create" && !initialEditId;
  // Editing a specific product needs that product's data resolved from the
  // list, so it still waits — but list mode now shows the shell, header and
  // filter toolbar immediately and only skeletons the product grid itself
  // (see `productsReady` passed to AdminProductStudio below).
  const isEditingSpecificProduct = initialMode === "edit" && Boolean(initialEditId);

  if (isEditingSpecificProduct && !seedProduct) {
    return (
      <div className={embedded ? styles.embeddedRoot : styles.shell}>
        {seedError ? (
          <p className={styles.errorBanner}>{seedError}</p>
        ) : (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка товара">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={styles.skeletonCard} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={embedded ? styles.embeddedRoot : styles.shell}>
      {!embedded ? (
        <header className={styles.topBar}>
          <div className={styles.topBarMain}>
            <Link href="/admin" className={styles.backLink}>
              ← Панель администратора
            </Link>
            <p className={styles.topMeta}>
              {isReady
                ? `${products.length} товаров · ${getPublishedPreviewProducts().length} опубликовано`
                : "Загрузка…"}
            </p>
          </div>
        </header>
      ) : (
        <p className={styles.topMeta}>
          {isReady
            ? `${products.length} товаров · ${getPublishedPreviewProducts().length} опубликовано`
            : "Загрузка…"}
        </p>
      )}

      {loadError ? (
        <div className={styles.errorBanner}>
          <p>{loadError}</p>
          <button type="button" onClick={() => void reload()}>
            Повторить загрузку
          </button>
        </div>
      ) : null}

      <AdminProductStudio
        products={products}
        reload={reload}
        getProductById={getProductById}
        initialMode={initialMode}
        initialEditId={initialEditId}
        seedProduct={seedProduct}
        imageStorageWarning={imageStorageWarning}
        productsReady={isCreateOnly ? true : isReady}
        catalogLoadFailed={Boolean(loadError)}
      />
    </div>
  );
}
