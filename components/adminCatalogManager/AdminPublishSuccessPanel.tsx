// ==================================================
// SECTION: Admin Catalog Manager — publish success
// РАЗДЕЛ: Подтверждение публикации товара
// ==================================================
"use client";

import Link from "next/link";
import { AdminProductPreviewCard } from "@/components/adminCatalogManager/AdminProductPreviewCard";
import { toLegacyCatalogProduct } from "@/components/catalogEngine/legacyCatalogAdapter";
import { getPublicStorefrontProductUrl } from "@/components/catalog/publicCatalogMerge";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

type AdminPublishSuccessPanelProps = {
  product: CatalogProductRecord;
  onEdit: () => void;
  onArchive: () => void;
  onOpenCatalog: () => void;
};

export function AdminPublishSuccessPanel({
  product,
  onEdit,
  onArchive,
  onOpenCatalog,
}: AdminPublishSuccessPanelProps) {
  const storefrontProduct = toLegacyCatalogProduct(product);
  const storefrontUrl = getPublicStorefrontProductUrl(storefrontProduct);

  return (
    <section className={styles.wizardPanel}>
      <p className={styles.successNote}>Товар опубликован на сайте</p>
      <h3 className={styles.cardTitle}>{product.title}</h3>
      <p className={styles.cardHint}>
        Товар появится в публичном каталоге и на главной странице.
      </p>
      <AdminProductPreviewCard product={product} />
      <div className={styles.wizardStickyActions}>
        <Link
          href={storefrontUrl}
          className={styles.primaryButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          Посмотреть на сайте
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={onOpenCatalog}>
          Открыть каталог
        </button>
        <button type="button" className={styles.ghostButton} onClick={onEdit}>
          Редактировать
        </button>
        <button type="button" className={styles.ghostButton} onClick={onArchive}>
          Архивировать
        </button>
      </div>
    </section>
  );
}
