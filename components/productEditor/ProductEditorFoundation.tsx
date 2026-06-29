// ==================================================
// SECTION: PRODUCT EDITOR
// РАЗДЕЛ: Product Editor foundation UI
// ==================================================
"use client";

import { useState } from "react";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import { ProductEditorForm } from "@/components/productEditor/ProductEditorForm";
import styles from "@/components/productEditor/ProductEditorFoundation.module.css";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import { PRODUCT_EDITOR_SECTION_ID } from "@/components/productEditor/productEditorTypes";
import { ProductPreviewPanel } from "@/components/productEditor/ProductPreviewPanel";
import { ProductEditorPhotoIntegration } from "@/components/productEditor/ProductEditorPhotoIntegration";
import { ProductSeoPanel } from "@/components/productEditor/ProductSeoPanel";
import { SeoIntelligenceDashboard } from "@/components/seoIntelligence";
import { useProductStorage } from "@/components/productStorage/ProductStorageProvider";
import { ProductStoragePreview } from "@/components/productStorage/ProductStoragePreview";
import { storedProductToEditorDraft } from "@/components/productStorage/productStorageBridge";
import type { StoredProduct } from "@/components/productStorage/productStorageTypes";
import { PRODUCT_STATUS_LABELS } from "@/components/productStorage/productStorageTypes";

type ProductEditorWorkspaceProps = {
  activeProduct: StoredProduct;
  onSave: (draft: ProductEditorDraft) => Promise<void>;
};

function ProductEditorWorkspace({ activeProduct, onSave }: ProductEditorWorkspaceProps) {
  const [draft, setDraft] = useState<ProductEditorDraft>(() =>
    storedProductToEditorDraft(activeProduct),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const statusLabel = PRODUCT_STATUS_LABELS[activeProduct.status];

  const handleChange = (patch: Partial<ProductEditorDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveMessage(null);
  };

  const handleSaveDraft = async () => {
    await onSave(draft);
    setSaveMessage("Черновик сохранён локально.");
  };

  return (
    <>
      <p className={styles.activeProductMeta}>
        Редактируется: <strong>{activeProduct.title}</strong> · {statusLabel.emoji}{" "}
        {statusLabel.label}
      </p>

      <div className={styles.actionRow}>
        <button type="button" className={styles.actionButton} onClick={() => void handleSaveDraft()}>
          Сохранить черновик
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          disabled
        >
          Опубликовать
        </button>
        <button type="button" className={styles.actionButton} disabled>
          Предпросмотр
        </button>
      </div>

      {saveMessage ? <p className={styles.saveMessage}>{saveMessage}</p> : null}

      <div className={styles.workspace}>
        <div className={styles.mainColumn}>
          <div className={styles.formPanel}>
            <h4 className={styles.formTitle}>Основные поля товара</h4>
            <ProductEditorForm draft={draft} onChange={handleChange} />
          </div>

          <ProductSeoPanel draft={draft} onChange={handleChange} />

          <ProductEditorPhotoIntegration />
        </div>

        <ProductPreviewPanel draft={draft} />
      </div>

      <ProductStoragePreview draft={draft} />

      <SeoIntelligenceDashboard draft={draft} />
    </>
  );
}

export function ProductEditorFoundation() {
  const { activeProduct, activeProductId, saveActiveProduct } = useProductStorage();
  const { photos } = usePhotoManager();

  const handleSave = async (draft: ProductEditorDraft) => {
    await saveActiveProduct(draft, photos);
  };

  return (
    <section id={PRODUCT_EDITOR_SECTION_ID} className={styles.section}>
      <p className={styles.eyebrow}>Stage 49 · Product Editor + Storage Binding</p>
      <h3 className={styles.title}>📝 Редактор товара</h3>
      <p className={styles.lead}>
        CMS-редактор, связанный с Product Store. Выберите товар в списке выше —
        данные, фото и SEO подгрузятся автоматически.
      </p>

      {activeProduct && activeProductId ? (
        <ProductEditorWorkspace
          key={activeProductId}
          activeProduct={activeProduct}
          onSave={handleSave}
        />
      ) : (
        <p className={styles.activeProductMeta}>Выберите или создайте товар в хранилище.</p>
      )}
    </section>
  );
}
