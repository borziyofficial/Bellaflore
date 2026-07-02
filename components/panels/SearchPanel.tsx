// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог
//
// Purpose (EN):
// Slide-out search panel with smart catalog and results
//
// Назначение (RU):
// Панель поиска с умным каталогом и результатами
// ==================================================
"use client";

import Image from "next/image";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import type { SmartCatalogGroup } from "@/data/smartCatalog";
import {
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type SearchBouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  priceRub: number;
  width: number;
  height: number;
};

type SearchPanelProps = {
  searchQuery: string;
  smartCatalogGroups: SmartCatalogGroup[];
  normalizedSearchQuery: string;
  searchResults: SearchBouquet[];
  favoriteBouquetIds: string[];
  failedSearchImageIds: string[];
  formatPrice: (priceRub: number) => string;
  closeSearchPanel: () => void;
  handleSearchQueryChange: (
    event: ReactChangeEvent<HTMLInputElement>,
  ) => void;
  clearSearchQuery: () => void;
  handleSearchSuggestionClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    suggestion: string,
  ) => void;
  handleSearchSuggestionTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    suggestion: string,
  ) => void;
  markSearchImageFailed: (bouquetId: string) => void;
  handleFavoriteClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleFavoriteTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleSearchBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleSearchBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
};

type SmartCatalogDisplayItem = {
  id: string;
  label: string;
  query: string;
  status: SmartCatalogGroup["sections"][number]["items"][number]["status"];
};

const smartCatalogDisplayLabels: Record<string, string[]> = {
  roses: [
    "Красные розы",
    "Белые розы",
    "Розовые розы",
    "Кремовые розы",
    "Кустовые розы",
    "7 роз",
    "9 роз",
    "13 роз",
    "19 роз",
    "25 роз",
    "33 розы",
    "39 роз",
    "51 роза",
    "101 роза",
    "Французский стиль",
  ],
  peonies: [
    "Белые пионы",
    "Розовые пионы",
    "Красные пионы",
    "9 пионов",
    "19 пионов",
    "25 пионов",
    "51 пион",
    "101 пион",
    "Пионы в коробке",
    "Пионы в корзине",
  ],
  hydrangeas: [
    "Белые гортензии",
    "Голубые гортензии",
    "Розовые гортензии",
    "7 гортензий",
    "9 гортензий",
    "13 гортензий",
    "19 гортензий",
    "33 гортензии",
  ],
  "french-style": [
    "5 роз французский стиль",
    "7 роз французский стиль",
    "9 роз французский стиль",
    "15 роз французский стиль",
    "31 роза французский стиль",
  ],
};

function getSmartCatalogDisplayItems(
  group: SmartCatalogGroup,
): SmartCatalogDisplayItem[] {
  const sectionItems = group.sections.flatMap((section) => section.items);
  const requestedLabels = smartCatalogDisplayLabels[group.id];

  if (!requestedLabels) {
    return sectionItems;
  }

  return requestedLabels.map((label) => {
    const matchingItem = sectionItems.find(
      (item) =>
        item.label.toLocaleLowerCase("ru-RU") ===
          label.toLocaleLowerCase("ru-RU") ||
        item.query.toLocaleLowerCase("ru-RU") ===
          label.toLocaleLowerCase("ru-RU") ||
        item.query.toLocaleLowerCase("ru-RU") ===
          `французский стиль ${label.replace(" французский стиль", "")}`,
    );

    return {
      id: matchingItem?.id ?? `${group.id}-${label}`,
      label,
      query: matchingItem?.query ?? label,
      status: matchingItem?.status ?? "live",
    };
  });
}

