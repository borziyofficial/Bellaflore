// ==================================================
// SECTION: ADMIN APP — Bouquet customer preview modal (Stage 2.4)
// ==================================================
"use client";

import { AdminBouquetLivePreview } from "@/components/adminApp/modules/bouquets/AdminBouquetLivePreview";
import type { BouquetDraft } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetPreviewModalProps = {
  open: boolean;
  draft: BouquetDraft;
  categoryName?: string;
  onClose: () => void;
};

export function AdminBouquetPreviewModal({
  open,
  draft,
  categoryName,
  onClose,
}: AdminBouquetPreviewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.previewOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.previewSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-bouquet-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.previewHeader}>
          <div>
            <p className={styles.formEyebrow}>Просмотр</p>
            <h3 id="admin-bouquet-preview-title" className={styles.formTitle}>
              Предпросмотр букета
            </h3>
          </div>
          <button type="button" className={styles.formClose} onClick={onClose} aria-label="Закрыть">
            <span className={styles.formCloseIcon} aria-hidden="true">
              ×
            </span>
          </button>
        </header>

        <div className={styles.previewBody}>
          <p className={styles.previewHint}>Так букет будет выглядеть для покупателя.</p>
          <AdminBouquetLivePreview
            draft={draft}
            compact={false}
            categoryName={categoryName}
          />
        </div>

        <div className={styles.previewActions}>
          <button type="button" className={styles.primaryButton} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
