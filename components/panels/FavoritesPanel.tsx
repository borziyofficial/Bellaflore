// ==================================================
// SECTION: FAVORITES
// РАЗДЕЛ: Избранное
//
// Purpose (EN):
// Slide-out favorites panel with saved bouquets
//
// Назначение (RU):
// Панель избранных букетов
// ==================================================
"use client";

import Image from "next/image";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import styles from "@/components/panels/FavoritesPanel.module.css";
import { getProductExperienceData, getProductSizeVariant } from "@/components/product/productExperienceCatalog";
import { ProductSizePickerSheet } from "@/components/product/ProductSizePickerSheet";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";
import {
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type FavoriteBouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  priceRub: number;
  width: number;
  height: number;
};

type FavoritesPanelProps = {
  favoriteBouquetIds: string[];
  favoriteBouquets: FavoriteBouquet[];
  formatPrice: (priceRub: number) => string;
  onCloseFavoritesPanel: () => void;
  handleFavoriteRemoveClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteRemoveTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  handleFavoriteBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
};

type FavoriteCardProps = {
  bouquet: FavoriteBouquet;
  formatPrice: (priceRub: number) => string;
  handleFavoriteRemoveClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteRemoveTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  handleFavoriteBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
};

function FavoriteCard({
  bouquet,
  formatPrice,
  handleFavoriteRemoveClick,
  handleFavoriteRemoveTouchEnd,
  handleFavoriteBuyClick,
  handleFavoriteBuyTouchEnd,
}: FavoriteCardProps) {
  const experienceData = useMemo(() => getProductExperienceData(bouquet), [bouquet]);
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.sizeVariants.some((variant) => variant.sizeId === "M")
      ? "M"
      : experienceData.defaultSizeId,
  );
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const selectedSizeLabel = getProductSizeRuLabel(selectedVariant.sizeId);

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <Image
          src={bouquet.src}
          alt={bouquet.alt}
          width={bouquet.width}
          height={bouquet.height}
          sizes="76px"
          unoptimized={shouldUseUnoptimizedImage(bouquet.src)}
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.cardTitle}>{bouquet.title}</h3>
        <p className={styles.price}>{formatPrice(selectedVariant.priceRub)}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.sizeButton}
            onClick={() => setSizeSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sizeSheetOpen}
          >
            Размер ▼
          </button>
          <button
            type="button"
            className={styles.orderButton}
            onClick={(event) =>
              handleFavoriteBuyClick(
                event,
                bouquet.id,
                selectedVariant.sizeId,
                selectedVariant.priceRub,
              )
            }
            onTouchEnd={(event) =>
              handleFavoriteBuyTouchEnd(
                event,
                bouquet.id,
                selectedVariant.sizeId,
                selectedVariant.priceRub,
              )
            }
            aria-label={`Заказать ${bouquet.title} в размере ${selectedSizeLabel}`}
          >
            Заказать
          </button>
          <button
            type="button"
            className={styles.removeButton}
            onClick={(event) => handleFavoriteRemoveClick(event, bouquet.id)}
            onTouchEnd={(event) => handleFavoriteRemoveTouchEnd(event, bouquet.id)}
            aria-label={`Убрать ${bouquet.title} из избранного`}
          >
            ×
          </button>
        </div>
      </div>
      <ProductSizePickerSheet
        open={sizeSheetOpen}
        title="Размер"
        variants={experienceData.sizeVariants}
        selectedSizeId={selectedSizeId}
        formatPrice={formatPrice}
        visibleSizeIds={["S", "M", "L", "XL"]}
        onSelect={setSelectedSizeId}
        onClose={() => setSizeSheetOpen(false)}
      />
    </article>
  );
}

export function FavoritesPanel({
  favoriteBouquetIds,
  favoriteBouquets,
  formatPrice,
  onCloseFavoritesPanel,
  handleFavoriteRemoveClick,
  handleFavoriteRemoveTouchEnd,
  handleFavoriteBuyClick,
  handleFavoriteBuyTouchEnd,
}: FavoritesPanelProps) {
  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onCloseFavoritesPanel}
    >
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <BrandLogo variant="panel" className={styles.eyebrow} />
            <h2 id="favorites-panel-title" className={styles.title}>
              Избранное
            </h2>
          </div>
          {favoriteBouquetIds.length > 0 ? (
            <span className={styles.count} aria-hidden="true">
              {favoriteBouquetIds.length}
            </span>
          ) : null}
        </div>

        {favoriteBouquets.length === 0 ? (
          <div className={styles.empty} role="status">
            <BrandLogo variant="compact" className={styles.emptyMark} />
            <p className={styles.emptyTitle}>Избранное пока пусто</p>
            <p className={styles.emptyCopy}>
              Сохранённые букеты появятся здесь.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {favoriteBouquets.map((bouquet) => (
              <FavoriteCard
                key={`favorite-${bouquet.id}`}
                bouquet={bouquet}
                formatPrice={formatPrice}
                handleFavoriteRemoveClick={handleFavoriteRemoveClick}
                handleFavoriteRemoveTouchEnd={handleFavoriteRemoveTouchEnd}
                handleFavoriteBuyClick={handleFavoriteBuyClick}
                handleFavoriteBuyTouchEnd={handleFavoriteBuyTouchEnd}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
