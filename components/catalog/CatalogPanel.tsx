// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог
//
// Purpose (EN):
// Premium slide-out catalog with search, filters, and product grid
//
// Назначение (RU):
// Премиальная панель каталога с поиском и сеткой товаров
// ==================================================
"use client";

import Image from "next/image";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useMemo, useRef, useState } from "react";
import {
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  catalogFilterChips,
  catalogPremiumMenu,
  catalogProductBadges,
  catalogSearchPlaceholder,
  getVisibleCatalogMenu,
  type CatalogMenuItem,
} from "@/components/catalog/catalogConfig";
import type { CatalogCategorySearchResult } from "@/components/search/searchFoundation";
import { normalizeSearchText } from "@/components/search/searchFoundation";
import { SmartSearchHints } from "@/components/smartSearch/SmartSearchHints";
import type {
  SmartSearchEmptyState,
  SmartSearchProductResult,
} from "@/components/smartSearch/smartSearchTypes";
import { getProductExperienceData, getProductSizeVariant } from "@/components/product/productExperienceCatalog";
import { ProductSizeSelector } from "@/components/product/ProductSizeSelector";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";

type CatalogBouquet = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  priceRub: number;
  width: number;
  height: number;
};

type CatalogPanelProps = {
  searchQuery: string;
  normalizedSearchQuery: string;
  searchResults: CatalogBouquet[];
  searchCategoryResults: CatalogCategorySearchResult[];
  allBouquets: CatalogBouquet[];
  favoriteBouquetIds: string[];
  failedSearchImageIds: string[];
  formatPrice: (priceRub: number) => string;
  onClose: () => void;
  onOpenFavorites: () => void;
  onOpenMyOrder: () => void;
  onSearchQueryChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onFilterClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    query: string,
  ) => void;
  onFilterTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    query: string,
  ) => void;
  markSearchImageFailed: (bouquetId: string) => void;
  onBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onFavoriteClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  onFavoriteTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  onProductOpen: (bouquetId: string) => void;
  smartSearchEmptyState?: SmartSearchEmptyState | null;
  smartResultByProductId?: Map<string, SmartSearchProductResult>;
  onSearchSuggestionSelect?: (query: string) => void;
};

function CatalogMenuIcon({ icon }: { icon?: string }) {
  return (
    <span className="catalog-v1-row-icon" aria-hidden="true">
      {icon ?? "✿"}
    </span>
  );
}

function getActiveChipId(normalizedSearchQuery: string) {
  if (!normalizedSearchQuery) {
    return "all";
  }

  const matchedChip = catalogFilterChips.find(
    (chip) =>
      chip.query && normalizeSearchText(chip.query) === normalizedSearchQuery,
  );

  return matchedChip?.id ?? null;
}

type CatalogProductCardProps = {
  bouquet: CatalogBouquet;
  isFavorite: boolean;
  imageFailed: boolean;
  formatPrice: (priceRub: number) => string;
  onFavoriteClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  onFavoriteTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  onBuyClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onBuyTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onProductOpen: (bouquetId: string) => void;
  smartMatchReason?: string | null;
  markSearchImageFailed: (bouquetId: string) => void;
};

