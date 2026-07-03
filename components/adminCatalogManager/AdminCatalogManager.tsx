// ==================================================
// SECTION: Admin Catalog Manager — main container
// РАЗДЕЛ: Главный контейнер менеджера каталога
// ==================================================
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminProductForm } from "@/components/adminCatalogManager/AdminProductForm";
import { FastProductCreate } from "@/components/adminCatalogManager/FastProductCreate";
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

type AdminCatalogManagerProps = {
  embedded?: boolean;
};

export function AdminCatalogManager({ embedded = false }: AdminCatalogManagerProps) {
  const {
    products,
    isReady,
    loadError,
    imageStorageWarning,
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const publishedCount = useMemo(
    () => getPublishedPreviewProducts().length,
    [getPublishedPreviewProducts],
  );

  const openCreate = () => {
    setPublishedProduct(null);
    setActionError(null);
    setFormSeed(createEmptyAdminProductForm());
    setEditingId(null);
    setView("create-fast");
  };

  const openAdvancedCreate = (form: AdminProductFormState = formSeed) => {
    setPublishedProduct(null);
    setActionError(null);
    setFormSeed(form);
    setEditingId(null);
    setView("create");
  };

  const openEdit = (productId: string) => {
    const product = getProductById(productId);
    if (!product) {
      return;
    }

    setPublishedProduct(null);
    setActionError(null);
    setFormSeed(catalogRecordToAdminForm(product));
    setEditingId(productId);
    setView("edit");
  };

  const handleSaveDraft = async (form: AdminProductFormState) => {
    setIsSaving(true);
    setActionError(null);
    try {
      const saved = await saveProduct({ ...form, status: "draft" });
      setFormSeed(catalogRecordToAdminForm(saved));
      setEditingId(saved.id);
      setView("edit");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось сохранить черновик.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (form: AdminProductFormState) => {
    setIsSaving(true);
    setActionError(null);
    try {
      const saved = await saveProduct({ ...form, status: "published" });
      setPublishedProduct(saved);
      setFormSeed(catalogRecordToAdminForm(saved));
      setEditingId(saved.id);
      setView("edit");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось опубликовать товар.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveFromSuccess = async () => {
    if (!publishedProduct) {
      return;
    }

    setActionError(null);
    try {
      await archiveProduct(publishedProduct.id);
      setPublishedProduct(null);
      setView("list");
      setEditingId(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось архивировать товар.",
      );
    }
  };

  const handleArchive = async (form: AdminProductFormState) => {
    if (!form.id) {
      return;
    }

    setActionError(null);
    try {
      await archiveProduct(form.id);
      setView("list");
      setEditingId(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Не удалось архивировать товар.",
      );
    }
  };

  if (!isReady) {
    return (
      <div className={embedded ? styles.embeddedRoot : styles.shell}>
        <p className={styles.loading}>Загрузка каталога…</p>
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
              {products.length} товаров · {publishedCount} опубликовано
            </p>
          </div>
        </header>
      ) : (
        <p className={styles.topMeta}>
          {products.length} товаров · {publishedCount} опубликовано
        </p>
      )}

      {loadError ? <p className={styles.errorBanner}>{loadError}</p> : null}
      {imageStorageWarning ? (
        <p className={styles.warningBanner}>{imageStorageWarning}</p>
      ) : null}
      {actionError ? <p className={styles.errorBanner}>{actionError}</p> : null}

      {view === "list" ? (
        <AdminProductList
          products={products}
          onCreate={openCreate}
          onEdit={openEdit}
          onArchive={(productId) => {
            void archiveProduct(productId);
          }}
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
            onArchive={() => {
              void handleArchiveFromSuccess();
            }}
            onOpenCatalog={() => {
              setPublishedProduct(null);
              setView("list");
              setEditingId(null);
            }}
          />
        </div>
      ) : view === "create-fast" ? (
        <FastProductCreate
          key="create-fast"
          initialForm={formSeed}
          onSaveDraft={(form) => {
            void handleSaveDraft(form);
          }}
          onPublish={(form) => {
            void handlePublish(form);
          }}
          onCancel={() => {
            setPublishedProduct(null);
            setView("list");
            setEditingId(null);
          }}
          onSwitchToAdvanced={openAdvancedCreate}
          isSaving={isSaving}
          imageStorageWarning={imageStorageWarning}
        />
      ) : (
        <AdminProductForm
          key={editingId ?? "create"}
          initialForm={formSeed}
          mode={view === "create" ? "create" : "edit"}
          buildPreviewRecord={buildPreviewRecord}
          onSaveDraft={(form) => {
            void handleSaveDraft(form);
          }}
          onPublish={(form) => {
            void handlePublish(form);
          }}
          onArchive={(form) => {
            void handleArchive(form);
          }}
          onCancel={() => {
            setPublishedProduct(null);
            setView("list");
            setEditingId(null);
          }}
          isSaving={isSaving}
          imageStorageWarning={imageStorageWarning}
        />
      )}
    </div>
  );
}
