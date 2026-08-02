// ==================================================
// SECTION: FAVORITES
// РАЗДЕЛ: Избранное
// ==================================================
"use client";

import Image from "next/image";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import styles from "@/components/panels/FavoritesPanel.module.css";
import { getProductExperienceData, getProductSizeVariant } from "@/components/product/productExperienceCatalog";
import { ProductSizePickerSheet } from "@/components/product/ProductSizePickerSheet";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";
import {
  useMemo,
  useRef,
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
  handleFavoriteBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
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
  handleFavoriteBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
};

const ACTION_GESTURE_THRESHOLD_PX = 10;

function FavoriteCard({
  bouquet,
  formatPrice,
  handleFavoriteRemoveClick,
  handleFavoriteBuyClick,
}: FavoriteCardProps) {
  const experienceData = useMemo(() => getProductExperienceData(bouquet), [bouquet]);
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.sizeVariants.some((variant) => variant.sizeId === "M")
      ? "M"
      : experienceData.defaultSizeId,
  );
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const actionGestureRef = useRef({
    startX: 0,
    startY: 0,
    moved: false,
    suppressClickUntil: 0,
  });
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const selectedSizeLabel = selectedVariant.sizeId;

  const handleActionTouchStart = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    actionGestureRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      suppressClickUntil: 0,
    };
  };

  const handleActionTouchMove = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const gesture = actionGestureRef.current;
    if (
      Math.hypot(
        touch.clientX - gesture.startX,
        touch.clientY - gesture.startY,
      ) >= ACTION_GESTURE_THRESHOLD_PX
    ) {
      gesture.moved = true;
    }
  };

  const handleActionTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    if (!actionGestureRef.current.moved) {
      return;
    }

    actionGestureRef.current.suppressClickUntil = Date.now() + 800;
    event.preventDefault();
    event.stopPropagation();
  };

  const shouldSuppressActionClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (Date.now() >= actionGestureRef.current.suppressClickUntil) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <Image
          src={bouquet.src}
          alt={bouquet.alt}
          width={bouquet.width}
          height={bouquet.height}
          sizes="64px"
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
            onClick={(event) => {
              if (!shouldSuppressActionClick(event)) {
                setSizeSheetOpen(true);
              }
            }}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
            aria-haspopup="dialog"
            aria-expanded={sizeSheetOpen}
          >
            {selectedSizeLabel}
          </button>
          <button
            type="button"
            className={styles.orderButton}
            onClick={(event) => {
              if (shouldSuppressActionClick(event)) {
                return;
              }

              handleFavoriteBuyClick(
                event,
                bouquet.id,
                selectedVariant.sizeId,
                selectedVariant.priceRub,
              );
            }}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
            aria-label={`Заказать ${bouquet.title} в размере ${selectedSizeLabel}`}
          >
            Купить
          </button>
          <button
            type="button"
            className={styles.removeButton}
            onClick={(event) => {
              if (!shouldSuppressActionClick(event)) {
                handleFavoriteRemoveClick(event, bouquet.id);
              }
            }}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
            aria-label={`Убрать ${bouquet.title} из избранного`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
            </svg>
          </button>
        </div>
      </div>
      <ProductSizePickerSheet
        open={sizeSheetOpen}
        title="Размер"
        productName={bouquet.title}
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

const SWIPE_CLOSE_THRESHOLD = 72;

export function FavoritesPanel({
  favoriteBouquetIds,
  favoriteBouquets,
  formatPrice,
  onCloseFavoritesPanel,
  handleFavoriteRemoveClick,
  handleFavoriteBuyClick,
}: FavoritesPanelProps) {
  useBodyScrollLock(true);
  const touchStartYRef = useRef<number | null>(null);

  const handleSheetTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSheetTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;

    if (startY == null || endY == null) {
      return;
    }

    if (endY - startY >= SWIPE_CLOSE_THRESHOLD) {
      onCloseFavoritesPanel();
    }

    touchStartYRef.current = null;
  };

  return (
    <div
      className={styles.overlay}
      role="presentation"
      data-bottom-nav-panel-overlay
    >
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
      >
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.header}>
          <div>
            <BrandLogo variant="panel" className={styles.eyebrow} />
            <h2 id="favorites-panel-title" className={styles.title}>
              Избранное
              {favoriteBouquetIds.length > 0 ? (
                <span className={styles.countInline}> · {favoriteBouquetIds.length}</span>
              ) : null}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCloseFavoritesPanel}
            aria-label="Закрыть избранное"
          >
            ×
          </button>
        </div>

        {favoriteBouquets.length === 0 ? (
          <div className={styles.empty} role="status">
            <BrandLogo variant="compact" className={styles.emptyMark} />
            <p className={styles.emptyTitle}>Избранное пока пусто</p>
            <p className={styles.emptyCopy}>Сохранённые букеты появятся здесь.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {favoriteBouquets.map((bouquet) => (
              <FavoriteCard
                key={`favorite-${bouquet.id}`}
                bouquet={bouquet}
                formatPrice={formatPrice}
                handleFavoriteRemoveClick={handleFavoriteRemoveClick}
                handleFavoriteBuyClick={handleFavoriteBuyClick}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
