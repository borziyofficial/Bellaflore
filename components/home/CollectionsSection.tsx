// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог на главной (Stage 57A premium experience)
// ==================================================
"use client";

import { filterHomeCatalogProducts } from "@/components/catalog/filterHomeCatalogProducts";
import {
  homeCatalogCategoryChips,
  homeCatalogSearchPlaceholder,
  homeCatalogSubtitle,
  homeCatalogTitle,
} from "@/components/catalog/homeCatalogConfig";
import type { HomeCatalogSectionId } from "@/components/catalog/homeCatalogSections";
import { LuxuryCatalogProductCard } from "@/components/catalog/LuxuryCatalogProductCard";
import styles from "@/components/home/CollectionsSection.module.css";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type CollectionsSectionProps = {
  bouquets: CatalogProduct[];
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
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  handleBouquetOrderTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onProductOpen?: (productId: string) => void;
  catalogFocusNonce?: number;
  focusSectionId?: HomeCatalogSectionId | null;
};

function mapFocusSectionToCategoryId(
  sectionId: HomeCatalogSectionId | null,
): string {
  switch (sectionId) {
    case "new":
      return "new";
    case "roses":
      return "roses";
    case "peonies":
      return "peonies";
    case "hydrangeas":
      return "hydrangeas";
    case "baskets-boxes":
      return "baskets";
    default:
      return "all";
  }
}

export function CollectionsSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleFavoriteTouchEnd,
  handleBouquetOrderClick,
  handleBouquetOrderTouchEnd,
  onProductOpen,
  catalogFocusNonce = 0,
  focusSectionId = null,
}: CollectionsSectionProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    if (!catalogFocusNonce) {
      return;
    }

    if (focusSectionId) {
      setActiveCategoryId(mapFocusSectionToCategoryId(focusSectionId));
    }

    document.getElementById("collections")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    if (!focusSectionId) {
      searchInputRef.current?.focus({ preventScroll: true });
    }
  }, [catalogFocusNonce, focusSectionId]);

  const normalizedSearchQuery = searchQuery.trim();
  const isSearchMode = normalizedSearchQuery.length > 0;

  const displayedProducts = useMemo(
    () =>
      filterHomeCatalogProducts(bouquets, {
        categoryId: isSearchMode ? "all" : activeCategoryId,
        quickFilterId: "all",
        searchQuery,
      }),
    [activeCategoryId, bouquets, isSearchMode, searchQuery],
  );

  const handleSearchChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const showAllProducts = () => {
    setSearchQuery("");
    setActiveCategoryId("all");
    searchInputRef.current?.focus();
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setSearchQuery("");
  };

  return (
    <section id="collections" className={styles.section}>
      <header className={`${styles.header} bf-reveal bf-reveal-up`}>
        <h2>{homeCatalogTitle}</h2>
        <p className={styles.subtitle}>{homeCatalogSubtitle}</p>
      </header>

      <div className={`${styles.toolbar} bf-reveal bf-reveal-up`}>
        <label className={styles.searchField}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            id="home-catalog-search"
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={homeCatalogSearchPlaceholder}
            aria-label="Поиск букетов"
            autoComplete="off"
            enterKeyHint="search"
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.searchClear}
              onClick={clearSearch}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          ) : null}
        </label>

        <div
          className={styles.categoryRow}
          role="tablist"
          aria-label="Категории букетов"
        >
          {homeCatalogCategoryChips.map((chip) => {
            const isActive = !isSearchMode && activeCategoryId === chip.id;

            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ""}`}
                onClick={() => handleCategorySelect(chip.id)}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {displayedProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Букеты не найдены</p>
          <p className={styles.emptyMessage}>Попробуйте другой запрос</p>
          <button type="button" className={styles.emptyReset} onClick={showAllProducts}>
            Показать все
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedProducts.map((bouquet) => (
            <LuxuryCatalogProductCard
              key={bouquet.id}
              product={bouquet}
              formatPrice={formatPrice}
              isFavorite={favoriteBouquetIds.includes(bouquet.id)}
              onFavoriteClick={handleFavoriteClick}
              onFavoriteTouchEnd={handleFavoriteTouchEnd}
              onBuyClick={handleBouquetOrderClick}
              onBuyTouchEnd={handleBouquetOrderTouchEnd}
              onProductOpen={onProductOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
