// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Product preview (no public catalog)
// ==================================================
"use client";

import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import { formatProductEditorPrice } from "@/components/productEditor/productEditorSeoFoundation";
import styles from "@/components/productStorage/ProductStoragePreview.module.css";

type ProductStoragePreviewProps = {
  draft: ProductEditorDraft;
};

export function ProductStoragePreview({ draft }: ProductStoragePreviewProps) {
  const { mainPhoto } = usePhotoManager();

  const snippetTitle = draft.seoTitle || draft.name || "Bellaflore — букет";
  const snippetUrl = draft.canonicalUrl || "https://bellaflore.ru/catalog/...";
  const snippetDescription =
    draft.metaDescription || draft.shortDescription || "Описание товара...";
  const ogTitle = draft.openGraphTitle || snippetTitle;
  const ogDescription = draft.openGraphDescription || snippetDescription;

  return (
    <section className={styles.section} aria-label="Product Preview">
      <h4 className={styles.title}>👁 Product Preview</h4>
      <p className={styles.lead}>
        Локальный предпросмотр карточки без public catalog wiring.
      </p>

      <div className={styles.grid}>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Карточка товара</p>
          {mainPhoto?.objectUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */
            <img
              src={mainPhoto.objectUrl}
              alt={mainPhoto.seo.imageAlt || mainPhoto.fileName}
              className={styles.previewImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              {mainPhoto?.placeholderLabel || "placeholder · главное фото"}
            </div>
          )}
          <h5 className={styles.productName}>{draft.name || "Без названия"}</h5>
          <p className={styles.price}>{formatProductEditorPrice(draft.priceRub)}</p>
          <p className={styles.description}>
            {draft.shortDescription || draft.fullDescription || "Описание не заполнено."}
          </p>
        </article>

        <article className={styles.card}>
          <p className={styles.cardLabel}>Google Snippet</p>
          <p className={styles.snippetTitle}>{snippetTitle}</p>
          <p className={styles.snippetUrl}>{snippetUrl}</p>
          <p className={styles.snippetDescription}>{snippetDescription}</p>

          <p className={`${styles.cardLabel} ${styles.ogLabel}`}>OpenGraph Preview</p>
          <div className={styles.ogPreview}>
            <div className={styles.ogImage}>
              {mainPhoto?.placeholderLabel || "OG image placeholder"}
            </div>
            <div className={styles.ogBody}>
              <p className={styles.ogSite}>bellaflore.ru</p>
              <p className={styles.ogTitle}>{ogTitle}</p>
              <p className={styles.ogDescription}>{ogDescription}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
