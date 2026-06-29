import {
  formatProductEditorPrice,
  getProductEditorStatusLabel,
} from "@/components/productEditor/productEditorSeoFoundation";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import styles from "@/components/productEditor/ProductPreviewPanel.module.css";

type ProductPreviewPanelProps = {
  draft: ProductEditorDraft;
};

export function ProductPreviewPanel({ draft }: ProductPreviewPanelProps) {
  return (
    <aside className={styles.panel} aria-label="Предпросмотр карточки товара">
      <h4 className={styles.panelTitle}>Preview карточки</h4>

      <article className={styles.card}>
        <div className={styles.imagePlaceholder}>placeholder · главное фото</div>
        <h5 className={styles.productName}>{draft.name || "Без названия"}</h5>
        <div className={styles.metaRow}>
          <p className={`${styles.metaPill} ${styles.pricePill}`}>
            {formatProductEditorPrice(draft.priceRub)}
          </p>
          <p className={styles.metaPill}>{draft.category || "—"}</p>
          <p className={styles.metaPill}>{getProductEditorStatusLabel(draft.status)}</p>
        </div>

        <div className={styles.previewBlock}>
          <p className={styles.blockLabel}>SEO title preview</p>
          <p className={styles.blockValue}>{draft.seoTitle || "—"}</p>
        </div>

        <div className={styles.previewBlock}>
          <p className={styles.blockLabel}>Google snippet preview</p>
          <p className={styles.snippetTitle}>
            {draft.seoTitle || draft.name || "Bellaflore — букет"}
          </p>
          <p className={styles.snippetUrl}>
            {draft.canonicalUrl || "https://bellaflore.ru/catalog/..."}
          </p>
          <p className={styles.snippetDescription}>
            {draft.metaDescription || draft.shortDescription || "Описание товара..."}
          </p>
        </div>

        <div className={styles.previewBlock}>
          <p className={styles.blockLabel}>Image alt preview</p>
          <p className={styles.blockValue}>{draft.imageAltText || "—"}</p>
        </div>
      </article>
    </aside>
  );
}
