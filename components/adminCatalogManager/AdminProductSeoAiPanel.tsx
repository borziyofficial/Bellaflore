// ==================================================
// SECTION: Admin Catalog Manager — SEO AI Manager panel
// РАЗДЕЛ: SEO AI Manager в форме товара
// ==================================================
"use client";

import { useMemo, useState } from "react";
import type {
  AdminProductFormState,
  MockAiBundle,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { AdminProductSeoPreview } from "@/components/adminCatalogManager/AdminProductSeoPreview";
import type { MockSeoSuggestionField } from "@/components/adminCatalogManager/adminSeoTypes";
import { evaluateSeoFromForm } from "@/components/adminCatalogManager/seoScoreEngine";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

const SEO_SUGGESTION_FIELDS: Array<{
  id: MockSeoSuggestionField;
  label: string;
}> = [
  { id: "seoTitle", label: "SEO-заголовок" },
  { id: "seoDescription", label: "SEO-описание" },
  { id: "seoH1", label: "H1" },
  { id: "seoSlug", label: "URL товара" },
  { id: "seoImageAlt", label: "Alt-текст главного фото" },
  { id: "seoGalleryAlt", label: "Alt-тексты галереи" },
  { id: "openGraphTitle", label: "Open Graph — заголовок" },
  { id: "openGraphDescription", label: "Open Graph — описание" },
  { id: "seoKeywords", label: "Ключевые фразы" },
  { id: "internalLinkSuggestions", label: "Внутренние ссылки" },
  { id: "seoFaq", label: "FAQ" },
  { id: "schemaProductJsonLd", label: "Структурированные данные" },
];

type AdminProductSeoAiPanelProps = {
  form: AdminProductFormState;
  aiBundle: MockAiBundle | null;
  onApply: (nextForm: AdminProductFormState) => void;
};

function applySeoFields(
  form: AdminProductFormState,
  suggestions: MockAiBundle["seo"],
  fields: MockSeoSuggestionField[],
): AdminProductFormState {
  const nextForm = { ...form };

  if (fields.includes("seoTitle")) {
    nextForm.seoTitle = suggestions.seoTitle;
  }
  if (fields.includes("seoDescription")) {
    nextForm.seoDescription = suggestions.seoDescription;
  }
  if (fields.includes("seoH1")) {
    nextForm.seoH1 = suggestions.seoH1;
  }
  if (fields.includes("seoSlug")) {
    nextForm.seoSlug = suggestions.seoSlug;
    if (!form.slug.trim()) {
      nextForm.slug = suggestions.seoSlug;
    }
  }
  if (fields.includes("seoImageAlt")) {
    nextForm.seoImageAlt = suggestions.seoImageAlt;
    if (!form.mainImageAlt.trim()) {
      nextForm.mainImageAlt = suggestions.seoImageAlt;
    }
  }
  if (fields.includes("seoGalleryAlt")) {
    nextForm.seoGalleryAlt = [...suggestions.seoGalleryAlt];
  }
  if (fields.includes("openGraphTitle")) {
    nextForm.openGraphTitle = suggestions.openGraphTitle;
  }
  if (fields.includes("openGraphDescription")) {
    nextForm.openGraphDescription = suggestions.openGraphDescription;
  }
  if (fields.includes("seoKeywords")) {
    nextForm.seoKeywords = suggestions.seoKeywords;
  }
  if (fields.includes("internalLinkSuggestions")) {
    nextForm.internalLinkSuggestions = [...suggestions.internalLinkSuggestions];
  }
  if (fields.includes("seoFaq")) {
    nextForm.seoFaq = suggestions.seoFaq.map((item) => ({ ...item }));
  }
  if (fields.includes("schemaProductJsonLd")) {
    nextForm.schemaProductJsonLd = { ...suggestions.schemaProductJsonLd };
  }

  nextForm.seoScore = suggestions.seoScore;
  nextForm.seoRecommendations = [...suggestions.seoRecommendations];

  return nextForm;
}

export function AdminProductSeoAiPanel({
  form,
  aiBundle,
  onApply,
}: AdminProductSeoAiPanelProps) {
  const [selectedFields, setSelectedFields] = useState<MockSeoSuggestionField[]>(
    SEO_SUGGESTION_FIELDS.map((field) => field.id),
  );
  const [previousScore, setPreviousScore] = useState(form.seoScore);

  const liveSeo = useMemo(() => evaluateSeoFromForm(form), [form]);
  const suggestions = aiBundle?.seo ?? null;
  const displayScore = liveSeo.score;

  const toggleField = (fieldId: MockSeoSuggestionField) => {
    setSelectedFields((current) =>
      current.includes(fieldId)
        ? current.filter((item) => item !== fieldId)
        : [...current, fieldId],
    );
  };

  const applySuggestions = (fields: MockSeoSuggestionField[]) => {
    if (!suggestions) {
      return;
    }

    setPreviousScore(form.seoScore);
    onApply(applySeoFields(form, suggestions, fields));
  };

  const scoreDelta = displayScore - (form.seoScore || previousScore);
  const checklist = suggestions?.seoChecklist ?? liveSeo.checklist;
  const recommendations =
    displayScore < 85 ? liveSeo.recommendations : form.seoRecommendations;

  return (
    <section className={styles.seoAiPanel} aria-label="SEO AI Manager">
      <div className={styles.seoAiHeader}>
        <div>
          <p className={styles.aiEyebrow}>SEO AI Manager · mock</p>
          <h3 className={styles.cardTitle}>SEO AI Manager</h3>
          <p className={styles.cardHint}>
            Слой SEO-оптимизации после AI-заполнения товара. Поля можно применять
            выборочно и редактировать вручную.
          </p>
        </div>
        <div className={styles.seoScoreBlock}>
          <p className={styles.seoScoreLabel}>SEO-оценка</p>
          <p className={styles.seoScoreValue}>{displayScore}/100</p>
          {scoreDelta !== 0 ? (
            <p className={styles.seoScoreDelta}>
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} после применения
            </p>
          ) : null}
        </div>
      </div>

      {!suggestions ? (
        <p className={styles.note}>
          Нажмите «AI заполнить товар» выше, чтобы сгенерировать SEO-предложения.
        </p>
      ) : (
        <>
          <div className={styles.seoAiActions}>
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
              onClick={() =>
                applySuggestions(SEO_SUGGESTION_FIELDS.map((field) => field.id))
              }
            >
              Применить всё
            </button>
          </div>

          <div className={styles.aiFieldGrid}>
            {SEO_SUGGESTION_FIELDS.map((field) => (
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
        </>
      )}

      <div className={styles.seoSectionsGrid}>
        <section className={styles.seoSection}>
          <h4 className={styles.seoSectionTitle}>Поисковый сниппет</h4>
          <AdminProductSeoPreview form={form} />
        </section>

        <section className={styles.seoSection}>
          <h4 className={styles.seoSectionTitle}>Редактирование SEO</h4>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO-заголовок</span>
              <input
                className={styles.input}
                value={form.seoTitle}
                onChange={(event) => onApply({ ...form, seoTitle: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>SEO-описание</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.seoDescription}
                onChange={(event) =>
                  onApply({ ...form, seoDescription: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>H1</span>
              <input
                className={styles.input}
                value={form.seoH1}
                onChange={(event) => onApply({ ...form, seoH1: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>URL товара / slug</span>
              <input
                className={styles.input}
                value={form.seoSlug}
                onChange={(event) => onApply({ ...form, seoSlug: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Alt-текст главного фото</span>
              <input
                className={styles.input}
                value={form.seoImageAlt}
                onChange={(event) =>
                  onApply({ ...form, seoImageAlt: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Ключевые фразы</span>
              <input
                className={styles.input}
                value={form.seoKeywords}
                onChange={(event) =>
                  onApply({ ...form, seoKeywords: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Open Graph — заголовок</span>
              <input
                className={styles.input}
                value={form.openGraphTitle}
                onChange={(event) =>
                  onApply({ ...form, openGraphTitle: event.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Open Graph — описание</span>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.openGraphDescription}
                onChange={(event) =>
                  onApply({ ...form, openGraphDescription: event.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className={styles.seoSection}>
          <h4 className={styles.seoSectionTitle}>FAQ</h4>
          {form.seoFaq.length === 0 ? (
            <p className={styles.cardHint}>FAQ появится после применения SEO-предложений.</p>
          ) : (
            <div className={styles.faqList}>
              {form.seoFaq.map((item, index) => (
                <div key={`${item.question}-${index}`} className={styles.faqItem}>
                  <p className={styles.faqQuestion}>{item.question}</p>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.seoSection}>
          <h4 className={styles.seoSectionTitle}>SEO-оценка и рекомендации</h4>
          <ul className={styles.seoChecklist}>
            {checklist.map((item) => (
              <li
                key={item.id}
                className={item.passed ? styles.checklistPass : styles.checklistFail}
              >
                {item.passed ? "✅" : "⚠️"} {item.label}
              </li>
            ))}
          </ul>
          {recommendations.length > 0 ? (
            <ul className={styles.seoRecommendations}>
              {recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {form.internalLinkSuggestions.length > 0 ? (
          <section className={styles.seoSection}>
            <h4 className={styles.seoSectionTitle}>Внутренние ссылки</h4>
            <ul className={styles.internalLinks}>
              {form.internalLinkSuggestions.map((link) => (
                <li key={link}>
                  <code>{link}</code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
