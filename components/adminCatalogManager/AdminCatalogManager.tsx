// ==================================================
// SECTION: Admin Catalog Manager — Stage 2.9 Product Studio wrapper
// РАЗДЕЛ: Контейнер студии товаров Stage 2.9
// ==================================================
"use client";

import Link from "next/link";
import { AdminProductStudio } from "@/components/adminCatalogManager/AdminProductStudio";
import { useAdminCatalogManager } from "@/components/adminCatalogManager/useAdminCatalogManager";
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

  // The create flow doesn't need the existing product list at all (only
  // categories, which load independently) — never block the empty form
  // behind a full-catalog fetch.
  const isCreateOnly = initialMode === "create" && !initialEditId;
  // Editing a specific product needs that product's data resolved from the
  // list, so it still waits — but list mode now shows the shell, header and
  // filter toolbar immediately and only skeletons the product grid itself
  // (see `productsReady` passed to AdminProductStudio below).
  const isEditingSpecificProduct = initialMode === "edit" && Boolean(initialEditId);

  if (!isReady && isEditingSpecificProduct) {
    return (
      <div className={embedded ? styles.embeddedRoot : styles.shell}>
        <div className={styles.skeletonGrid} aria-busy="true" aria-label="Загрузка товара">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
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

      {loadError ? <p className={styles.errorBanner}>{loadError}</p> : null}

      <AdminProductStudio
        products={products}
        reload={reload}
        getProductById={getProductById}
        initialMode={initialMode}
        initialEditId={initialEditId}
        imageStorageWarning={imageStorageWarning}
        productsReady={isCreateOnly ? true : isReady}
      />
    </div>
  );
}
