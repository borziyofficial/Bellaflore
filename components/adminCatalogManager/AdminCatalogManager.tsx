// ==================================================
// SECTION: Admin Catalog Manager — main container
// РАЗДЕЛ: Главный контейнер менеджера каталога
// ==================================================
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminProductForm } from "@/components/adminCatalogManager/AdminProductForm";
import { AdminProductList } from "@/components/adminCatalogManager/AdminProductList";
import type {
  AdminCatalogView,
  AdminProductFormState,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  catalogRecordToAdminForm,
  createEmptyAdminProductForm,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { useAdminCatalogManager } from "@/components/adminCatalogManager/useAdminCatalogManager";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

export function AdminCatalogManager() {
  const {
    products,
    isReady,
    saveProduct,
    archiveProduct,
    deleteProduct,
    getProductById,
    buildPreviewRecord,
    getPublishedPreviewProducts,
  } = useAdminCatalogManager();

  const [view, setView] = useState<AdminCatalogView>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSeed, setFormSeed] = useState<AdminProductFormState>(
    createEmptyAdminProductForm(),
  );

  const publishedCount = useMemo(
    () => getPublishedPreviewProducts().length,
    [getPublishedPreviewProducts],
  );

  const openCreate = () => {
    setFormSeed(createEmptyAdminProductForm());
    setEditingId(null);
    setView("create");
  };

  const openEdit = (productId: string) => {
    const product = getProductById(productId);
    if (!product) {
      return;
    }

    setFormSeed(catalogRecordToAdminForm(product));
    setEditingId(productId);
    setView("edit");
  };

  const handleSave = (form: AdminProductFormState) => {
    saveProduct(form);
    setView("list");
    setEditingId(null);
  };

  if (!isReady) {
    return (
      <div className={styles.shell}>
        <p className={styles.loading}>Загрузка каталога…</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarMain}>
          <Link href="/admin" className={styles.backLink}>
            ← Admin Control Center
          </Link>
          <p className={styles.topMeta}>
            {products.length} товаров · {publishedCount} опубликовано в admin
          </p>
        </div>
      </header>

      {view === "list" ? (
        <AdminProductList
          products={products}
          onCreate={openCreate}
          onEdit={openEdit}
          onArchive={archiveProduct}
          onDelete={deleteProduct}
        />
      ) : (
        <AdminProductForm
          key={editingId ?? "create"}
          initialForm={formSeed}
          mode={view === "create" ? "create" : "edit"}
          buildPreviewRecord={buildPreviewRecord}
          onSaveDraft={handleSave}
          onPublish={handleSave}
          onCancel={() => {
            setView("list");
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
