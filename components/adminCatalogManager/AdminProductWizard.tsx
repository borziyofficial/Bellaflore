// ==================================================
// SECTION: Admin Catalog Manager — mobile product wizard
// РАЗДЕЛ: Мобильный мастер создания товара
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
  fileToDataUrl,
  persistProductImageFile,
  shouldUseUnoptimizedImage,
} from "@/components/adminCatalogManager/adminImagePersistence";
import { applyFullMockBundle } from "@/components/adminCatalogManager/applyMockBundle";
import { AdminProductPreviewCard } from "@/components/adminCatalogManager/AdminProductPreviewCard";
import { AdminProductSeoAiPanel } from "@/components/adminCatalogManager/AdminProductSeoAiPanel";
import { AdminProductSeoPreview } from "@/components/adminCatalogManager/AdminProductSeoPreview";
import { slugifyProductTitle } from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { generateMockAiBundle } from "@/components/adminCatalogManager/mockAiAssistant";
import { resolveAiHint } from "@/components/adminCatalogManager/mockAiHintUtils";
import { evaluateSeoFromForm } from "@/components/adminCatalogManager/seoScoreEngine";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BY_ID,
} from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;
const WIZARD_STEPS = [
  "Фото букета",
  "AI-анализ",
  "Карточка товара",
  "SEO оптимизация",
  "Публикация",
] as const;

type WizardStep = 1 | 2 | 3 | 4 | 5;

type AiFlowFlags = {
  photoReceived: boolean;
  aiAnalyzing: boolean;
  titleSuggested: boolean;
  descriptionCreated: boolean;
  categorySelected: boolean;
  sizesSuggested: boolean;
  seoReady: boolean;
};

type AdminProductWizardProps = {
  initialForm: AdminProductFormState;
  mode: "create" | "edit";
  buildPreviewRecord: (form: AdminProductFormState) => CatalogProductRecord;
  onSaveDraft: (form: AdminProductFormState) => void;
  onPublish: (form: AdminProductFormState) => void;
  onArchive?: (form: AdminProductFormState) => void;
  onCancel: () => void;
  isSaving?: boolean;
  imageStorageWarning?: string | null;
};

function validateForm(form: AdminProductFormState): AdminProductFormErrors {
  const errors: AdminProductFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Укажите название товара.";
  }
  if (!form.slug.trim() && !form.seoSlug.trim()) {
    errors.slug = "Укажите URL товара.";
  }
  if (!form.categoryId) {
    errors.categoryId = "Выберите категорию.";
  }
  const hasPrice = SIZE_IDS.some((sizeId) => {
    const value = Number(form.sizePrices[sizeId].replace(/\s/g, ""));
    return Number.isFinite(value) && value > 0;
  });
  if (!hasPrice) {
    errors.sizePrices = "Укажите хотя бы одну цену.";
  }

  return errors;
}

