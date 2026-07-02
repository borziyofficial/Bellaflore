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
import { getProductExperienceData, getProductSizeVariant } from "@/components/product/productExperienceCatalog";
import { ProductSizeSelector } from "@/components/product/ProductSizeSelector";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
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
    experienceData.defaultSizeId,
  );
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);

  return (
    <div className="favorites-panel-card">
      <button
        type="button"
        className="favorites-card-heart-button active"
        onClick={(event) => handleFavoriteRemoveClick(event, bouquet.id)}
        onTouchEnd={(event) => handleFavoriteRemoveTouchEnd(event, bouquet.id)}
        aria-label={`Убрать ${bouquet.title} из избранного`}
        aria-pressed="true"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
        </svg>
      </button>
      <div className="favorites-panel-image">
        <Image
          src={bouquet.src}
          alt={bouquet.alt}
          width={bouquet.width}
          height={bouquet.height}
          sizes="88px"
        />
      </div>
      <div className="favorites-panel-card-info">
        <h3>{bouquet.title}</h3>
        <ProductSizeSelector
          layout="compact"
          variants={experienceData.sizeVariants}
          selectedSizeId={selectedSizeId}
          onSelectSize={setSelectedSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L"]}
          ariaLabel={`Размеры для ${bouquet.title}`}
        />
      </div>
      <div className="favorites-panel-card-actions">
        <button
          type="button"
          className="favorites-buy-button"
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
          aria-label={`Купить ${bouquet.title} в размере ${selectedVariant.label}`}
        >
          Купить
        </button>
      </div>
    </div>
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
      className="favorites-panel-overlay"
      role="presentation"
      onClick={onCloseFavoritesPanel}
    >
      {/* ==================================================
SECTION: FAVORITES
РАЗДЕЛ: Диалог избранного
Purpose (EN): Dialog with header, empty state, or grid
Назначение (RU): Диалог избранного
================================================== */}
      <aside
        className="favorites-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="favorites-panel-header">
          <div>
            <BrandLogo variant="panel" className="favorites-panel-eyebrow" />
            <h2 id="favorites-panel-title">Избранное</h2>
          </div>
          <div className="favorites-panel-actions">
            {favoriteBouquetIds.length > 0 && (
              <span className="favorite-count-badge" aria-hidden="true">
                {favoriteBouquetIds.length}
              </span>
            )}
          </div>
        </div>

        {favoriteBouquets.length === 0 ? (
          <div className="favorites-empty" role="status">
            {/* ==================================================
SECTION: FAVORITES
РАЗДЕЛ: Пустое состояние избранного
Purpose (EN): Empty state prompt
Назначение (RU): Пустое состояние избранного
================================================== */}
            <div className="favorites-empty-icon" aria-hidden="true">
              <BrandLogo variant="compact" className="favorites-empty-brand" />
            </div>
            <p className="favorites-empty-title">Избранное пока пусто</p>
            <p className="favorites-empty-copy">
              Нажмите сердечко на букете в каталоге — он появится здесь.
            </p>
          </div>
        ) : (
          <div className="favorites-panel-grid">
            {/* ==================================================
SECTION: PRODUCT GRID
РАЗДЕЛ: Сетка сохранённых букетов
Purpose (EN): Saved bouquet cards with buy actions
Назначение (RU): Сетка сохранённых букетов
================================================== */}
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