export function SearchPanel({
  searchQuery,
  smartCatalogGroups,
  normalizedSearchQuery,
  searchResults,
  favoriteBouquetIds,
  failedSearchImageIds,
  formatPrice,
  closeSearchPanel,
  handleSearchQueryChange,
  clearSearchQuery,
  handleSearchSuggestionClick,
  handleSearchSuggestionTouchEnd,
  markSearchImageFailed,
  handleFavoriteClick,
  handleFavoriteTouchEnd,
  handleSearchBuyClick,
  handleSearchBuyTouchEnd,
}: SearchPanelProps) {
  return (
    <div
      className="search-panel-overlay"
      role="presentation"
      onClick={closeSearchPanel}
    >
      {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Диалог поиска с категориями и результатами
Purpose (EN): Search dialog with input, categories, and results
Назначение (RU): Диалог поиска с категориями и результатами
================================================== */}
      <aside
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="search-panel-header">
          <div>
            <h2 id="search-panel-title">Поиск букетов</h2>
          </div>
          <button
            type="button"
            className="search-panel-close"
            onClick={closeSearchPanel}
            aria-label="Закрыть поиск"
          >
            ×
          </button>
        </div>
        <div className="search-panel-control">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            placeholder="Розы, пионы, гортензия, корзина..."
            aria-label="Поиск букетов по цветам, цветкам и форматам"
            enterKeyHint="search"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-button"
              onClick={clearSearchQuery}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>
        {!normalizedSearchQuery && (
          <p className="search-helper-text" role="status">
            Ищите по цветам, названию или формату — «роза», «пион», «корзина».
          </p>
        )}
        {!normalizedSearchQuery && (
        <section className="smart-catalog-menu" aria-label="Каталог Bellaflore">
          {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Раскрывающееся меню категорий
Purpose (EN): Expandable smart catalog category menu
Назначение (RU): Раскрывающееся меню категорий
================================================== */}
          <p className="smart-catalog-section-label">Категории</p>
          <div className="smart-catalog-groups">
            {smartCatalogGroups.map((group) => (
              <details
                className="smart-catalog-group catalog-category-card"
                key={group.id}
              >
                <summary className="catalog-category-card-summary">
                  <div className="catalog-category-card-copy">
                    <strong>{group.title}</strong>
                    <p>{group.description}</p>
                  </div>
                  <span className="catalog-category-card-toggle" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="smart-catalog-items smart-catalog-items-flat catalog-category-items">
                  {getSmartCatalogDisplayItems(group).map((catalogItem) => (
                    <button
                      type="button"
                      key={catalogItem.id}
                      data-catalog-status={catalogItem.status}
                      onClick={(event) =>
                        handleSearchSuggestionClick(
                          event,
                          catalogItem.query,
                        )
                      }
                      onTouchEnd={(event) =>
                        handleSearchSuggestionTouchEnd(
                          event,
                          catalogItem.query,
                        )
                      }
                    >
                      {catalogItem.label}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
        )}
        <div
          className={`search-panel-results ${
            normalizedSearchQuery ? "search-panel-results-active" : ""
          }`}
        >
          {/* ==================================================
SECTION: PRODUCT GRID
РАЗДЕЛ: Карточки результатов поиска
Purpose (EN): Search result cards with buy and favorites
Назначение (RU): Карточки результатов поиска
================================================== */}
          {normalizedSearchQuery && searchResults.length === 0 && (
            <div className="search-empty-state" role="status">
              <div className="search-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </div>
              <p className="search-empty-title">Ничего не найдено</p>
              <p className="search-empty-copy">
                Попробуйте «роза», «белые», «пион», «гортензия», «корзина» или
                «букет».
              </p>
            </div>
          )}
          {normalizedSearchQuery && searchResults.length > 0 && (
            <p className="search-results-meta" aria-live="polite">
              Найдено: {searchResults.length}
            </p>
          )}
          {searchResults.map((bouquet) => {
            const isFavorite = favoriteBouquetIds.includes(bouquet.id);
            const searchImageFailed = failedSearchImageIds.includes(
              bouquet.id,
            );

            return (
              <article className="search-result-card" key={`search-${bouquet.id}`}>
                <div className="search-result-image">
                  {searchImageFailed ? (
                    <div className="search-result-image-fallback">
                      <span>Bellaflore</span>
                    </div>
                  ) : (
                    <Image
                      src={bouquet.src}
                      alt={bouquet.alt}
                      width={bouquet.width}
                      height={bouquet.height}
                      sizes="(max-width: 768px) 34vw, 132px"
                      unoptimized={shouldUseUnoptimizedImage(bouquet.src)}
                      onError={() => markSearchImageFailed(bouquet.id)}
                    />
                  )}
                </div>
                <div className="search-result-info">
                  <h3>{bouquet.title}</h3>
                  <p>{bouquet.description}</p>
                  <strong className="search-result-price">
                    {formatPrice(bouquet.priceRub)}
                  </strong>
                </div>
                <div className="search-result-actions">
                  <button
                    type="button"
                    className={`search-favorite-button ${isFavorite ? "active" : ""}`}
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
                  <button
                    type="button"
                    className="buy-button search-order-button"
                    onClick={(event) => handleSearchBuyClick(event, bouquet.id)}
                    onTouchEnd={(event) =>
                      handleSearchBuyTouchEnd(event, bouquet.id)
                    }
                    aria-label={`Купить ${bouquet.title}`}
                  >
                    Купить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
