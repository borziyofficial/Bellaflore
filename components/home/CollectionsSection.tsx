"use client";

import Image from "next/image";
import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type Bouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  priceRub: number;
  width: number;
  height: number;
};

type CollectionsSectionProps = {
  bouquets: Bouquet[];
  favoriteBouquetIds: string[];
  formatPrice: (priceRub: number) => string;
  handleFavoriteClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleBouquetOrderClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleBouquetOrderTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
};

export function CollectionsSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleFavoriteTouchEnd,
  handleBouquetOrderClick,
  handleBouquetOrderTouchEnd,
}: CollectionsSectionProps) {
  return (
    <section id="collections" className="bouquets">
      <div className="section-header">
        <span>Коллекции</span>
        <h2>Наши букеты</h2>
      </div>
      <div className="bouquet-grid">
        {bouquets.map((bouquet) => {
          const isFavorite = favoriteBouquetIds.includes(bouquet.id);

          return (
            <div className="bouquet-card" key={bouquet.title}>
              <div className="bouquet-image">
                <Image
                  src={bouquet.src}
                  alt={bouquet.alt}
                  width={bouquet.width}
                  height={bouquet.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <button
                  type="button"
                  className={`bouquet-favorite-button ${isFavorite ? "active" : ""}`}
                  onClick={(event) => handleFavoriteClick(event, bouquet.id)}
                  onTouchEnd={(event) =>
                    handleFavoriteTouchEnd(event, bouquet.id)
                  }
                  aria-label={
                    isFavorite
                      ? `Убрать ${bouquet.title} из избранного`
                      : `Добавить ${bouquet.title} в избранное`
                  }
                  aria-pressed={isFavorite}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
                  </svg>
                </button>
              </div>
              <div className="bouquet-info">
                <h3>{bouquet.title}</h3>
                <p>{bouquet.description}</p>
                <strong className="bouquet-price">
                  {formatPrice(bouquet.priceRub)}
                </strong>
                <button
                  type="button"
                  className="buy-button bouquet-order-link"
                  onClick={(event) =>
                    handleBouquetOrderClick(event, bouquet.id)
                  }
                  onTouchEnd={(event) =>
                    handleBouquetOrderTouchEnd(event, bouquet.id)
                  }
                  aria-label={`Заказать ${bouquet.title}`}
                >
                  Заказать
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
