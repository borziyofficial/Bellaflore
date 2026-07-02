// ==================================================
// SECTION: Admin Catalog Manager — product preview card
// РАЗДЕЛ: Превью карточки товара
// ==================================================
"use client";

import Image from "next/image";
import { shouldUseUnoptimizedImage } from "@/components/adminCatalogManager/adminImagePersistence";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

type AdminProductPreviewCardProps = {
  product: CatalogProductRecord;
};

function formatPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU").format(priceRub);
}

export function AdminProductPreviewCard({ product }: AdminProductPreviewCardProps) {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];
  const minPrice = product.sizes.length
    ? Math.min(...product.sizes.map((size) => size.priceRub))
    : product.basePriceRub;
  const maxPrice = product.sizes.length
    ? Math.max(...product.sizes.map((size) => size.priceRub))
    : product.basePriceRub;
  const categoryTitle =
    CATALOG_CATEGORY_BY_ID[product.categoryIds[0] ?? ""]?.title ?? "Каталог";

  return (
    <section className={styles.previewCard} aria-label="Превью карточки товара">
      <p className={styles.previewEyebrow}>Превью витрины</p>
      <article className={styles.previewArticle}>
        <div className={styles.previewMedia}>
          {primaryImage?.url ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.title}
              fill
              sizes="240px"
              className={styles.previewImage}
              unoptimized={shouldUseUnoptimizedImage(primaryImage.url)}
            />
          ) : (
            <div className={styles.imageFallback}>Bellaflore</div>
          )}
          <div className={styles.previewBadges}>
            {product.isNew ? <span className={styles.badge}>New</span> : null}
            {product.isFeatured ? <span className={styles.badge}>Featured</span> : null}
            {product.metadata.isBestseller ? (
              <span className={styles.badge}>Bestseller</span>
            ) : null}
          </div>
        </div>
        <div className={styles.previewBody}>
          <p className={styles.previewCategory}>{categoryTitle}</p>
          <h4 className={styles.previewTitle}>{product.title || "Название товара"}</h4>
          <p className={styles.previewDescription}>
            {product.shortDescription || "Краткое описание появится здесь"}
          </p>
          <p className={styles.previewPrice}>
            {minPrice === maxPrice
              ? `${formatPrice(minPrice)} ₽`
              : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)} ₽`}
          </p>
          {product.sizes.length ? (
            <div className={styles.previewSizes}>
              {product.sizes.map((size) => (
                <span key={size.sizeId} className={styles.previewSizeChip}>
                  {size.sizeId} · {formatPrice(size.priceRub)} ₽
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
