// ==================================================
// SECTION: Admin Catalog Manager — mock AI panel
// РАЗДЕЛ: Mock AI-панель в форме товара
// ==================================================
"use client";

import { useMemo, useState } from "react";
import type {
  AdminProductFormState,
  MockAiBundle,
  MockAiSuggestionField,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { generateMockAiBundle } from "@/components/adminCatalogManager/mockAiAssistant";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

const SUGGESTION_FIELDS: Array<{
  id: MockAiSuggestionField;
  label: string;
}> = [
  { id: "title", label: "Название" },
  { id: "categoryId", label: "Категория" },
  { id: "shortDescription", label: "Краткое описание" },
  { id: "fullDescription", label: "Полное описание" },
  { id: "composition", label: "Состав" },
  { id: "tags", label: "Теги" },
  { id: "sizePrices", label: "Размеры S–XL" },
  { id: "imageAlt", label: "Alt-текст" },
];

type AdminProductAiPanelProps = {
  form: AdminProductFormState;
  onApply: (nextForm: AdminProductFormState) => void;
  onBundleGenerated: (bundle: MockAiBundle) => void;
};

export function AdminProductAiPanel({
  form,
  onApply,
  onBundleGenerated,
}: AdminProductAiPanelProps) {
  const [bundle, setBundle] = useState<MockAiBundle | null>(null);
  const [selectedFields, setSelectedFields] = useState<MockAiSuggestionField[]>(
    SUGGESTION_FIELDS.map((field) => field.id),
  );

  const suggestions = bundle?.product ?? null;

  const previewLines = useMemo(
    () =>
      suggestions
        ? [
            { label: "Название", value: suggestions.title },
            { label: "Категория", value: suggestions.categoryId },
            { label: "Описание", value: suggestions.shortDescription },
            { label: "Состав", value: suggestions.composition },
            {
              label: "Цены",
              value: `S ${suggestions.sizePrices.S} · M ${suggestions.sizePrices.M} · L ${suggestions.sizePrices.L} · XL ${suggestions.sizePrices.XL} ₽`,
            },
          ]
        : [],
    [suggestions],
  );

  const generateBundle = () => {
    const nextBundle = generateMockAiBundle(form.title);
    setBundle(nextBundle);
    onBundleGenerated(nextBundle);
  };

  const toggleField = (fieldId: MockAiSuggestionField) => {
    setSelectedFields((current) =>
      current.includes(fieldId)
        ? current.filter((item) => item !== fieldId)
        : [...current, fieldId],
    );
  };

  const applySuggestions = (fields: MockAiSuggestionField[]) => {
    if (!suggestions || !bundle) {
      return;
    }

    const nextForm: AdminProductFormState = { ...form };

    if (fields.includes("title")) {
      nextForm.title = suggestions.title;
      if (!form.slug.trim()) {
        nextForm.slug = bundle.seo.seoSlug;
        nextForm.seoSlug = bundle.seo.seoSlug;
      }
    }
    if (fields.includes("categoryId")) {
      nextForm.categoryId = suggestions.categoryId;
    }
    if (fields.includes("shortDescription")) {
      nextForm.shortDescription = suggestions.shortDescription;
    }
    if (fields.includes("fullDescription")) {
      nextForm.fullDescription = suggestions.fullDescription;
    }
    if (fields.includes("composition")) {
      nextForm.composition = suggestions.composition;
    }
    if (fields.includes("tags")) {
      nextForm.tags = suggestions.tags.join(", ");
    }
    if (fields.includes("sizePrices")) {
      nextForm.sizePrices = {
        S: String(suggestions.sizePrices.S),
        M: String(suggestions.sizePrices.M),
        L: String(suggestions.sizePrices.L),
        XL: String(suggestions.sizePrices.XL),
      };
    }
    if (fields.includes("imageAlt")) {
      nextForm.mainImageAlt = suggestions.imageAlt;
      if (!form.seoImageAlt.trim()) {
        nextForm.seoImageAlt = bundle.seo.seoImageAlt;
      }
    }

    onApply(nextForm);
  };

  return (
    <section className={styles.aiPanel} aria-label="AI-помощник">
      <div className={styles.aiHeader}>
        <div>
          <p className={styles.aiEyebrow}>Mock AI · без внешнего API</p>
          <h3 className={styles.cardTitle}>AI заполнить товар</h3>
          <p className={styles.cardHint}>
            Генерирует данные товара и SEO-пакет для SEO AI Manager ниже.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={generateBundle}
        >
          AI заполнить товар
        </button>
      </div>

      {suggestions ? (
        <>
          <div className={styles.aiPreviewList}>
            {previewLines.map((line) => (
              <div key={line.label} className={styles.aiPreviewRow}>
                <span className={styles.aiPreviewLabel}>{line.label}</span>
                <span className={styles.aiPreviewValue}>{line.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.aiFieldGrid}>
            {SUGGESTION_FIELDS.map((field) => (
              <label key={field.id} className={styles.aiCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.aiActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => applySuggestions(selectedFields)}
            >
              Применить выбранное
            </button>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => applySuggestions(SUGGESTION_FIELDS.map((field) => field.id))}
            >
              Принять всё
            </button>
          </div>
        </>
      ) : (
        <p className={styles.note}>
          Нажмите кнопку, чтобы сгенерировать mock-данные товара и SEO.
        </p>
      )}
    </section>
  );
}