const EMPTY_AI_FLAGS: AiFlowFlags = {
  photoReceived: false,
  aiAnalyzing: false,
  titleSuggested: false,
  descriptionCreated: false,
  categorySelected: false,
  sizesSuggested: false,
  seoReady: false,
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AdminProductWizard({
  initialForm,
  mode,
  buildPreviewRecord,
  onSaveDraft,
  onPublish,
  onArchive,
  onCancel,
  isSaving = false,
  imageStorageWarning = null,
}: AdminProductWizardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<WizardStep>(
    initialForm.mainImageUrl ? 3 : 1,
  );
  const [errors, setErrors] = useState<AdminProductFormErrors>({});
  const [aiBundle, setAiBundle] = useState<MockAiBundle | null>(null);
  const [aiFlags, setAiFlags] = useState<AiFlowFlags>(
    initialForm.title ? { ...EMPTY_AI_FLAGS, seoReady: true, titleSuggested: true, descriptionCreated: true, categorySelected: true, sizesSuggested: true, photoReceived: true } : EMPTY_AI_FLAGS,
  );
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const previewRecord = useMemo(() => buildPreviewRecord(form), [buildPreviewRecord, form]);
  const liveSeo = useMemo(() => evaluateSeoFromForm(form), [form]);
  const categoryTitle =
    CATALOG_CATEGORY_BY_ID[form.categoryId]?.title ?? "—";

  const updateForm = useCallback((patch: Partial<AdminProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const runAutoAiFlow = useCallback(
    async (
      hint: string,
      currentForm: AdminProductFormState,
      options?: { fileName?: string },
    ) => {
      setIsProcessing(true);
      setStep(2);
      setAiFlags({
        photoReceived: true,
        aiAnalyzing: true,
        titleSuggested: false,
        descriptionCreated: false,
        categorySelected: false,
        sizesSuggested: false,
        seoReady: false,
      });

      await delay(400);
      const bundle = generateMockAiBundle(hint, {
        fileName: options?.fileName,
        formTitle: currentForm.title,
      });
      setAiBundle(bundle);

      setAiFlags((flags) => ({ ...flags, titleSuggested: true }));
      await delay(300);
      setAiFlags((flags) => ({ ...flags, descriptionCreated: true, categorySelected: true }));
      await delay(300);
      setAiFlags((flags) => ({ ...flags, sizesSuggested: true }));
      await delay(300);

      const filled = applyFullMockBundle(currentForm, bundle);
      setForm(filled);
      setAiFlags((flags) => ({
        ...flags,
        aiAnalyzing: false,
        seoReady: true,
      }));
      setIsProcessing(false);
      setStep(3);
    },
    [],
  );

  const handleImageFile = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setUploadNote("Выберите изображение (JPEG, PNG, WebP).");
      return;
    }

    setUploadNote(null);
    setSavedNotice(null);

    try {
      const instantPreview = await fileToDataUrl(file);
      const nextForm: AdminProductFormState = {
        ...form,
        mainImageUrl: instantPreview,
        mainImageTemporary: true,
        mainImageStorage: "none",
      };
      setForm(nextForm);
      setAiFlags((flags) => ({ ...flags, photoReceived: true }));

      const persisted = await persistProductImageFile(file);
      const withImage: AdminProductFormState = {
        ...nextForm,
        mainImageUrl: persisted.url,
        mainImageStorage: persisted.storage,
        mainImageTemporary: false,
      };
      setForm(withImage);
      setUploadNote("Фото загружено.");

      const hint = resolveAiHint({
        fileName: file.name,
        formTitle: form.title,
      });
      await runAutoAiFlow(hint, withImage, { fileName: file.name });
    } catch (error) {
      setUploadNote(
        error instanceof Error
          ? error.message
          : "Хранилище изображений не настроено",
      );
    }
  };

  const regenerateAi = async () => {
    const hint = resolveAiHint({ formTitle: form.title });
    await runAutoAiFlow(hint, form);
  };

  const submit = (status: "draft" | "published") => {
    const nextForm = { ...form, status };
    const nextErrors = validateForm(nextForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(3);
      return;
    }
    if (status === "published") {
      onPublish(nextForm);
      return;
    }
    onSaveDraft(nextForm);
    setSavedNotice("Черновик сохранён. Можно обновить страницу — данные останутся.");
  };

  const statusItems: Array<{ key: keyof AiFlowFlags; label: string }> = [
    { key: "photoReceived", label: "Фото получено" },
    { key: "aiAnalyzing", label: "AI анализирует букет" },
    { key: "titleSuggested", label: "Название предложено" },
    { key: "descriptionCreated", label: "Описание создано" },
    { key: "categorySelected", label: "Категория выбрана" },
    { key: "sizesSuggested", label: "Размеры и цены предложены" },
    { key: "seoReady", label: "SEO оптимизация готова" },
  ];

  return (
    <div className={styles.wizardShell}>
      <header className={styles.wizardHeader}>
        <button type="button" className={styles.ghostButton} onClick={onCancel}>
          ← Назад
        </button>
        <div>
          <p className={styles.formEyebrow}>
            {mode === "create" ? "Advanced Product Editor" : "Редактирование товара"}
          </p>
          <h2 className={styles.wizardTitle}>Расширенный редактор</h2>
        </div>
      </header>

      <nav className={styles.wizardSteps} aria-label="Шаги мастера">
        {WIZARD_STEPS.map((label, index) => {
          const stepNumber = (index + 1) as WizardStep;
          return (
            <button
              key={label}
              type="button"
              className={`${styles.wizardStepChip} ${
                step === stepNumber ? styles.wizardStepChipActive : ""
              } ${step > stepNumber ? styles.wizardStepChipDone : ""}`}
              onClick={() => {
                if (stepNumber === 1 || form.mainImageUrl) {
                  setStep(stepNumber);
                }
              }}
            >
              <span className={styles.wizardStepNumber}>{stepNumber}</span>
              <span className={styles.wizardStepLabel}>{label}</span>
            </button>
          );
        })}
      </nav>

      {imageStorageWarning ? (
        <p className={styles.warningBanner}>{imageStorageWarning}</p>
      ) : null}

      {savedNotice ? <p className={styles.successNote}>{savedNotice}</p> : null}

      {step === 1 ? (
        <section className={styles.wizardPanel}>
          <h3 className={styles.cardTitle}>Фото букета</h3>
          <div className={styles.wizardPhotoFrame}>
            {form.mainImageUrl ? (
              <Image
                src={form.mainImageUrl}
                alt={form.mainImageAlt || "Фото букета"}
                fill
                sizes="(max-width: 480px) 100vw, 400px"
                className={styles.wizardPhotoImage}
                unoptimized={shouldUseUnoptimizedImage(form.mainImageUrl)}
              />
            ) : (
              <div className={styles.wizardPhotoEmpty}>Добавьте фото букета</div>
            )}
          </div>
          <div className={styles.wizardActionRow}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => inputRef.current?.click()}
            >
              📷 {form.mainImageUrl ? "Заменить фото" : "Загрузить фото"}
            </button>
            {form.mainImageUrl ? (
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() =>
                  updateForm({
                    mainImageUrl: "",
                    mainImageStorage: "none",
                    mainImageTemporary: false,
                  })
                }
              >
                Удалить фото
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
          {uploadNote ? <p className={styles.note}>{uploadNote}</p> : null}
          {form.mainImageUrl && !isProcessing ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setStep(3)}
            >
              Далее →
            </button>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className={styles.wizardPanel}>
          <h3 className={styles.cardTitle}>AI-анализ</h3>
          <ul className={styles.aiStatusList}>
            {statusItems.map((item) => {
              let done = aiFlags[item.key];
              if (item.key === "aiAnalyzing") {
                done = !aiFlags.aiAnalyzing && aiFlags.titleSuggested;
              }
              const inProgress = item.key === "aiAnalyzing" && aiFlags.aiAnalyzing;
              return (
                <li
                  key={item.key}
                  className={
                    done
                      ? styles.aiStatusDone
                      : inProgress
                        ? styles.aiStatusActive
                        : styles.aiStatusPending
                  }
                >
                  {done ? "✅" : inProgress ? "⏳" : "○"} {item.label}
                </li>
              );
            })}
          </ul>
          {!isProcessing ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setStep(3)}
            >
              К карточке товара →
            </button>
          ) : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className={styles.wizardPanel}>
          <div className={styles.wizardPanelHeader}>
            <h3 className={styles.cardTitle}>Карточка товара</h3>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={regenerateAi}
              disabled={isProcessing}
            >
              Перегенерировать AI
            </button>
          </div>
          <div className={styles.compactSummary}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={form.title}
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
              <span className={styles.fieldLabel}>Состав</span>
              <textarea
                className={styles.textarea}
                rows={2}
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
            {errors.sizePrices ? (
              <span className={styles.error}>{errors.sizePrices}</span>
            ) : null}
          </div>
          <div className={styles.wizardNavRow}>
            <button type="button" className={styles.ghostButton} onClick={() => setStep(1)}>
              ← Фото
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => setStep(4)}>
              SEO →
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className={styles.wizardPanel}>
          <h3 className={styles.cardTitle}>SEO оптимизация</h3>
          <div className={styles.seoScoreBlock}>
            <p className={styles.seoScoreLabel}>SEO-оценка</p>
            <p className={styles.seoScoreValue}>{liveSeo.score}/100</p>
          </div>
          <div className={styles.compactSummary}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO-заголовок</span>
              <input
                className={styles.input}
                value={form.seoTitle}
                onChange={(event) => updateForm({ seoTitle: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO-описание</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.seoDescription}
                onChange={(event) =>
                  updateForm({ seoDescription: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>H1</span>
              <input
                className={styles.input}
                value={form.seoH1}
                onChange={(event) => updateForm({ seoH1: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>URL товара</span>
              <input
                className={styles.input}
                value={form.seoSlug || form.slug}
                onChange={(event) =>
                  updateForm({ seoSlug: event.target.value, slug: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Alt-текст</span>
              <input
                className={styles.input}
                value={form.seoImageAlt}
                onChange={(event) => updateForm({ seoImageAlt: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Ключевые фразы</span>
              <input
                className={styles.input}
                value={form.seoKeywords}
                onChange={(event) => updateForm({ seoKeywords: event.target.value })}
              />
            </label>
          </div>
          <AdminProductSeoPreview form={form} />
          <details className={styles.technicalBlock}>
            <summary className={styles.technicalSummary}>Технические данные</summary>
            <AdminProductSeoAiPanel form={form} aiBundle={aiBundle} onApply={setForm} />
          </details>
          <div className={styles.wizardNavRow}>
            <button type="button" className={styles.ghostButton} onClick={() => setStep(3)}>
              ← Товар
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => setStep(5)}>
              Публикация →
            </button>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className={styles.wizardPanel}>
          <h3 className={styles.cardTitle}>Публикация</h3>
          <p className={styles.cardHint}>
            {categoryTitle} · SEO {liveSeo.score}/100
          </p>
          <AdminProductPreviewCard product={previewRecord} />
          <div className={styles.wizardStickyActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => submit("draft")}
              disabled={isSaving}
            >
              Сохранить черновик
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => submit("published")}
              disabled={isSaving}
            >
              {isSaving ? "Сохранение…" : "Опубликовать"}
            </button>
            {form.id && onArchive ? (
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => onArchive(form)}
                disabled={isSaving}
              >
                Архивировать
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className={styles.wizardFooter}>
        <button
          type="button"
          className={styles.ghostButton}
          onClick={() => setShowTechnical((value) => !value)}
        >
          {showTechnical ? "Скрыть технические данные" : "Технические данные"}
        </button>
      </footer>

      {showTechnical ? (
        <details className={styles.technicalBlock} open>
          <summary className={styles.technicalSummary}>Технические данные</summary>
          <AdminProductSeoAiPanel form={form} aiBundle={aiBundle} onApply={setForm} />
        </details>
      ) : null}
    </div>
  );
}
