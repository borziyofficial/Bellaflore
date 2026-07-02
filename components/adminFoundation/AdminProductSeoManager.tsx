// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: SEO Manager в Product Editor
// ==================================================
"use client";

import styles from "@/components/adminFoundation/AdminProductSeoManager.module.css";
import type {
  AdminProductSeoFields,
  AdminProductSeoGenerationContext,
} from "@/components/adminFoundation/adminProductSeoUtils";
import {
  SEO_DESCRIPTION_RECOMMENDED_MAX,
  SEO_TITLE_RECOMMENDED_MAX,
  buildProductSeoGenerateAllPatch,
  generateAllProductSeoFields,
  generateProductImageAltText,
  generateProductSeoDescription,
  generateProductSeoKeywords,
  generateProductSeoSlug,
  generateProductSeoTitle,
  getAdminProductSeoScore,
  getAdminProductSeoStatusLabel,
  getAdminProductSeoWarnings,
  getGoogleSeoPreview,
  getProductSeoOverwriteFieldLabels,
  getProductSeoSlugPreview,
  isAdminProductSeoReady,
} from "@/components/adminFoundation/adminProductSeoUtils";
import managerStyles from "@/components/adminFoundation/AdminProductManager.module.css";

type AdminProductSeoManagerProps = {
  productName: string;
  category: string;
  size: string;
  description: string;
  mainPhotoName?: string;
  seo: AdminProductSeoFields;
  onChange: (patch: Partial<AdminProductSeoFields>) => void;
};

function getCounterClass(length: number, recommendedMax: number): string {
  return length > recommendedMax ? styles.counterOver : "";
}

function getScoreTierClass(tier: "weak" | "medium" | "strong"): string {
  if (tier === "strong") {
    return styles.scoreStrong;
  }

  if (tier === "medium") {
    return styles.scoreMedium;
  }

  return styles.scoreWeak;
}

