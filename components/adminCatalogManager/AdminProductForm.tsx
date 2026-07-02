// ==================================================
// SECTION: Admin Catalog Manager — product form
// РАЗДЕЛ: Форма товара
// ==================================================
"use client";

import { useMemo, useState } from "react";
import type {
  AdminProductFormErrors,
  AdminProductFormState,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { AdminProductAiPanel } from "@/components/adminCatalogManager/AdminProductAiPanel";
import { AdminProductImageUpload } from "@/components/adminCatalogManager/AdminProductImageUpload";
import { AdminProductPreviewCard } from "@/components/adminCatalogManager/AdminProductPreviewCard";
import { slugifyProductTitle } from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { CATALOG_CATEGORIES } from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;

type AdminProductFormProps = {
  initialForm: AdminProductFormState;
  mode: "create" | "edit";
  buildPreviewRecord: (form: AdminProductFormState) => CatalogProductRecord;
  onSaveDraft: (form: AdminProductFormState) => void;
  onPublish: (form: AdminProductFormState) => void;
  onCancel: () => void;
};

function validateForm(form: AdminProductFormState): AdminProductFormErrors {
  const errors: AdminProductFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Укажите название товара.";
  }

  if (!form.slug.trim()) {
    errors.slug = "Укажите slug.";
  }

  if (!form.categoryId) {
    errors.categoryId = "Выберите категорию.";
  }

  const hasPrice = SIZE_IDS.some((sizeId) => {
    const value = Number(form.sizePrices[sizeId].replace(/\s/g, ""));
    return Number.isFinite(value) && value > 0;
  });

  if (!hasPrice) {
    errors.sizePrices = "Укажите хотя бы одну цену размера (S/M/L/XL).";
  }

  return errors;
}

export function AdminProductForm({
  initialForm,
  mode,
  buildPreviewRecord,
  onSaveDraft,
  onPublish,
  onCancel,
}: AdminProductFormProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<AdminProductFormErrors>({});

  const previewRecord = useMemo(() => buildPreviewRecord(form), [buildPreviewRecord, form]);

  const updateForm = (patch: Partial<AdminProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleTitleChange = (title: string) => {
    const nextSlug =
      !form.slug.trim() || form.slug === slugifyProductTitle(form.title)
        ? slugifyProductTitle(title)
        : form.slug;

    updateForm({ title, slug: nextSlug });
  };

  const submit = (status: "draft" | "published") => {
    const nextForm = { ...form, status };
    const nextErrors = validateForm(nextForm);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (status === "published") {
      onPublish(nextForm);
      return;
    }

    onSaveDraft(nextForm);
  };

  return (
    <div className={styles.formLayout}>
      <div className={styles.formColumn}>
        <header className={styles.formHeader}>
          <div>
            <p className={styles.formEyebrow}>
              {mode === "create" ? "Новый товар" : "Редактирование"}
            </p>
            <h2 className={styles.formTitle}>
              {mode === "create" ? "Добавить букет" : form.title || "Товар"}
            </h2>
          </div>
          <div className={styles.formHeaderActions}>
            <button type="button" className={styles.ghostButton} onClick={onCancel}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => submit("draft")}
            >
              Сохранить черновик
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => submit("published")}
            >
              Опубликовать
            </button>
          </div>
        </header>

        <AdminProductAiPanel form={form} onApply={setForm} />

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Основные данные</h3>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
              {errors.title ? <span className={styles.error}>{errors.title}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Slug</span>
              <input
                className={styles.input}
                value={form.slug}
                onChange={(event) => updateForm({ slug: event.target.value })}
              />
              {errors.slug ? <span className={styles.error}>{errors.slug}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Категория</span>
              <select
                className={styles.select}
                value={form.categoryId}
                onChange={(event) => updateForm({ categoryId: event.target.value })}
              >
                {CATALOG_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Теги (через запятую)</span>
              <input
                className={styles.input}
                value={form.tags}
                onChange={(event) => updateForm({ tags: event.target.value })}
              />
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Описание</h3>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Краткое описание</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.shortDescription}
                onChange={(event) =>
                  updateForm({ shortDescription: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Полное описание</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.fullDescription}
                onChange={(event) =>
                  updateForm({ fullDescription: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Состав</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.composition}
                onChange={(event) => updateForm({ composition: event.target.value })}
              />
            </label>
          </div>
        </section>

        <AdminProductImageUpload
          mainImageUrl={form.mainImageUrl}
          mainImageAlt={form.mainImageAlt}
          mainImageTemporary={form.mainImageTemporary}
          galleryUrls={form.galleryUrls}
          onMainImageChange={(url, temporary) =>
            updateForm({ mainImageUrl: url, mainImageTemporary: temporary })
          }
          onMainImageAltChange={(alt) => updateForm({ mainImageAlt: alt })}
          onGalleryChange={(urls) => updateForm({ galleryUrls: urls })}
        />

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Размеры и цены</h3>
          </div>
          <div className={styles.sizeGrid}>
            {SIZE_IDS.map((sizeId) => (
              <label key={sizeId} className={styles.field}>
                <span className={styles.fieldLabel}>{sizeId} · ₽</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={form.sizePrices[sizeId]}
                  onChange={(event) =>
                    updateForm({
                      sizePrices: {
                        ...form.sizePrices,
                        [sizeId]: event.target.value,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          {errors.sizePrices ? (
            <span className={styles.error}>{errors.sizePrices}</span>
          ) : null}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Флаги и SEO</h3>
          </div>
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateForm({ isFeatured: event.target.checked })}
              />
              <span>Featured</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(event) => updateForm({ isNew: event.target.checked })}
              />
              <span>New</span>
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isBestseller}
                onChange={(event) =>
                  updateForm({ isBestseller: event.target.checked })
                }
              />
              <span>Bestseller</span>
            </label>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO title</span>
              <input
                className={styles.input}
                value={form.seoTitle}
                onChange={(event) => updateForm({ seoTitle: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO description</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.seoDescription}
                onChange={(event) =>
                  updateForm({ seoDescription: event.target.value })
                }
              />
            </label>
          </div>
        </section>
      </div>

      <aside className={styles.previewColumn}>
        <AdminProductPreviewCard product={previewRecord} />
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Статус</h3>
          </div>
          <p className={styles.statusLine}>
            Текущий режим:{" "}
            <strong>{form.status === "published" ? "Опубликован" : "Черновик"}</strong>
          </p>
          <p className={styles.cardHint}>
            Публичная витрина остаётся на seed-каталоге. Опубликованные admin-товары
            видны в preview и admin-списке.
          </p>
        </section>
      </aside>
    </div>
  );
}
