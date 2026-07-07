// ==================================================
// SECTION: ADMIN APP — Bouquet form (Stage 2.2)
// ==================================================
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAllCatalogCategories } from "@/components/catalogEngine/categoriesEngine";
import { AdminBouquetPhotoUpload } from "@/components/adminApp/modules/bouquets/AdminBouquetPhotoUpload";
import { normalizeBouquetImages } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import type { BouquetDraft, BouquetStatus } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_STATUS_OPTIONS } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

const EMPTY_DRAFT: BouquetDraft = {
  name: "",
  category: "",
  description: "",
  basePrice: 0,
  status: "draft",
  images: [],
};

type AdminBouquetFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialDraft?: BouquetDraft | null;
  onSave: (draft: BouquetDraft) => void;
  onCancel: () => void;
};

export function AdminBouquetForm({
  open,
  mode,
  initialDraft,
  onSave,
  onCancel,
}: AdminBouquetFormProps) {
  const [draft, setDraft] = useState<BouquetDraft>(EMPTY_DRAFT);
  const categories = getAllCatalogCategories();

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(
      initialDraft
        ? {
            ...initialDraft,
            images: normalizeBouquetImages(initialDraft.images),
          }
        : EMPTY_DRAFT,
    );
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!draft.name.trim() || !draft.category) {
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      basePrice: Math.max(0, Number(draft.basePrice) || 0),
      images: normalizeBouquetImages(draft.images),
    });
  };

  return (
    <div className={styles.formOverlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.formSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-bouquet-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.formHeader}>
          <div>
            <p className={styles.formEyebrow}>
              {mode === "create" ? "Новый букет" : "Редактирование"}
            </p>
            <h3 id="admin-bouquet-form-title" className={styles.formTitle}>
              {mode === "create" ? "Добавить букет" : "Редактировать букет"}
            </h3>
          </div>
          <button
            type="button"
            className={styles.formClose}
            onClick={onCancel}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <form className={styles.formBody} onSubmit={handleSubmit}>
          <AdminBouquetPhotoUpload
            images={draft.images}
            onChange={(images) => setDraft((prev) => ({ ...prev, images }))}
          />

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Название</span>
            <input
              className={styles.fieldInput}
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Например, Нежная роза"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Категория</span>
            <select
              className={styles.fieldInput}
              value={draft.category}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, category: event.target.value }))
              }
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Краткое описание</span>
            <textarea
              className={`${styles.fieldInput} ${styles.fieldTextarea}`}
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Краткое описание для админки"
              rows={3}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Базовая цена</span>
            <input
              className={styles.fieldInput}
              type="number"
              min={0}
              step={100}
              value={draft.basePrice || ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  basePrice: Number(event.target.value),
                }))
              }
              placeholder="0"
            />
          </label>

          <fieldset className={styles.statusFieldset}>
            <legend className={styles.fieldLabel}>Статус</legend>
            <div className={styles.statusRow}>
              {BOUQUET_STATUS_OPTIONS.map((option) => (
                <label key={option.value} className={styles.statusOption}>
                  <input
                    type="radio"
                    name="bouquet-status"
                    value={option.value}
                    checked={draft.status === option.value}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        status: option.value as BouquetStatus,
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className={styles.primaryButton}>
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
