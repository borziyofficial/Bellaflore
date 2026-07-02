// ==================================================
// SECTION: Admin Catalog Manager — mock AI panel
// РАЗДЕЛ: Mock AI-панель в форме товара
// ==================================================
"use client";

import { useMemo, useState } from "react";
import type {
  AdminProductFormState,
  MockAiSuggestionField,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { generateMockAiSuggestions } from "@/components/adminCatalogManager/mockAiAssistant";
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
  { id: "seoTitle", label: "SEO title" },
  { id: "seoDescription", label: "SEO description" },
  { id: "imageAlt", label: "Alt-текст" },
];

type AdminProductAiPanelProps = {
  form: AdminProductFormState;
  onApply: (nextForm: AdminProductFormState) => void;
};

export function AdminProductAiPanel({ form, onApply }: AdminProductAiPanelProps) {
  const [suggestions, setSuggestions] = useState(() =>
    generateMockAiSuggestions(form.title),
  );
  const [selectedFields, setSelectedFields] = useState<MockAiSuggestionField[]>(
    SUGGESTION_FIELDS.map((field) => field.id),
  );

  const previewLines = useMemo(
    () => [
      { label: "Название", value: suggestions.title },
      { label: "Категория", value: suggestions.categoryId },
      { label: "Описание", value: suggestions.shortDescription },
      { label: "Состав", value: suggestions.composition },
      {
        label: "Цены",
        value: `S ${suggestions.sizePrices.S} · M ${suggestions.sizePrices.M} · L ${suggestions.sizePrices.L} · XL ${suggestions.sizePrices.XL} ₽`,
      },
    ],
    [suggestions],
  );

  const toggleField = (fieldId: MockAiSuggestionField) => {
    setSelectedFields((current) =>
      current.includes(fieldId)
        ? current.filter((item) => item !== fieldId)
        : [...current, fieldId],
    );
  };

  const applySuggestions = (fields: MockAiSuggestionField[]) => {
    const nextForm: AdminProductFormState = { ...form };

    if (fields.includes("title")) {
      nextForm.title = suggestions.title;
      if (!form.slug.trim()) {
        nextForm.slug = suggestions.title
          .toLowerCase()
          .replace(/[^a-z0-9а-я]+/gi, "-")
          .replace(/(^-|-$)/g, "");
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
    if (fields.includes("seoTitle")) {
      nextForm.seoTitle = suggestions.seoTitle;
    }
    if (fields.includes("seoDescription")) {
      nextForm.seoDescription = suggestions.seoDescription;
    }
    if (fields.includes("imageAlt")) {
      nextForm.mainImageAlt = suggestions.imageAlt;
    }

    onApply(nextForm);
  };

  return (
    <section className={styles.aiPanel} aria-label="AI-помощник">
      <div className={styles.aiHeader}>
        <div>
          <p className={styles.aiEyebrow}>Mock AI · без внешнего API</p>
          <h3 className={styles.cardTitle}>AI заполнить товар</h3>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setSuggestions(generateMockAiSuggestions(form.title))}
        >
          AI заполнить товар
        </button>
      </div>

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
    </section>
  );
}
