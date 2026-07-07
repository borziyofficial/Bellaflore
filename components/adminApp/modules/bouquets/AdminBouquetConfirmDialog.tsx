// ==================================================
// SECTION: ADMIN APP — Bouquet confirm dialog (Stage 2.5)
// ==================================================
"use client";

import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminBouquetConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  onConfirm,
  onCancel,
}: AdminBouquetConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.confirmOverlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.confirmSheet}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-bouquet-confirm-title"
        aria-describedby="admin-bouquet-confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="admin-bouquet-confirm-title" className={styles.confirmTitle}>
          {title}
        </h3>
        <p id="admin-bouquet-confirm-message" className={styles.confirmMessage}>
          {message}
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.primaryButton} ${styles.confirmDangerButton}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