export function AdminProductSeoManager({
  productName,
  category,
  size,
  description,
  mainPhotoName,
  seo,
  onChange,
}: AdminProductSeoManagerProps) {
  const seoReady = isAdminProductSeoReady(seo);
  const statusLabel = getAdminProductSeoStatusLabel(seo);
  const seoScore = getAdminProductSeoScore(seo);
  const warnings = getAdminProductSeoWarnings(seo);
  const slugPreview = getProductSeoSlugPreview(seo.seoSlug);
  const googlePreview = getGoogleSeoPreview(seo);

  const generationContext: AdminProductSeoGenerationContext = {
    productName,
    category,
    size,
    description,
    mainPhotoName,
  };

  const hasProductContext = Boolean(productName.trim());

  const handleGenerateAll = () => {
    if (!hasProductContext) {
      return;
    }

    const generated = generateAllProductSeoFields(generationContext);
    const overwriteLabels = getProductSeoOverwriteFieldLabels(seo, generated);
    let allowOverwrite = false;

    if (overwriteLabels.length > 0) {
      const confirmed = window.confirm(
        `Перезаписать заполненные поля?\n\n${overwriteLabels.join("\n")}`,
      );
      allowOverwrite = confirmed;
    }

    const patch = buildProductSeoGenerateAllPatch(seo, generated, allowOverwrite);
    if (Object.keys(patch).length > 0) {
      onChange(patch);
    }
  };

  return (
    <section className={styles.block} aria-label="SEO Manager">
      <div className={styles.header}>
        <h4 className={styles.title}>SEO Manager</h4>
        <div className={styles.headerBadges}>
          <span className={`${styles.scoreBadge} ${getScoreTierClass(seoScore.tier)}`}>
            SEO Score: {seoScore.value} / {seoScore.max}
          </span>
          <span className={seoReady ? styles.statusReady : styles.statusIncomplete}>
            {statusLabel}
          </span>
        </div>
      </div>

      <p className={styles.note}>
        AI SEO Assistant — локальные шаблоны без внешнего API. SEO не блокирует сохранение товара.
      </p>

      {!seoReady ? (
        <p className={styles.warning} role="status">
          SEO incomplete — заполните SEO Title, SEO Description, SEO Slug и Image ALT Text.
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <div className={styles.warningsPanel} aria-label="SEO warnings">
          <p className={styles.warningsTitle}>SEO warnings</p>
          <ul className={styles.warningsList}>
            {warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.warningsClear}>Все основные SEO-проверки пройдены.</p>
      )}

      <div className={styles.generatePanel} aria-label="AI SEO generation">
        <p className={styles.generateTitle}>AI SEO Assistant</p>
        <div className={styles.generateActions}>
          <button
            type="button"
            className={styles.generateButton}
            onClick={() => onChange({ seoTitle: generateProductSeoTitle(generationContext) })}
            disabled={!hasProductContext}
          >
            Generate SEO Title
          </button>
          <button
            type="button"
            className={styles.generateButton}
            onClick={() =>
              onChange({ seoDescription: generateProductSeoDescription(generationContext) })
            }
            disabled={!hasProductContext}
          >
            Generate SEO Description
          </button>
          <button
            type="button"
            className={styles.generateButton}
            onClick={() => onChange({ seoKeywords: generateProductSeoKeywords(generationContext) })}
            disabled={!hasProductContext}
          >
            Generate Keywords
          </button>
          <button
            type="button"
            className={styles.generateButton}
            onClick={() =>
              onChange({ imageAltText: generateProductImageAltText(generationContext) })
            }
            disabled={!hasProductContext}
          >
            Generate Image ALT
          </button>
          <button
            type="button"
            className={styles.generateButton}
            onClick={() => {
              const generatedSlug = generateProductSeoSlug(productName);
              if (generatedSlug) {
                onChange({ seoSlug: generatedSlug });
              }
            }}
            disabled={!hasProductContext}
          >
            Generate Slug
          </button>
          <button
            type="button"
            className={`${styles.generateButton} ${styles.generateAllButton}`}
            onClick={handleGenerateAll}
            disabled={!hasProductContext}
          >
            Generate All SEO
          </button>
        </div>
      </div>

      <article className={styles.googlePreview} aria-label="Google SEO preview">
        <p className={styles.googlePreviewLabel}>Google Preview</p>
        <p className={styles.googlePreviewTitle}>{googlePreview.title}</p>
        <p className={styles.googlePreviewUrl}>{googlePreview.url}</p>
        <p className={styles.googlePreviewDescription}>{googlePreview.description}</p>
      </article>

      <div className={styles.fieldGrid}>
        <label className={managerStyles.field}>
          <span>SEO Title</span>
          <input
            value={seo.seoTitle}
            onChange={(event) => onChange({ seoTitle: event.target.value })}
            className={managerStyles.input}
            placeholder="Заголовок для поисковых систем"
          />
          <span className={`${styles.counter} ${getCounterClass(seo.seoTitle.length, SEO_TITLE_RECOMMENDED_MAX)}`}>
            {seo.seoTitle.length} / {SEO_TITLE_RECOMMENDED_MAX}
          </span>
        </label>

        <label className={managerStyles.field}>
          <span>SEO Description</span>
          <textarea
            value={seo.seoDescription}
            onChange={(event) => onChange({ seoDescription: event.target.value })}
            className={managerStyles.textarea}
            rows={3}
            placeholder="Краткое описание для сниппета в поиске"
          />
          <span
            className={`${styles.counter} ${getCounterClass(
              seo.seoDescription.length,
              SEO_DESCRIPTION_RECOMMENDED_MAX,
            )}`}
          >
            {seo.seoDescription.length} / {SEO_DESCRIPTION_RECOMMENDED_MAX}
          </span>
        </label>

        <label className={managerStyles.field}>
          <span>SEO Keywords</span>
          <input
            value={seo.seoKeywords}
            onChange={(event) => onChange({ seoKeywords: event.target.value })}
            className={managerStyles.input}
            placeholder="букеты, розы, доставка цветов Москва"
          />
        </label>

        <div className={styles.slugRow}>
          <label className={managerStyles.field}>
            <span>SEO Slug</span>
            <input
              value={seo.seoSlug}
              onChange={(event) => onChange({ seoSlug: event.target.value })}
              className={managerStyles.input}
              placeholder="belye-rozy-51-sht"
            />
          </label>
          <p className={styles.slugPreview}>Slug preview: {slugPreview}</p>
        </div>

        <label className={managerStyles.field}>
          <span>Image ALT Text</span>
          <input
            value={seo.imageAltText}
            onChange={(event) => onChange({ imageAltText: event.target.value })}
            className={managerStyles.input}
            placeholder="Белые розы 51 шт — премиальный букет BellaFlore"
          />
        </label>

        <label className={managerStyles.field}>
          <span>Canonical URL placeholder</span>
          <input
            value={seo.canonicalUrl}
            onChange={(event) => onChange({ canonicalUrl: event.target.value })}
            className={managerStyles.input}
            placeholder="https://bellaflore.ru/catalog/belye-rozy-51-sht"
          />
        </label>

        <label className={managerStyles.field}>
          <span>OpenGraph Title</span>
          <input
            value={seo.ogTitle}
            onChange={(event) => onChange({ ogTitle: event.target.value })}
            className={managerStyles.input}
            placeholder="Заголовок для соцсетей"
          />
        </label>

        <label className={managerStyles.field}>
          <span>OpenGraph Description</span>
          <textarea
            value={seo.ogDescription}
            onChange={(event) => onChange({ ogDescription: event.target.value })}
            className={managerStyles.textarea}
            rows={3}
            placeholder="Описание для превью в соцсетях"
          />
        </label>
      </div>
    </section>
  );
}
