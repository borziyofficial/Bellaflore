import {
  PRODUCT_EDITOR_SEARCH_INTENT_OPTIONS,
  PRODUCT_EDITOR_STRUCTURED_DATA_OPTIONS,
} from "@/components/productEditor/productEditorMockData";
import { buildProductEditorSeoScore } from "@/components/productEditor/productEditorSeoFoundation";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import styles from "@/components/productEditor/ProductSeoPanel.module.css";

type ProductSeoPanelProps = {
  draft: ProductEditorDraft;
  onChange: (patch: Partial<ProductEditorDraft>) => void;
};

export function ProductSeoPanel({ draft, onChange }: ProductSeoPanelProps) {
  const seoScore = buildProductEditorSeoScore(draft);

  return (
    <section className={styles.panel}>
      <h4 className={styles.panelTitle}>🚀 SEO карточки товара</h4>

      <div className={styles.scoreCard}>
        <p className={styles.scoreLabel}>SEO готовность</p>
        <p className={styles.scoreValue}>{seoScore.score} / 100</p>
        <p className={styles.scoreGoal}>Цель: максимальная SEO-готовность BellaFlore</p>
      </div>

      <ul className={styles.checklist}>
        {seoScore.checklist.map((item) => (
          <li
            key={item.id}
            className={`${styles.checklistItem} ${
              item.passed ? styles.checklistItemPassed : ""
            }`}
          >
            <span className={styles.checkMark}>{item.passed ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>

      <div className={styles.fieldGrid}>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>SEO Title</span>
          <input
            className={styles.input}
            value={draft.seoTitle}
            onChange={(event) => onChange({ seoTitle: event.target.value })}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Meta Description</span>
          <textarea
            className={styles.textarea}
            value={draft.metaDescription}
            onChange={(event) => onChange({ metaDescription: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>SEO Keywords</span>
          <input
            className={styles.input}
            value={draft.seoKeywords}
            onChange={(event) => onChange({ seoKeywords: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>H1</span>
          <input
            className={styles.input}
            value={draft.h1}
            onChange={(event) => onChange({ h1: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>H2</span>
          <input
            className={styles.input}
            value={draft.h2}
            onChange={(event) => onChange({ h2: event.target.value })}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Image Alt Text</span>
          <input
            className={styles.input}
            value={draft.imageAltText}
            onChange={(event) => onChange({ imageAltText: event.target.value })}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Canonical URL</span>
          <input
            className={styles.input}
            value={draft.canonicalUrl}
            onChange={(event) => onChange({ canonicalUrl: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>OpenGraph Title</span>
          <input
            className={styles.input}
            value={draft.openGraphTitle}
            onChange={(event) => onChange({ openGraphTitle: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>OpenGraph Description</span>
          <input
            className={styles.input}
            value={draft.openGraphDescription}
            onChange={(event) =>
              onChange({ openGraphDescription: event.target.value })
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Structured Data Type</span>
          <select
            className={styles.select}
            value={draft.structuredDataType}
            onChange={(event) =>
              onChange({
                structuredDataType:
                  event.target.value as ProductEditorDraft["structuredDataType"],
              })
            }
          >
            {PRODUCT_EDITOR_STRUCTURED_DATA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Local SEO phrase</span>
          <input
            className={styles.input}
            value={draft.localSeoPhrase}
            onChange={(event) => onChange({ localSeoPhrase: event.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Search intent</span>
          <select
            className={styles.select}
            value={draft.searchIntent}
            onChange={(event) =>
              onChange({
                searchIntent: event.target.value as ProductEditorDraft["searchIntent"],
              })
            }
          >
            {PRODUCT_EDITOR_SEARCH_INTENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
