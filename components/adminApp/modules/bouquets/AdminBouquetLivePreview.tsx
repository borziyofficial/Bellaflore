// ==================================================
// SECTION: ADMIN APP — Bouquet live preview (Stage 2.4)
// ==================================================
"use client";

import { getBouquetCoverImage } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  resolveBouquetPreviewPrice,
  resolveBouquetPreviewPriceLabel,
} from "@/components/adminApp/modules/bouquets/bouquetManageUtils";
import { getEnabledBouquetSizeCodes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type { BouquetDraft } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_BADGE_LABELS,
  BOUQUET_NO_PHOTO_LABEL,
  BOUQUET_STATUS_LABELS,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { formatBouquetPrice } from "@/components/adminApp/modules/bouquets/bouquetUtils";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetLivePreviewProps = {
  draft: BouquetDraft;
  compact?: boolean;
  categoryName?: string;
};

export function AdminBouquetLivePreview({
  draft,
  compact = true,
  categoryName,
}: AdminBouquetLivePreviewProps) {
  const cover = getBouquetCoverImage(draft.images);
  const price = resolveBouquetPreviewPrice(draft);
  const priceRange = resolveBouquetPreviewPriceLabel(draft);
  const enabledSizes = getEnabledBouquetSizeCodes(draft.sizes);
  const badgeLabel = BOUQUET_BADGE_LABELS[draft.badge];
  const resolvedCategoryName = categoryName || draft.category || "Категория";

  return (
    <div className={compact ? styles.livePreviewBlock : styles.previewModalCard}>
      {!compact ? null : <span className={styles.fieldLabel}>Предпросмотр</span>}

      <article className={styles.livePreviewCard}>
        <div className={styles.livePreviewMedia}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={draft.name || "Букет"} className={styles.livePreviewImage} />
          ) : (
            <span className={styles.livePreviewPlaceholder}>{BOUQUET_NO_PHOTO_LABEL}</span>
          )}
          {badgeLabel ? <span className={styles.livePreviewBadge}>{badgeLabel}</span> : null}
        </div>

        <div className={styles.livePreviewBody}>
          <div className={styles.livePreviewTop}>
            <h4 className={styles.livePreviewTitle}>{draft.name.trim() || "Название букета"}</h4>
            <span
              className={`${styles.statusBadge} ${styles[`status_${draft.status}`]}`}
            >
              {BOUQUET_STATUS_LABELS[draft.status]}
            </span>
          </div>

          <p className={styles.livePreviewMeta}>{resolvedCategoryName}</p>

          {draft.description ? (
            <p className={styles.livePreviewDescription}>{draft.description}</p>
          ) : null}

          <p className={styles.livePreviewPrice}>
            {formatBouquetPrice(price)}
            {priceRange ? <span className={styles.livePreviewPriceRange}> · от {priceRange} ₽</span> : null}
          </p>

          {enabledSizes.length > 0 ? (
            <div className={styles.livePreviewSizes}>
              {enabledSizes.map((code) => (
                <span key={code} className={styles.livePreviewSizeChip}>
                  {code}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
