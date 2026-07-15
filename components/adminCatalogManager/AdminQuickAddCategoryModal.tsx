// ==================================================
// SECTION: Admin Catalog Manager — quick add category (from dropdown)
// РАЗДЕЛ: Быстрое создание категории прямо из выпадающего списка
// ==================================================
"use client";

import { useState } from "react";
import type { AdminCategoryRecord } from "@/components/adminCatalogManager/useAdminCategories";
import styles from "@/components/adminCatalogManager/AdminProductStudio.module.css";

type AdminQuickAddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<AdminCategoryRecord>;
  onCreated: (category: AdminCategoryRecord) => void;
};

export function AdminQuickAddCategoryModal({
  open,
  onClose,
  onCreate,
  onCreated,
}: AdminQuickAddCategoryModalProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  // Reset local state and dismiss — used for both "Отмена" and after a
  // successful create, so the next time this opens it starts fresh
  // (the component stays mounted between opens, only `open` toggles).
  const closeAndReset = () => {
    setTitle("");
    setError(null);
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await onCreate(trimmed);
      onCreated(created);
      closeAndReset();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Не удалось создать категорию.",
      );
      setSaving(false);
    }
  };

  return (
    <div className={styles.dialogBackdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h3>Новая категория</h3>
        {error ? <p className={styles.error}>{error}</p> : null}
        <label className={styles.field}>
          <span>Название категории</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Свадебные"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSave();
              }
            }}
          />
        </label>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={closeAndReset}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={saving || !title.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? "Создание…" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
