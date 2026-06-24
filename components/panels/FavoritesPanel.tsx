"use client";

import Image from "next/image";
import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type FavoriteBouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
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
  ) => void;
  handleFavoriteBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
};

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
      <aside
        className="favorites-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="favorites-panel-header">
          <div>
            <span className="favorites-panel-eyebrow">Bellaflore</span>
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
            <div className="favorites-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
              </svg>
            </div>
            <p className="favorites-empty-title">Избранное пока пусто</p>
            <p className="favorites-empty-copy">
              Нажмите сердечко на букете в каталоге — он появится здесь.
            </p>
          </div>
        ) : (
          <div className="favorites-panel-grid">
            {favoriteBouquets.map((bouquet) => (
              <div
                className="favorites-panel-card"
                key={`favorite-${bouquet.id}`}
              >
                <button
                  type="button"
                  className="favorites-card-heart-button active"
                  onClick={(event) =>
                    handleFavoriteRemoveClick(event, bouquet.id)
                  }
                  onTouchEnd={(event) =>
                    handleFavoriteRemoveTouchEnd(event, bouquet.id)
                  }
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
                  <p>{formatPrice(bouquet.priceRub)}</p>
                </div>
                <div className="favorites-panel-card-actions">
                  <button
                    type="button"
                    className="favorites-buy-button"
                    onClick={(event) =>
                      handleFavoriteBuyClick(event, bouquet.id)
                    }
                    onTouchEnd={(event) =>
                      handleFavoriteBuyTouchEnd(event, bouquet.id)
                    }
                    aria-label={`Купить ${bouquet.title}`}
                  >
                    Купить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
