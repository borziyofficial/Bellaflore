// ==================================================
// SECTION: ADMIN APP — Bouquet form (Stage 2.4)
// ==================================================
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminBouquetBadgePicker } from "@/components/adminApp/modules/bouquets/AdminBouquetBadgePicker";
import { AdminBouquetCategoryField } from "@/components/adminApp/modules/bouquets/AdminBouquetCategoryField";
import { AdminBouquetDisplayFlags } from "@/components/adminApp/modules/bouquets/AdminBouquetDisplayFlags";
import { AdminBouquetLivePreview } from "@/components/adminApp/modules/bouquets/AdminBouquetLivePreview";
import { AdminBouquetPhotoUpload } from "@/components/adminApp/modules/bouquets/AdminBouquetPhotoUpload";
import { AdminBouquetPreviewModal } from "@/components/adminApp/modules/bouquets/AdminBouquetPreviewModal";
import { AdminBouquetSizePicker } from "@/components/adminApp/modules/bouquets/AdminBouquetSizePicker";
import { AdminBouquetStatusPicker } from "@/components/adminApp/modules/bouquets/AdminBouquetStatusPicker";
import { normalizeBouquetImages } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  createDefaultBouquetDisplayFlags,
  normalizeBouquetBadge,
  normalizeBouquetDisplayFlags,
  normalizeBouquetDisplayPriority,
  normalizeBouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetManageUtils";
import {
  createEmptyBouquetSizes,
  normalizeBouquetSizes,
} from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import { useAdminBouquetCategories } from "@/components/adminApp/modules/bouquets/useAdminBouquetCategories";
import type { BouquetDraft } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

const EMPTY_DRAFT: BouquetDraft = {
  name: "",
  category: "",
  description: "",
  basePrice: 0,
  status: "draft",
  displayFlags: createDefaultBouquetDisplayFlags(),
  displayPriority: 100,
  badge: "none",
  images: [],
  sizes: createEmptyBouquetSizes(),
};

function normalizeDraft(draft: BouquetDraft): BouquetDraft {
  return {
    ...draft,
    status: normalizeBouquetStatus(draft.status),
    displayFlags: normalizeBouquetDisplayFlags(draft.displayFlags),
    displayPriority: normalizeBouquetDisplayPriority(draft.displayPriority),
    badge: normalizeBouquetBadge(draft.badge),
    images: normalizeBouquetImages(draft.images),
    sizes: normalizeBouquetSizes(draft.sizes),
  };
}

type AdminBouquetFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialDraft?: BouquetDraft | null;
  onSave: (draft: BouquetDraft) => boolean | Promise<boolean>;
  onCancel: () => void;
};

type ValidationErrors = {
  name?: string;
  category?: string;
  basePrice?: string;
  images?: string;
  save?: string;
};

