// ==================================================
// SECTION: Admin Catalog Manager — SEO preview blocks
// РАЗДЕЛ: Предпросмотр SEO-сниппета и OG
// ==================================================
"use client";

import Image from "next/image";
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

type AdminProductSeoPreviewProps = {
  form: AdminProductFormState;
};

export function AdminProductSeoPreview({ form }: AdminProductSeoPreviewProps) {
  const displayTitle = form.seoTitle.trim() || form.title || "SEO-заголовок товара";
  const displayDescription =
    form.seoDescription.trim() ||
    form.shortDescription ||
    "SEO-описание появится здесь после заполнения.";
  const displayUrl = `https://www.bellaflore.ru/catalog/${form.seoSlug.trim() || form.slug || "tovar"}`;
  const ogTitle = form.openGraphTitle.trim() || displayTitle;
  const ogDescription = form.openGraphDescription.trim() || displayDescription;
  const schemaPreview = JSON.stringify(form.schemaProductJsonLd, null, 2);

  return (
    <div className={styles.seoPreviewStack}>
      <section className={styles.seoPreviewCard} aria-label="Поисковый сниппет">
        <h4 className={styles.seoPreviewTitle}>Предпросмотр в поиске</h4>
        <div className={styles.searchSnippet}>
          <p className={styles.searchSnippetUrl}>{displayUrl}</p>
          <p className={styles.searchSnippetHeading}>{displayTitle}</p>
          <p className={styles.searchSnippetDescription}>{displayDescription}</p>
        </div>
      </section>

      <section className={styles.seoPreviewCard} aria-label="Социальный предпросмотр">
        <h4 className={styles.seoPreviewTitle}>Open Graph</h4>
        <div className={styles.ogPreview}>
          <div className={styles.ogPreviewMedia}>
            {form.mainImageUrl ? (
              <Image
                src={form.mainImageUrl}
                alt={form.seoImageAlt || form.mainImageAlt || "OG preview"}
                fill
                sizes="320px"
                className={styles.ogPreviewImage}
                unoptimized={form.mainImageUrl.startsWith("blob:")}
              />
            ) : (
              <div className={styles.imageFallback}>Фото товара</div>
            )}
          </div>
          <div className={styles.ogPreviewBody}>
            <p className={styles.ogPreviewDomain}>bellaflore.ru</p>
            <p className={styles.ogPreviewHeading}>{ogTitle}</p>
            <p className={styles.ogPreviewDescription}>{ogDescription}</p>
          </div>
        </div>
      </section>

      <section className={styles.seoPreviewCard} aria-label="Структурированные данные">
        <h4 className={styles.seoPreviewTitle}>Schema.org Product</h4>
        <pre className={styles.schemaPreview}>
          {schemaPreview === "{}" ? "{}" : schemaPreview}
        </pre>
      </section>
    </div>
  );
}
