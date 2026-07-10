// ==================================================
// SECTION: Admin Catalog Manager — fast product create V2
// РАЗДЕЛ: Быстрое создание товара (premium mobile)
// ==================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminProductPreviewCard } from "@/components/adminCatalogManager/AdminProductPreviewCard";
import { FastCategoryPicker } from "@/components/adminCatalogManager/FastCategoryPicker";
import { FastPhotoUpload } from "@/components/adminCatalogManager/FastPhotoUpload";
import type {
  AdminProductFormErrors,
  AdminProductFormState,
  MockAiBundle,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { recordCategoryUse } from "@/components/adminCatalogManager/adminCategoryPreferences";
import {
  prepareAdminProductFormForPublish,
  validateAdminProductForm,
} from "@/components/adminCatalogManager/adminProductFormValidation";
import {
  applyAiFieldsToForm,
  buildAiFieldPreviews,
  type AiFieldPreview,
  type AiSuggestionFieldKey,
} from "@/components/adminCatalogManager/applyAiSelectively";
import { slugifyProductTitle } from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { generateMockAiBundle } from "@/components/adminCatalogManager/mockAiAssistant";
import { resolveAiHint } from "@/components/adminCatalogManager/mockAiHintUtils";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/FastProductCreate.module.css";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;

type FastProductCreateProps = {
  initialForm: AdminProductFormState;
  buildPreviewRecord: (form: AdminProductFormState) => CatalogProductRecord;
  onPublish: (form: AdminProductFormState) => void;
  onSaveDraft: (form: AdminProductFormState) => void;
  onCancel: () => void;
  onSwitchToAdvanced: (form: AdminProductFormState) => void;
  isSaving?: boolean;
};

function getInitialBasePrice(form: AdminProductFormState): string {
  return (
    form.sizePrices.M.trim() ||
    form.sizePrices.S.trim() ||
    form.sizePrices.L.trim() ||
    form.sizePrices.XL.trim()
  );
}

export function FastProductCreate({
  initialForm,
  buildPreviewRecord,
  onPublish,
  onSaveDraft,
  onCancel,
  onSwitchToAdvanced,
  isSaving = false,
}: FastProductCreateProps) {
  const [form, setForm] = useState(initialForm);
  const [basePrice, setBasePrice] = useState(getInitialBasePrice(initialForm));
  const [errors, setErrors] = useState<AdminProductFormErrors>({});
  const [aiBundle, setAiBundle] = useState<MockAiBundle | null>(null);
  const [aiPreviews, setAiPreviews] = useState<AiFieldPreview[]>([]);
  const [aiSelection, setAiSelection] = useState<Set<AiSuggestionFieldKey>>(
    new Set(),
  );
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const updateForm = useCallback((patch: Partial<AdminProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const previewForm = useMemo(
    () => prepareAdminProductFormForPublish(form, basePrice),
    [form, basePrice],
  );
  const previewRecord = useMemo(
    () => buildPreviewRecord(previewForm),
    [buildPreviewRecord, previewForm],
  );

  const buildPublishForm = (): AdminProductFormState => ({
    ...prepareAdminProductFormForPublish(form, basePrice),
    status: "published",
  });

  const submitPublish = () => {
    const publishForm = buildPublishForm();
    const nextErrors = validateAdminProductForm(publishForm, {
      requireImage: true,
      requireSlug: false,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    recordCategoryUse(publishForm.categoryId);
    onPublish(publishForm);
  };

  const submitDraft = () => {
    const draftForm = prepareAdminProductFormForPublish(
      { ...form, status: "draft" },
      basePrice,
    );
    const nextErrors = validateAdminProductForm(draftForm, {
      requireImage: false,
      requireSlug: false,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSaveDraft(draftForm);
    setStatusNote("Черновик сохранён.");
  };

  const runAiSuggest = async () => {
    setIsAiLoading(true);

    try {
      const hint = resolveAiHint({
        fileName: form.mainImageUrl ? "bouquet.jpg" : undefined,
        formTitle: form.title,
      });
      const bundle = generateMockAiBundle(hint, { formTitle: form.title });
      const previews = buildAiFieldPreviews(form, bundle);

      if (previews.length === 0) {
        setStatusNote("AI не нашёл новых подсказок для пустых полей.");
        return;
      }

      setAiBundle(bundle);
      setAiPreviews(previews);
      setAiSelection(
        new Set(
          previews.filter((item) => item.defaultChecked).map((item) => item.key),
        ),
      );
      setAiSheetOpen(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSelection = () => {
    if (!aiBundle || aiSelection.size === 0) {
      setAiSheetOpen(false);
      return;
    }

    const nextForm = applyAiFieldsToForm(form, aiBundle, aiSelection);
    setForm(nextForm);

    if (aiSelection.has("sizePrices")) {
      setBasePrice(
        nextForm.sizePrices.M ||
          nextForm.sizePrices.S ||
          nextForm.sizePrices.L ||
          nextForm.sizePrices.XL,
      );
    }

    if (aiSelection.has("categoryId")) {
      recordCategoryUse(nextForm.categoryId);
    }

    setAiSheetOpen(false);
    setStatusNote("AI-подсказки применены.");
  };

  const toggleAiField = (key: AiSuggestionFieldKey, checked: boolean) => {
    setAiSelection((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  return (
    <>
      <div className={styles.shell}>
        <header className={styles.header}>
          <button type="button" className={styles.backButton} onClick={onCancel}>
            ← Назад
          </button>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Fast Mode</p>
            <h1 className={styles.title}>Новый товар</h1>
          </div>
          <button
            type="button"
            className={styles.advancedLink}
            onClick={() => onSwitchToAdvanced(form)}
          >
            Open Advanced Editor
          </button>
        </header>

        {statusNote ? <p className={styles.note}>{statusNote}</p> : null}

        <div className={styles.form}>
          <div className={styles.card}>
            <FastPhotoUpload
              imageUrl={form.mainImageUrl}
              imageAlt={form.mainImageAlt || form.title}
              onImageChange={(patch) => updateForm(patch)}
              onAiSuggest={() => void runAiSuggest()}
              isAiLoading={isAiLoading}
              error={errors.mainImageUrl}
            />
          </div>

          <div className={styles.card}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={form.title}
                placeholder="Букет из 25 роз"
                onChange={(event) => {
                  const title = event.target.value;
                  updateForm({
                    title,
                    slug:
                      !form.slug.trim() || form.slug === slugifyProductTitle(form.title)
                        ? slugifyProductTitle(title)
                        : form.slug,
                  });
                }}
              />
              {errors.title ? <span className={styles.error}>{errors.title}</span> : null}
            </label>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Категория</span>
              <FastCategoryPicker
                value={form.categoryId}
                onChange={(categoryId) => {
                  recordCategoryUse(categoryId);
                  updateForm({ categoryId });
                }}
                error={errors.categoryId}
              />
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Цена, ₽</span>
              <input
                className={`${styles.input} ${styles.priceInput}`}
                inputMode="numeric"
                placeholder="4500"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
              />
              {errors.sizePrices ? (
                <span className={styles.error}>{errors.sizePrices}</span>
              ) : null}
            </label>
          </div>

          <details className={styles.advanced}>
            <summary className={styles.advancedSummary}>Advanced</summary>
            <div className={styles.advancedBody}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Описание</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.shortDescription}
                  onChange={(event) =>
                    updateForm({ shortDescription: event.target.value })
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

              <div className={styles.sizeGrid}>
                {SIZE_IDS.map((sizeId) => (
                  <label key={sizeId} className={styles.field}>
                    <span className={styles.fieldLabel}>{sizeId}</span>
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      placeholder="₽"
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

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Наличие</span>
                <select
                  className={styles.select}
                  value={form.availability}
                  onChange={(event) =>
                    updateForm({
                      availability: event.target.value as AdminProductFormState["availability"],
                    })
                  }
                >
                  <option value="in_stock">В наличии</option>
                  <option value="out_of_stock">Нет в наличии</option>
                  <option value="coming_soon">Скоро</option>
                  <option value="made_to_order">Под заказ</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>SEO-заголовок</span>
                <input
                  className={styles.input}
                  value={form.seoTitle}
                  placeholder="Авто при публикации"
                  onChange={(event) => updateForm({ seoTitle: event.target.value })}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>SEO-описание</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.seoDescription}
                  placeholder="Авто при публикации"
                  onChange={(event) =>
                    updateForm({ seoDescription: event.target.value })
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Slug</span>
                <input
                  className={styles.input}
                  value={form.seoSlug || form.slug}
                  placeholder="Авто из названия"
                  onChange={(event) =>
                    updateForm({ slug: event.target.value, seoSlug: event.target.value })
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Alt-текст</span>
                <input
                  className={styles.input}
                  value={form.seoImageAlt || form.mainImageAlt}
                  onChange={(event) =>
                    updateForm({
                      seoImageAlt: event.target.value,
                      mainImageAlt: event.target.value,
                    })
                  }
                />
              </label>

              <details className={styles.technicalBlock}>
                <summary className={styles.technicalSummary}>Technical data</summary>
                <pre className={styles.technicalPre}>
                  {JSON.stringify(
                    {
                      slug: form.seoSlug || form.slug,
                      seoTitle: form.seoTitle,
                      seoDescription: form.seoDescription,
                      availability: form.availability,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          </details>
        </div>

        <footer className={styles.fixedBar}>
          <div className={styles.fixedBarInner}>
            <button
              type="button"
              className={styles.draftButton}
              onClick={submitDraft}
              disabled={isSaving}
            >
              Save Draft
            </button>
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
            <button
              type="button"
              className={styles.publishButton}
              onClick={submitPublish}
              disabled={isSaving}
            >
              {isSaving ? "…" : "Publish"}
            </button>
          </div>
        </footer>
      </div>

      {previewOpen ? (
        <div
          className={styles.sheetOverlay}
          role="presentation"
          onClick={() => setPreviewOpen(false)}
        >
          <section
            className={styles.previewSheet}
            role="dialog"
            aria-label="Preview"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Preview</h2>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setPreviewOpen(false)}
              >
                ×
              </button>
            </header>
            <AdminProductPreviewCard product={previewRecord} />
          </section>
        </div>
      ) : null}

      {aiSheetOpen ? (
        <div className={styles.sheetOverlay} role="presentation">
          <section className={styles.aiSheet} aria-label="AI Suggest">
            <header className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>✨ AI Suggest</h2>
              <button
                type="button"
                className={styles.sheetClose}
                onClick={() => setAiSheetOpen(false)}
              >
                ×
              </button>
            </header>
            <p className={styles.note}>
              Выберите поля для применения. Заполненные значения не перезаписываются
              автоматически.
            </p>
            <ul className={styles.aiFieldList}>
              {aiPreviews.map((preview) => (
                <li key={preview.key} className={styles.aiFieldItem}>
                  <label className={styles.aiFieldLabel}>
                    <input
                      type="checkbox"
                      checked={aiSelection.has(preview.key)}
                      onChange={(event) =>
                        toggleAiField(preview.key, event.target.checked)
                      }
                    />
                    {preview.label}
                  </label>
                  <div className={styles.aiFieldValues}>
                    <span>{preview.currentValue || "Пусто"}</span>
                    <span>→ {preview.suggestedValue}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.aiApplyButton}
              onClick={applyAiSelection}
            >
              Apply selected
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
