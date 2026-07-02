// ==================================================
// SECTION: Admin Catalog Manager — main container
// РАЗДЕЛ: Главный контейнер менеджера каталога
// ==================================================
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminProductForm } from "@/components/adminCatalogManager/AdminProductForm";
import { AdminProductList } from "@/components/adminCatalogManager/AdminProductList";
import { AdminPublishSuccessPanel } from "@/components/adminCatalogManager/AdminPublishSuccessPanel";
import type {
  AdminCatalogView,
  AdminProductFormState,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
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
    getProductById,
    buildPreviewRecord,
    getPublishedPreviewProducts,
  } = useAdminCatalogManager();

  const [view, setView] = useState<AdminCatalogView>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishedProduct, setPublishedProduct] = useState<CatalogProductRecord | null>(
    null,
  );
  const [formSeed, setFormSeed] = useState<AdminProductFormState>(
    createEmptyAdminProductForm(),
  );

  const publishedCount = useMemo(
    () => getPublishedPreviewProducts().length,
    [getPublishedPreviewProducts],
  );

  const openCreate = () => {
    setPublishedProduct(null);
    setFormSeed(createEmptyAdminProductForm());
    setEditingId(null);
    setView("create");
  };

  const openEdit = (productId: string) => {
    const product = getProductById(productId);
    if (!product) {
      return;
    }

    setPublishedProduct(null);
    setFormSeed(catalogRecordToAdminForm(product));
    setEditingId(productId);
    setView("edit");
  };

  const handleSaveDraft = (form: AdminProductFormState) => {
    const saved = saveProduct({ ...form, status: "draft" });
    setFormSeed(catalogRecordToAdminForm(saved));
    setEditingId(saved.id);
    setView("edit");
  };

  const handlePublish = (form: AdminProductFormState) => {
    const saved = saveProduct({ ...form, status: "published" });
    setPublishedProduct(saved);
    setFormSeed(catalogRecordToAdminForm(saved));
    setEditingId(saved.id);
    setView("edit");
  };

  const handleArchiveFromSuccess = () => {
    if (!publishedProduct) {
      return;
    }

    archiveProduct(publishedProduct.id);
    setPublishedProduct(null);
    setView("list");
    setEditingId(null);
  };

  const handleArchive = (form: AdminProductFormState) => {
    if (form.id) {
      archiveProduct(form.id);
    }
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
        />
      ) : publishedProduct ? (
        <div className={styles.wizardShell}>
          <header className={styles.wizardHeader}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => {
                setPublishedProduct(null);
                setView("list");
                setEditingId(null);
              }}
            >
              ← К списку товаров
            </button>
            <div>
              <p className={styles.formEyebrow}>Публикация завершена</p>
              <h2 className={styles.wizardTitle}>Товар на витрине</h2>
            </div>
          </header>
          <AdminPublishSuccessPanel
            product={publishedProduct}
            onEdit={() => setPublishedProduct(null)}
            onArchive={handleArchiveFromSuccess}
            onOpenCatalog={() => {
              setPublishedProduct(null);
              setView("list");
              setEditingId(null);
            }}
          />
        </div>
      ) : (
        <AdminProductForm
          key={editingId ?? "create"}
          initialForm={formSeed}
          mode={view === "create" ? "create" : "edit"}
          buildPreviewRecord={buildPreviewRecord}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onCancel={() => {
            setPublishedProduct(null);
            setView("list");
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
