// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог на главной (Stage 57A premium experience)
// ==================================================
"use client";

import { filterHomeCatalogProducts } from "@/components/catalog/filterHomeCatalogProducts";
import {
  homeCatalogCategoryChips,
  homeCatalogSearchPlaceholder,
  homeCatalogTitle,
} from "@/components/catalog/homeCatalogConfig";
import { useStorefrontCustomCategories } from "@/components/catalog/useStorefrontCustomCategories";
import { LuxuryCatalogProductCard } from "@/components/catalog/LuxuryCatalogProductCard";
import { SmartPromoBanner } from "@/components/home/SmartPromoBanner";
import styles from "@/components/home/CollectionsSection.module.css";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

type CollectionsSectionProps = {
  bouquets: CatalogProduct[];
  favoriteBouquetIds: string[];
  formatPrice: (priceRub: number) => string;
  handleFavoriteClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => void;
  handleBouquetOrderClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onProductOpen?: (productId: string) => void;
  catalogFocusNonce?: number;
};

export function CollectionsSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleBouquetOrderClick,
  onProductOpen,
  catalogFocusNonce = 0,
}: CollectionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const customCategories = useStorefrontCustomCategories();

  const customCategoryTitleById = useMemo(
    () => Object.fromEntries(customCategories.map((category) => [category.id, category.title])),
    [customCategories],
  );

  const categoryChips = useMemo(() => {
    const existingIds = new Set(homeCatalogCategoryChips.map((chip) => chip.id));
    const extraChips = customCategories
      .filter((category) => !existingIds.has(category.id))
      .map((category) => ({ id: category.id, label: category.title }));
    return [...homeCatalogCategoryChips, ...extraChips];
  }, [customCategories]);

  useEffect(() => {
    const requestedCategoryId = new URLSearchParams(window.location.search).get("category");
    if (
      !requestedCategoryId ||
      !categoryChips.some((category) => category.id === requestedCategoryId)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveCategoryId(requestedCategoryId);
      setSearchQuery("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [categoryChips]);

  useEffect(() => {
    if (!catalogFocusNonce) {
      return;
    }

    document.getElementById("catalog")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [catalogFocusNonce]);

  const normalizedSearchQuery = searchQuery.trim();
  const isSearchMode = normalizedSearchQuery.length > 0;
  const activeCatalogMode = isSearchMode ? "search" : activeCategoryId;
  const isAllCategoryMode = activeCatalogMode === "all";
  const catalogViewKey = `${activeCatalogMode}:${normalizedSearchQuery}`;

  const displayedProducts = useMemo(
    () =>
      filterHomeCatalogProducts(bouquets, {
        categoryId: isSearchMode ? "all" : activeCategoryId,
        quickFilterId: "all",
        searchQuery,
        customCategoryTitleById,
      }),
    [activeCategoryId, bouquets, customCategoryTitleById, isSearchMode, searchQuery],
  );
  const showFeaturedProducts = isAllCategoryMode && !isSearchMode;
  const featuredProducts = showFeaturedProducts ? displayedProducts.slice(0, 4) : [];
  const catalogProducts = showFeaturedProducts
    ? displayedProducts.slice(featuredProducts.length)
    : displayedProducts;

  const handleSearchChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const showAllProducts = () => {
    setSearchQuery("");
    setActiveCategoryId("all");
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setSearchQuery("");
    const url = new URL(window.location.href);
    if (categoryId === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", categoryId);
    }
    url.hash = "catalog";
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <section id="catalog" className={styles.section}>
      <div className={`${styles.toolbar} bf-reveal bf-reveal-up`}>
        <label className={styles.searchField}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            id="home-catalog-search"
            type="text"
            inputMode="search"
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
              <svg aria-hidden="true" viewBox="0 0 12 12">
                <path d="M3 3l6 6M9 3 3 9" />
              </svg>
            </button>
          ) : null}
        </label>

      </div>

      <SmartPromoBanner />

      {featuredProducts.length > 0 ? (
        <div className={styles.featuredSection}>
          <header className={styles.sectionHeading}>
            <p>Выбор флористов</p>
            <h2>Популярные букеты</h2>
          </header>
          <div className={`${styles.grid} ${styles.featuredGrid}`}>
            {featuredProducts.map((bouquet) => (
              <LuxuryCatalogProductCard
                key={`featured:${bouquet.id}`}
                product={bouquet}
                formatPrice={formatPrice}
                isFavorite={favoriteBouquetIds.includes(bouquet.id)}
                onFavoriteClick={handleFavoriteClick}
                onBuyClick={handleBouquetOrderClick}
                onProductOpen={onProductOpen}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.categoriesBlock}>
        <header className={styles.sectionHeading}>
          <p>Коллекции</p>
          <h2>{homeCatalogTitle}</h2>
        </header>
        <div
          className={styles.categoryRow}
          role="tablist"
          aria-label="Категории букетов"
        >
          {categoryChips.map((chip) => {
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

      {catalogProducts.length === 0 && displayedProducts.length === 0 ? (
        <div
          key={`empty:${catalogViewKey}`}
          className={styles.emptyState}
          data-catalog-mode={activeCatalogMode}
        >
          <p className={styles.emptyTitle}>Букеты не найдены</p>
          <p className={styles.emptyMessage}>Попробуйте другой запрос</p>
          <button type="button" className={styles.emptyReset} onClick={showAllProducts}>
            Показать все
          </button>
        </div>
      ) : (
        <div
          key={`grid:${catalogViewKey}`}
          className={`${styles.grid} ${
            isAllCategoryMode ? styles.gridAll : styles.gridCategory
          }`}
          data-catalog-mode={activeCatalogMode}
        >
          {catalogProducts.map((bouquet) => (
            <LuxuryCatalogProductCard
              key={`${catalogViewKey}:${bouquet.id}`}
              product={bouquet}
              formatPrice={formatPrice}
              isFavorite={favoriteBouquetIds.includes(bouquet.id)}
              onFavoriteClick={handleFavoriteClick}
              onBuyClick={handleBouquetOrderClick}
              onProductOpen={onProductOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
}
