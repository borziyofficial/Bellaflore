// ==================================================
// SECTION: Admin Catalog Manager — fast product create
// РАЗДЕЛ: Быстрое создание товара (1 экран)
// ==================================================
"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  AdminProductFormErrors,
  AdminProductFormState,
  MockAiBundle,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  createAdminCustomCategory,
  getAdminProductCategories,
} from "@/components/adminCatalogManager/adminCustomCategories";
import {
  fileToDataUrl,
  persistProductImageFile,
  shouldUseUnoptimizedImage,
} from "@/components/adminCatalogManager/adminImagePersistence";
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
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/FastProductCreate.module.css";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;

type FastProductCreateProps = {
  initialForm: AdminProductFormState;
  onPublish: (form: AdminProductFormState) => void;
  onSaveDraft: (form: AdminProductFormState) => void;
  onCancel: () => void;
  onSwitchToAdvanced: (form: AdminProductFormState) => void;
  isSaving?: boolean;
  imageStorageWarning?: string | null;
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
  onPublish,
  onSaveDraft,
  onCancel,
  onSwitchToAdvanced,
  isSaving = false,
  imageStorageWarning = null,
}: FastProductCreateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [basePrice, setBasePrice] = useState(getInitialBasePrice(initialForm));
  const [errors, setErrors] = useState<AdminProductFormErrors>({});
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<CatalogCategoryRecord[]>(() =>
    getAdminProductCategories(),
  );
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [aiBundle, setAiBundle] = useState<MockAiBundle | null>(null);
  const [aiPreviews, setAiPreviews] = useState<AiFieldPreview[]>([]);
  const [aiSelection, setAiSelection] = useState<Set<AiSuggestionFieldKey>>(
    new Set(),
  );
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const updateForm = useCallback((patch: Partial<AdminProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const refreshCategories = useCallback(() => {
    setCategories(getAdminProductCategories());
  }, []);

  const handleImageFile = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setUploadNote("Выберите изображение (JPEG, PNG, WebP).");
      return;
    }

    setUploadNote(null);
    setIsUploading(true);

    try {
      const instantPreview = await fileToDataUrl(file);
      updateForm({
        mainImageUrl: instantPreview,
        mainImageTemporary: true,
        mainImageStorage: "none",
      });

      const persisted = await persistProductImageFile(file);
      updateForm({
        mainImageUrl: persisted.url,
        mainImageStorage: persisted.storage,
        mainImageTemporary: false,
      });
      setUploadNote("Фото загружено.");
    } catch (error) {
      setUploadNote(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить изображение.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCategory = () => {
    setCategoryError(null);

    try {
      const created = createAdminCustomCategory(newCategoryTitle);
      refreshCategories();
      updateForm({ categoryId: created.id });
      setNewCategoryTitle("");
      setShowNewCategory(false);
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Не удалось создать категорию.",
      );
    }
  };

  const buildPublishForm = (): AdminProductFormState => {
    const withPrice = prepareAdminProductFormForPublish(form, basePrice);
    return { ...withPrice, status: "published" };
  };

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
        setUploadNote("AI не нашёл новых подсказок для пустых полей.");
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

    setAiSheetOpen(false);
    setUploadNote("AI-подсказки применены.");
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

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  return (
    <>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <button type="button" className={styles.backButton} onClick={onCancel}>
              ← Назад
            </button>
            <p className={styles.eyebrow}>Быстрое добавление</p>
            <h1 className={styles.title}>Новый товар</h1>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.advancedLink}
              onClick={() => onSwitchToAdvanced(form)}
            >
              Расширенный режим
            </button>
          </div>
        </header>

        {imageStorageWarning ? (
          <p className={styles.warning}>{imageStorageWarning}</p>
        ) : null}

        <div className={styles.form}>
          <section className={styles.photoSection} aria-label="Фото товара">
            <div className={styles.photoFrame}>
              {form.mainImageUrl ? (
                <Image
                  src={form.mainImageUrl}
                  alt={form.mainImageAlt || form.title || "Фото товара"}
                  fill
                  sizes="(max-width: 560px) 100vw, 400px"
                  className={styles.photoImage}
                  unoptimized={shouldUseUnoptimizedImage(form.mainImageUrl)}
                />
              ) : (
                <div className={styles.photoEmpty}>
                  <span className={styles.photoIcon} aria-hidden="true">
                    📷
                  </span>
                  <span>Добавьте фото букета — это первый шаг</span>
                </div>
              )}
            </div>

            <div className={styles.photoActions}>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading
                  ? "Загрузка…"
                  : form.mainImageUrl
                    ? "Заменить фото"
                    : "Загрузить фото"}
              </button>
              {form.mainImageUrl ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    updateForm({
                      mainImageUrl: "",
                      mainImageStorage: "none",
                      mainImageTemporary: false,
                    })
                  }
                >
                  Удалить
                </button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.hiddenInput}
              onChange={(event) => {
                void handleImageFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {errors.mainImageUrl ? (
              <p className={styles.error}>{errors.mainImageUrl}</p>
            ) : null}
            {uploadNote ? <p className={styles.note}>{uploadNote}</p> : null}
          </section>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Название</span>
            <input
              className={styles.input}
              value={form.title}
              placeholder="Например: Букет из 25 роз"
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

          <div className={styles.categoryRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Категория</span>
              <select
                className={styles.select}
                value={form.categoryId}
                onChange={(event) => updateForm({ categoryId: event.target.value })}
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
              {errors.categoryId ? (
                <span className={styles.error}>{errors.categoryId}</span>
              ) : null}
            </label>

            {!showNewCategory ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowNewCategory(true)}
              >
                + Новая категория
              </button>
            ) : (
              <div className={styles.newCategoryBox}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Название категории</span>
                  <input
                    className={styles.input}
                    value={newCategoryTitle}
                    placeholder="Например: Тюльпаны"
                    onChange={(event) => setNewCategoryTitle(event.target.value)}
                  />
                </label>
                {categoryError ? (
                  <p className={styles.error}>{categoryError}</p>
                ) : null}
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategoryTitle("");
                      setCategoryError(null);
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={handleCreateCategory}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}
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

          <button
            type="button"
            className={styles.aiButton}
            onClick={() => void runAiSuggest()}
            disabled={isAiLoading}
          >
            {isAiLoading ? "AI думает…" : "✨ AI заполнить"}
          </button>

          <details className={styles.details}>
            <summary className={styles.detailsSummary}>Дополнительно</summary>
            <div className={styles.detailsBody}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Краткое описание</span>
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
                <span className={styles.fieldLabel}>URL (slug)</span>
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
                <span className={styles.fieldLabel}>SEO-заголовок</span>
                <input
                  className={styles.input}
                  value={form.seoTitle}
                  placeholder="Заполнится автоматически"
                  onChange={(event) => updateForm({ seoTitle: event.target.value })}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>SEO-описание</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.seoDescription}
                  placeholder="Заполнится автоматически"
                  onChange={(event) =>
                    updateForm({ seoDescription: event.target.value })
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Alt-текст фото</span>
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
            </div>
          </details>
        </div>

        <div className={styles.fixedBar}>
          <div className={styles.fixedBarInner}>
            <button
              type="button"
              className={styles.publishButton}
              onClick={submitPublish}
              disabled={isSaving}
            >
              {isSaving ? "Публикация…" : "Опубликовать"}
            </button>
            <button
              type="button"
              className={styles.draftButton}
              onClick={submitDraft}
              disabled={isSaving}
            >
              Сохранить черновик
            </button>
          </div>
        </div>
      </div>

      {aiSheetOpen ? (
        <div className={styles.aiOverlay} role="presentation">
          <section className={styles.aiSheet} aria-label="AI подсказки">
            <div className={styles.aiSheetHeader}>
              <h2 className={styles.aiSheetTitle}>AI подсказки</h2>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAiSheetOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <p className={styles.note}>
              Отмечены только пустые поля. Заполненные значения не перезаписываются
              без вашего выбора.
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
                    {preview.currentValue ? (
                      <span>Текущее: {preview.currentValue}</span>
                    ) : (
                      <span>Текущее: пусто</span>
                    )}
                    <span>Предложение: {preview.suggestedValue}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.aiApplyButton}
              onClick={applyAiSelection}
            >
              Применить выбранное
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
