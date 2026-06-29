// ==================================================
// SECTION: SEO INTELLIGENCE
// РАЗДЕЛ: SEO Intelligence Engine UI
// ==================================================
"use client";

import { useMemo, useState } from "react";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import {
  analyzeSeoIntelligence,
  getSeoHealthLabel,
} from "@/components/seoIntelligence/seoIntelligenceFoundation";
import {
  SEO_FUTURE_INTEGRATIONS,
  SEO_HISTORY_MOCK,
  SEO_LOCAL_FOUNDATION_DEFAULT,
  SEO_STRUCTURED_DATA_TYPES,
} from "@/components/seoIntelligence/seoIntelligenceMockData";
import styles from "@/components/seoIntelligence/SeoIntelligenceDashboard.module.css";
import {
  SEO_INTELLIGENCE_SECTION_ID,
  type SeoLocalFoundation,
} from "@/components/seoIntelligence/seoIntelligenceTypes";

type SeoIntelligenceDashboardProps = {
  draft: ProductEditorDraft;
};

export function SeoIntelligenceDashboard({ draft }: SeoIntelligenceDashboardProps) {
  const { mainPhoto } = usePhotoManager();
  const [localSeo, setLocalSeo] = useState<SeoLocalFoundation>(
    SEO_LOCAL_FOUNDATION_DEFAULT,
  );

  const analysis = useMemo(
    () => analyzeSeoIntelligence({ draft, mainPhoto, localSeo }),
    [draft, mainPhoto, localSeo],
  );

  const imageAlt = mainPhoto?.seo.imageAlt || draft.imageAltText;

  return (
    <section id={SEO_INTELLIGENCE_SECTION_ID} className={styles.section}>
      <p className={styles.eyebrow}>Stage 48 · SEO Intelligence Engine</p>
      <h3 className={styles.title}>📈 SEO Intelligence</h3>
      <p className={styles.lead}>
        Локальный SEO Intelligence Engine для карточки товара. Без OpenAI, API, БД
        и public catalog sync.
      </p>
      <p className={styles.scoreGoal}>Цель: максимальная SEO-готовность BellaFlore</p>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <p className={styles.dashboardLabel}>SEO Score</p>
          <p className={styles.dashboardValue}>{analysis.score} / 100</p>
        </article>
        <article className={styles.dashboardCard}>
          <p className={styles.dashboardLabel}>SEO Ready</p>
          <p className={`${styles.dashboardValue} ${styles.dashboardValueSmall}`}>
            {analysis.seoReady ? "Да" : "Нет"}
          </p>
        </article>
        <article className={styles.dashboardCard}>
          <p className={styles.dashboardLabel}>Critical Errors</p>
          <p className={styles.dashboardValue}>{analysis.criticalErrors}</p>
        </article>
        <article className={styles.dashboardCard}>
          <p className={styles.dashboardLabel}>Warnings</p>
          <p className={styles.dashboardValue}>{analysis.warnings}</p>
        </article>
        <article className={styles.dashboardCard}>
          <p className={styles.dashboardLabel}>Passed checks</p>
          <p className={styles.dashboardValue}>{analysis.passedChecks}</p>
        </article>
      </div>

      <div className={styles.healthGrid}>
        <div
          className={`${styles.healthCard} ${styles.healthExcellent} ${
            analysis.healthLevel !== "excellent" ? styles.healthInactive : ""
          }`}
        >
          🟢 Excellent
        </div>
        <div
          className={`${styles.healthCard} ${styles.healthGood} ${
            analysis.healthLevel !== "good" ? styles.healthInactive : ""
          }`}
        >
          🟡 Good
        </div>
        <div
          className={`${styles.healthCard} ${styles.healthNeeds} ${
            analysis.healthLevel !== "needs_improvement" ? styles.healthInactive : ""
          }`}
        >
          🔴 Needs Improvement
        </div>
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>SEO Checklist</h4>
          <ul className={styles.checklist}>
            {analysis.checklist.map((item) => (
              <li
                key={item.id}
                className={`${styles.checklistItem} ${
                  item.passed ? styles.checklistPassed : ""
                }`}
              >
                <span>{item.passed ? "✓" : "○"}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>🤖 AI SEO Assistant</h4>
          <ul className={styles.recommendationList}>
            {analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((item) => (
                <li key={item.id} className={styles.recommendationItem}>
                  · {item.text}
                </li>
              ))
            ) : (
              <li className={styles.recommendationItem}>
                · Mock-рекомендации: все базовые SEO-поля заполнены
              </li>
            )}
          </ul>
          <button type="button" className={styles.generateButton} disabled>
            Сгенерировать SEO
          </button>
        </section>
      </div>

      <section className={styles.panel}>
        <h4 className={styles.panelTitle}>SEO Preview</h4>
        <div className={styles.previewGrid}>
          <article className={styles.previewCard}>
            <p className={styles.previewLabel}>Google Snippet</p>
            <p className={styles.snippetTitle}>{draft.seoTitle || draft.name}</p>
            <p className={styles.snippetUrl}>{draft.canonicalUrl}</p>
            <p className={styles.snippetDescription}>{draft.metaDescription}</p>
          </article>

          <article className={styles.previewCard}>
            <p className={styles.previewLabel}>Яндекс Snippet</p>
            <p className={`${styles.snippetTitle} ${styles.snippetTitleYandex}`}>
              {draft.seoTitle || draft.name}
            </p>
            <p className={styles.snippetUrl}>{draft.canonicalUrl}</p>
            <p className={styles.snippetDescription}>
              {draft.metaDescription} · {localSeo.phrase}
            </p>
          </article>

          <article className={styles.previewCard}>
            <p className={styles.previewLabel}>OpenGraph Preview</p>
            <div className={styles.ogPreview}>
              {mainPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element -- local objectURL */
                <img
                  src={mainPhoto.objectUrl}
                  alt={imageAlt}
                  className={styles.ogImage}
                />
              ) : (
                <div className={styles.ogImagePlaceholder}>OG image placeholder</div>
              )}
              <p className={styles.snippetTitle}>{draft.openGraphTitle || draft.name}</p>
              <p className={styles.snippetDescription}>{draft.openGraphDescription}</p>
            </div>
          </article>

          <article className={styles.previewCard}>
            <p className={styles.previewLabel}>Image SEO Preview</p>
            <p className={styles.snippetDescription}>
              <strong>ALT:</strong> {imageAlt || "—"}
            </p>
            <p className={styles.snippetDescription}>
              <strong>Filename:</strong> {mainPhoto?.seo.seoFilename || "—"}
            </p>
            <p className={styles.snippetDescription}>
              <strong>Caption:</strong> {mainPhoto?.seo.imageCaption || "—"}
            </p>
          </article>
        </div>
      </section>

      <div className={styles.twoCol}>
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>Local SEO Foundation</h4>
          <div className={styles.fieldGrid}>
            {(
              [
                ["city", "Москва"],
                ["district", "Район"],
                ["metro", "Метро"],
                ["okrug", "Округ"],
                ["deliveryZone", "Зона доставки"],
                ["phrase", "Фраза: доставка цветов Москва"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={`${styles.field} ${key === "phrase" ? styles.fieldFull : ""}`}
              >
                <span className={styles.label}>{label}</span>
                <input
                  className={styles.input}
                  value={localSeo[key]}
                  onChange={(event) =>
                    setLocalSeo((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>Structured Data Foundation</h4>
          <ul className={styles.tagList}>
            {SEO_STRUCTURED_DATA_TYPES.map((item) => (
              <li key={item.id} className={styles.tagItem}>
                <span
                  className={`${styles.tagReady} ${
                    item.status === "planned" ? styles.tagPlanned : ""
                  }`}
                >
                  {item.status}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
          <h4 className={styles.panelTitle}>JSON-LD Preview</h4>
          <pre className={styles.jsonPreview}>{analysis.jsonLdPreview}</pre>
        </section>
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>SEO History</h4>
          <div className={styles.historyCard}>
            <p className={styles.historyRow}>
              <span className={styles.historyLabel}>Последнее изменение SEO:</span>{" "}
              {SEO_HISTORY_MOCK.lastChange}
            </p>
            <p className={styles.historyRow}>
              <span className={styles.historyLabel}>Дата:</span> {SEO_HISTORY_MOCK.date}
            </p>
            <p className={styles.historyRow}>
              <span className={styles.historyLabel}>Автор:</span> {SEO_HISTORY_MOCK.author}
            </p>
            <p className={styles.historyRow}>
              <span className={styles.historyLabel}>Версия:</span> {SEO_HISTORY_MOCK.version}
            </p>
          </div>
        </section>

        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>SEO Health</h4>
          <p className={styles.snippetDescription}>
            Текущий уровень:{" "}
            <strong>{getSeoHealthLabel(analysis.healthLevel)}</strong> ({analysis.score}{" "}
            / 100)
          </p>
          <div className={styles.healthGrid}>
            <div className={`${styles.healthCard} ${styles.healthExcellent}`}>
              🟢 Excellent
            </div>
            <div className={`${styles.healthCard} ${styles.healthGood}`}>🟡 Good</div>
            <div className={`${styles.healthCard} ${styles.healthNeeds}`}>
              🔴 Needs Improvement
            </div>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <h4 className={styles.panelTitle}>Future Ready</h4>
        <ul className={styles.futureList}>
          {SEO_FUTURE_INTEGRATIONS.map((item) => (
            <li key={item.id} className={styles.futureItem}>
              <span className={`${styles.tagReady} ${styles.tagPlanned}`}>planned</span>
              {item.label}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