function validateDraft(draft: BouquetDraft): ValidationErrors {
  const errors: ValidationErrors = {};
  const price = Number(draft.basePrice);

  if (!draft.name.trim()) {
    errors.name = "Введите название букета.";
  }

  if (!draft.category) {
    errors.category = "Выберите категорию.";
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.basePrice = "Введите цену больше 0.";
  }

  if (draft.images.length === 0) {
    errors.images = "Выберите фото букета.";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function AdminBouquetForm({
  open,
  mode,
  initialDraft,
  onSave,
  onCancel,
}: AdminBouquetFormProps) {
  const [draft, setDraft] = useState<BouquetDraft>(EMPTY_DRAFT);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const { categories, createCategory, updateCategoryName } = useAdminBouquetCategories();
  const categoryName =
    categories.find((category) => category.id === draft.category)?.name ??
    draft.category ??
    "Категория";

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewOpen(false);
      return;
    }

    setDraft(initialDraft ? normalizeDraft(initialDraft) : EMPTY_DRAFT);
    setValidationErrors({});
    setSaving(false);
    setPhotoBusy(false);
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (previewOpen) {
          setPreviewOpen(false);
          return;
        }

        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, previewOpen]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (saving || photoBusy) {
      return;
    }

    const errors = validateDraft(draft);
    if (hasValidationErrors(errors)) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    setValidationErrors({});

    try {
      const saved = await onSave(
        normalizeDraft({
          ...draft,
          name: draft.name.trim(),
          description: draft.description.trim(),
          basePrice: Number(draft.basePrice),
        }),
      );

      if (!saved) {
        setValidationErrors({ save: "Не удалось сохранить букет." });
        setSaving(false);
      }
    } catch {
      setValidationErrors({ save: "Не удалось сохранить букет." });
      setSaving(false);
    }
  };

  const updateDraft = (patch: Partial<BouquetDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationErrors((prev) => ({ ...prev, save: undefined }));
  };

  const published = draft.status === "active";

  return (
    <>
      <div className={styles.formOverlay} role="presentation" onClick={onCancel}>
        <div
          className={styles.formSheet}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-bouquet-form-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className={styles.formHeader}>
            <div className={styles.formHeaderMain}>
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
              <span className={styles.formCloseIcon} aria-hidden="true">
                ×
              </span>
            </button>
          </header>

          <form className={styles.formBody} onSubmit={handleSubmit} noValidate>
            <AdminBouquetLivePreview draft={draft} categoryName={categoryName} />

            <AdminBouquetPhotoUpload
              images={draft.images}
              onChange={(images) => updateDraft({ images })}
              onBusyChange={setPhotoBusy}
            />
            {validationErrors.images ? (
              <p className={styles.fieldError}>{validationErrors.images}</p>
            ) : null}

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.fieldInput}
                value={draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                placeholder="Например, Нежная роза"
                required
              />
              {validationErrors.name ? (
                <span className={styles.fieldError}>{validationErrors.name}</span>
              ) : null}
            </label>

            <AdminBouquetCategoryField
              value={draft.category}
              categories={categories}
              onChange={(categoryId) =>
                updateDraft({ category: categoryId })
              }
              onCreateCategory={createCategory}
              onRenameCategory={updateCategoryName}
            />
            {validationErrors.category ? (
              <p className={styles.fieldError}>{validationErrors.category}</p>
            ) : null}

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Краткое описание</span>
              <textarea
                className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                value={draft.description}
                onChange={(event) =>
                  updateDraft({ description: event.target.value })
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
                step={1}
                value={draft.basePrice || ""}
                onChange={(event) =>
                  updateDraft({
                    basePrice: Number(event.target.value),
                  })
                }
                placeholder="0"
                required
              />
              {validationErrors.basePrice ? (
                <span className={styles.fieldError}>{validationErrors.basePrice}</span>
              ) : null}
            </label>

            <AdminBouquetSizePicker
              sizes={draft.sizes}
              onChange={(sizes) => updateDraft({ sizes })}
            />

            <label className={styles.publishToggleRow}>
              <span className={styles.publishToggleText}>
                <span className={styles.toggleLabel}>Опубликовать</span>
                <span className={styles.publishToggleHint}>
                  {published ? "Букет виден в каталоге" : "Букет сохранится как черновик"}
                </span>
              </span>
              <input
                className={styles.toggleInput}
                type="checkbox"
                checked={published}
                onChange={(event) =>
                  updateDraft({ status: event.target.checked ? "active" : "draft" })
                }
                aria-label="Опубликовать букет"
              />
            </label>

            <AdminBouquetStatusPicker
              value={draft.status}
              onChange={(status) => updateDraft({ status })}
            />

            <AdminBouquetDisplayFlags
              flags={draft.displayFlags}
              onChange={(displayFlags) => updateDraft({ displayFlags })}
            />

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Приоритет показа</span>
              <input
                className={styles.fieldInput}
                type="number"
                min={1}
                step={1}
                value={draft.displayPriority}
                onChange={(event) =>
                  updateDraft({
                    displayPriority: normalizeBouquetDisplayPriority(event.target.value),
                  })
                }
                placeholder="100"
              />
            </label>

            <AdminBouquetBadgePicker
              value={draft.badge}
              onChange={(badge) => updateDraft({ badge })}
            />

            {validationErrors.save ? (
              <p className={styles.formError}>{validationErrors.save}</p>
            ) : null}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onCancel}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setPreviewOpen(true)}
                disabled={saving}
              >
                Предпросмотр
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saving || photoBusy}
              >
                {saving ? "Сохранение..." : photoBusy ? "Фото загружается..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AdminBouquetPreviewModal
        open={previewOpen}
        draft={draft}
        categoryName={categoryName}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