function CatalogProductCard({
  bouquet,
  isFavorite,
  imageFailed,
  formatPrice,
  onFavoriteClick,
  onFavoriteTouchEnd,
  onBuyClick,
  onBuyTouchEnd,
  onProductOpen,
  smartMatchReason = null,
  markSearchImageFailed,
}: CatalogProductCardProps) {
  const badge = catalogProductBadges[bouquet.id];
  const experienceData = useMemo(() => getProductExperienceData(bouquet), [bouquet]);
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.defaultSizeId,
  );
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);

  return (
    <article className="catalog-v11-product-card">
      {/* ==================================================
SECTION: PRODUCT CARD
РАЗДЕЛ: Медиа, бейдж и избранное
Purpose (EN): Media, badge, and favorites
Назначение (RU): Медиа, бейдж и избранное
================================================== */}
      <div
        role="button"
        tabIndex={0}
        className="catalog-v11-product-media catalog-v11-product-open"
        onClick={() => onProductOpen(bouquet.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onProductOpen(bouquet.id);
          }
        }}
        aria-label={`Открыть ${bouquet.title}`}
      >
        {badge && (
          <span className="catalog-v11-product-badge">{badge}</span>
        )}
        <button
          type="button"
          className={`catalog-v11-product-heart ${isFavorite ? "active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteClick(event, bouquet.id);
          }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            onFavoriteTouchEnd(event, bouquet.id);
          }}
          aria-label={
            isFavorite
              ? `Убрать ${bouquet.title} из избранного`
              : `Добавить ${bouquet.title} в избранное`
          }
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
          </svg>
        </button>
        {imageFailed ? (
          <div className="catalog-v11-product-fallback">
            <BrandLogo variant="compact" className="catalog-v11-product-fallback-brand" />
          </div>
        ) : (
          <Image
            src={bouquet.src}
            alt={bouquet.alt}
            fill
            sizes="(max-width: 768px) 46vw, 220px"
            className="catalog-v11-product-image"
            onError={() => markSearchImageFailed(bouquet.id)}
          />
        )}
      </div>
      {/* ==================================================
SECTION: PRODUCT CARD
РАЗДЕЛ: Название, цена и кнопка добавления
Purpose (EN): Title, price, and add button
Назначение (RU): Название, цена и кнопка добавления
================================================== */}
      <div className="catalog-v11-product-body">
        <button
          type="button"
          className="catalog-v11-product-open-copy"
          onClick={() => onProductOpen(bouquet.id)}
        >
          <h4 className="catalog-v11-product-title">{bouquet.title}</h4>
          <p className="catalog-v11-product-description">{bouquet.description}</p>
          {smartMatchReason ? (
            <p className="catalog-v11-product-smart-match">{smartMatchReason}</p>
          ) : null}
        </button>
        <div className="catalog-v11-product-size-selector">
        <ProductSizeSelector
          layout="compact"
          variants={experienceData.sizeVariants}
          selectedSizeId={selectedSizeId}
          onSelectSize={setSelectedSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L"]}
          showSelectedPrice={false}
          ariaLabel={`Размеры для ${bouquet.title}`}
        />
        <div className="catalog-v11-product-footer">
          <div className="catalog-v11-product-price-wrap">
            <span className="catalog-v11-product-size-label">
              Размер {selectedVariant.label}
            </span>
            <strong className="catalog-v11-product-price">
              {formatPrice(selectedVariant.priceRub)}
            </strong>
          </div>
          <button
            type="button"
            className="catalog-v11-product-choose"
            onClick={(event) =>
              onBuyClick(
                event,
                bouquet.id,
                selectedVariant.sizeId,
                selectedVariant.priceRub,
              )
            }
            onTouchEnd={(event) =>
              onBuyTouchEnd(
                event,
                bouquet.id,
                selectedVariant.sizeId,
                selectedVariant.priceRub,
              )
            }
            aria-label={`Купить ${bouquet.title} в размере ${selectedVariant.label}`}
          >
            +
          </button>
        </div>
        </div>
      </div>
    </article>
  );
}

export function CatalogPanel({
  searchQuery,
  normalizedSearchQuery,
  searchResults,
  searchCategoryResults,
  allBouquets,
  favoriteBouquetIds,
  failedSearchImageIds,
  formatPrice,
  onClose,
  onOpenFavorites,
  onOpenMyOrder,
  onSearchQueryChange,
  onClearSearch,
  onFilterClick,
  onFilterTouchEnd,
  markSearchImageFailed,
  onBuyClick,
  onBuyTouchEnd,
  onFavoriteClick,
  onFavoriteTouchEnd,
  onProductOpen,
  smartSearchEmptyState = null,
  smartResultByProductId,
  onSearchSuggestionSelect,
}: CatalogPanelProps) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuItems = getVisibleCatalogMenu(catalogPremiumMenu);
  const isSearchActive = normalizedSearchQuery.length > 0;
  const activeChipId = getActiveChipId(normalizedSearchQuery);
  const showProductResults = isSearchActive && searchResults.length > 0;
  const showCategoryResults =
    isSearchActive &&
    searchResults.length === 0 &&
    searchCategoryResults.length > 0;
  const showSearchEmpty =
    isSearchActive &&
    searchResults.length === 0 &&
    searchCategoryResults.length === 0;
  const showDefaultGrid = !isSearchActive;
  const showProductGrid = showDefaultGrid || showProductResults;
  const gridProducts = showProductResults ? searchResults : allBouquets;
  const showAccordionMenu = !isSearchActive || showSearchEmpty;

  const applyFilter = (
    event: ReactMouseEvent<HTMLButtonElement>,
    query: string,
  ) => {
    onFilterClick(event, query);
  };

  const applyFilterTouch = (
    event: ReactTouchEvent<HTMLButtonElement>,
    query: string,
  ) => {
    onFilterTouchEnd(event, query);
  };

  const toggleAccordion = (itemId: string) => {
    setOpenCategoryId((current) => (current === itemId ? null : itemId));
  };

  const scrollToCategory = (menuItemId: string) => {
    requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector(`[data-catalog-item="${menuItemId}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  const openCategoryInAccordion = (result: CatalogCategorySearchResult) => {
    onClearSearch();
    setOpenCategoryId(result.parentId ?? result.menuItemId);
    scrollToCategory(result.parentId ?? result.menuItemId);
  };

  const handleCategoryResultClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    result: CatalogCategorySearchResult,
  ) => {
    event.preventDefault();
    openCategoryInAccordion(result);
  };

  const handleCategoryResultTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    result: CatalogCategorySearchResult,
  ) => {
    event.preventDefault();
    openCategoryInAccordion(result);
  };

  const handleShowAllCategories = () => {
    onClearSearch();
    setOpenCategoryId(null);
  };

  const handleChipClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    query: string,
  ) => {
    if (!query) {
      onClearSearch();
      return;
    }

    applyFilter(event, query);
  };

  const handleChipTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    query: string,
  ) => {
    event.preventDefault();

    if (!query) {
      onClearSearch();
      return;
    }

    applyFilterTouch(event, query);
  };

  const handleMainCategoryClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    item: CatalogMenuItem,
  ) => {
    if (item.children && item.children.length > 0) {
      toggleAccordion(item.id);
      return;
    }

    applyFilter(event, item.query);
  };

  const handleMainCategoryTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    item: CatalogMenuItem,
  ) => {
    if (item.children && item.children.length > 0) {
      event.preventDefault();
      toggleAccordion(item.id);
      return;
    }

    applyFilterTouch(event, item.query);
  };

  return (
    <div
      className="search-panel-overlay luxury-catalog-overlay catalog-v1-overlay catalog-v8-overlay catalog-v11-overlay"
      role="presentation"
      onClick={onClose}
    >
      {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Диалог премиального каталога
Purpose (EN): Premium catalog dialog
Назначение (RU): Диалог премиального каталога
================================================== */}
      <aside
        className="luxury-catalog-panel catalog-v1-panel catalog-v8-panel catalog-v11-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="luxury-catalog-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Верхняя панель с логотипом и действиями
Purpose (EN): Top bar with brand and quick actions
Назначение (RU): Верхняя панель с логотипом и действиями
================================================== */}
        <header className="catalog-v1-top catalog-v11-top">
          <div className="catalog-v1-brand">
            <BrandLogo variant="panel" className="catalog-v1-logo" />
          </div>
          <div className="catalog-v1-top-actions">
            <button
              type="button"
              className="catalog-v1-icon-button"
              onClick={onOpenFavorites}
              aria-label="Избранное"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
              </svg>
            </button>
            <button
              type="button"
              className="catalog-v1-icon-button"
              onClick={onOpenMyOrder}
              aria-label="Мой заказ"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M7.2 3.8h8.2l2.4 2.4v14H7.2z" />
                <path d="M15.4 3.8v2.4h2.4" />
              </svg>
            </button>
            <button
              type="button"
              className="catalog-v1-icon-button catalog-v1-close"
              onClick={onClose}
              aria-label="Закрыть каталог"
            >
              ×
            </button>
          </div>
        </header>

        <h2 id="luxury-catalog-title" className="sr-only">
          Каталог Bellaflore
        </h2>

        {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Поле поиска с очисткой
Purpose (EN): Search input with clear control
Назначение (RU): Поле поиска с очисткой
================================================== */}
        <div className="luxury-catalog-search catalog-v1-search catalog-v11-search">
          <span className="catalog-v1-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder={catalogSearchPlaceholder}
            aria-label="Поиск в каталоге Bellaflore"
            enterKeyHint="search"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-button"
              onClick={onClearSearch}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>

        {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Панель фильтров-чипов
Purpose (EN): Filter chip toolbar
Назначение (RU): Панель фильтров-чипов
================================================== */}
        <div
          className="catalog-v11-chips"
          role="toolbar"
          aria-label="Фильтры каталога"
        >
          {catalogFilterChips.map((chip) => {
            const isActive =
              chip.id === "all"
                ? activeChipId === "all"
                : activeChipId === chip.id;

            return (
              <button
                type="button"
                key={chip.id}
                className={`catalog-v11-chip ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}
                onClick={(event) => handleChipClick(event, chip.query)}
                onTouchEnd={(event) => handleChipTouchEnd(event, chip.query)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <SmartSearchHints
          visible={!isSearchActive && Boolean(onSearchSuggestionSelect)}
          onSuggestionSelect={(query) => onSearchSuggestionSelect?.(query)}
        />

        <div className="luxury-catalog-body catalog-v1-body catalog-v8-body catalog-v11-body">
          {showSearchEmpty && (
            <div className="catalog-search-empty catalog-v11-empty" role="status">
              <BrandLogo variant="compact" className="catalog-empty-brand" />
              <h3 className="catalog-search-empty-title">
                {smartSearchEmptyState?.title ?? "Ничего не найдено"}
              </h3>
              <p className="catalog-search-empty-text">
                {smartSearchEmptyState?.message ??
                  "Попробуйте: розы, гортензия, 101 роза, коробка"}
              </p>
              {smartSearchEmptyState?.filterHint ? (
                <p className="catalog-search-empty-text">{smartSearchEmptyState.filterHint}</p>
              ) : null}

              {smartSearchEmptyState &&
              (smartSearchEmptyState.similarProducts.length > 0 ||
                smartSearchEmptyState.popularProducts.length > 0) ? (
                <div className="catalog-smart-search-fallback">
                  {smartSearchEmptyState.similarProducts.length > 0 ? (
                    <section aria-label="Похожие букеты">
                      <p className="catalog-v11-section-label">Похожие букеты</p>
                      <div className="catalog-smart-search-fallback-list">
                        {smartSearchEmptyState.similarProducts.map((product) => (
                          <button
                            key={`similar-${product.id}`}
                            type="button"
                            className="catalog-smart-search-fallback-item"
                            onClick={() => onProductOpen(product.id)}
                          >
                            {product.title}
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {smartSearchEmptyState.popularProducts.length > 0 ? (
                    <section aria-label="Популярные букеты">
                      <p className="catalog-v11-section-label">Популярные</p>
                      <div className="catalog-smart-search-fallback-list">
                        {smartSearchEmptyState.popularProducts.map((product) => (
                          <button
                            key={`popular-${product.id}`}
                            type="button"
                            className="catalog-smart-search-fallback-item"
                            onClick={() => onProductOpen(product.id)}
                          >
                            {product.title}
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                className="catalog-search-empty-button"
                onClick={handleShowAllCategories}
              >
                Показать все категории
              </button>
            </div>
          )}

          {showCategoryResults && (
            <section
              className="catalog-search-category-results catalog-v11-category-results"
              aria-label="Категории по запросу"
            >
              <p className="catalog-v11-section-label">
                Категории · {searchCategoryResults.length}
              </p>
              <div className="catalog-search-category-list">
                {searchCategoryResults.map((result) => (
                  <button
                    type="button"
                    key={`category-${result.id}`}
                    className="catalog-search-category-card"
                    onClick={(event) => handleCategoryResultClick(event, result)}
                    onTouchEnd={(event) =>
                      handleCategoryResultTouchEnd(event, result)
                    }
                  >
                    <span className="catalog-search-category-icon" aria-hidden="true">
                      {result.icon ?? "✿"}
                    </span>
                    <span className="catalog-search-category-copy">
                      <strong>{result.title}</strong>
                      <span>{result.subtitle}</span>
                    </span>
                    <span className="catalog-search-category-arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showProductGrid && gridProducts.length > 0 && (
            <section
              className="catalog-v11-products"
              aria-label={
                showProductResults ? "Результаты поиска" : "Каталог букетов"
              }
            >
              {/* ==================================================
SECTION: PRODUCT GRID
РАЗДЕЛ: Сетка карточек букетов
Purpose (EN): Bouquet product cards
Назначение (RU): Сетка карточек букетов
================================================== */}
              {showProductResults && (
                <p className="catalog-v11-section-label">
                  Найдено · {searchResults.length}
                </p>
              )}
              <div className="catalog-v11-product-grid">
                {gridProducts.map((bouquet) => (
                  <CatalogProductCard
                    key={`catalog-product-${bouquet.id}`}
                    bouquet={bouquet}
                    isFavorite={favoriteBouquetIds.includes(bouquet.id)}
                    imageFailed={failedSearchImageIds.includes(bouquet.id)}
                    formatPrice={formatPrice}
                    onFavoriteClick={onFavoriteClick}
                    onFavoriteTouchEnd={onFavoriteTouchEnd}
                    onBuyClick={onBuyClick}
                    onBuyTouchEnd={onBuyTouchEnd}
                    onProductOpen={onProductOpen}
                    smartMatchReason={
                      smartResultByProductId?.get(bouquet.id)?.reasonSummary ?? null
                    }
                    markSearchImageFailed={markSearchImageFailed}
                  />
                ))}
              </div>
            </section>
          )}

          {showAccordionMenu && (
            <section className="catalog-v11-menu-section">
              {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Раскрывающийся аккордеон категорий
Purpose (EN): Expandable category accordion
Назначение (RU): Раскрывающийся аккордеон категорий
================================================== */}
              <p className="catalog-v11-section-label">Категории</p>
              <nav
                ref={menuRef}
                className="catalog-v1-menu catalog-v8-menu catalog-v11-menu"
                aria-label="Категории Bellaflore"
              >
                {menuItems.map((item) => {
                  const isOpen = openCategoryId === item.id;
                  const hasChildren = Boolean(item.children?.length);

                  return (
                    <div key={item.id} className="catalog-v8-entry">
                      {item.dividerBefore && (
                        <div className="catalog-v8-divider" aria-hidden="true" />
                      )}
                      <div
                        className={`catalog-v1-group catalog-v8-group catalog-v11-group ${isOpen ? "is-open" : ""}`}
                        data-catalog-item={item.id}
                      >
                        <button
                          type="button"
                          className="catalog-v1-row catalog-v8-row"
                          aria-expanded={hasChildren ? isOpen : undefined}
                          onClick={(event) => handleMainCategoryClick(event, item)}
                          onTouchEnd={(event) =>
                            handleMainCategoryTouchEnd(event, item)
                          }
                        >
                          <CatalogMenuIcon icon={item.icon} />
                          <span className="catalog-v1-row-label">{item.label}</span>
                          {hasChildren && (
                            <span
                              className={`catalog-v1-chevron catalog-v8-chevron ${isOpen ? "is-open" : ""}`}
                              aria-hidden="true"
                            />
                          )}
                        </button>

                        {hasChildren && (
                          <div
                            className="catalog-v8-sublist-wrap"
                            aria-hidden={!isOpen}
                          >
                            <div className="catalog-v1-sublist catalog-v8-sublist">
                              {item.children?.map((child) => (
                                <button
                                  type="button"
                                  key={child.id}
                                  className="catalog-v1-subrow catalog-v8-subrow"
                                  tabIndex={isOpen ? 0 : -1}
                                  onClick={(event) => applyFilter(event, child.query)}
                                  onTouchEnd={(event) =>
                                    applyFilterTouch(event, child.query)
                                  }
                                >
                                  {child.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
