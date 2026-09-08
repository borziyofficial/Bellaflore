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

    // A fresh page load — e.g. a shared "#catalog" link, a
    // "?category=…#catalog" Smart Banner button, or any deep link that
    // reaches this effect before the page has finished mounting — can fire
    // while the Hero/Smart Banner images and fonts are still settling the
    // layout above the catalog. Starting an animated `scroll-behavior:
    // smooth` scroll against a page that is still shifting can get
    // interrupted by that shift and land back at the top, which is why
    // "go to catalog" links used to look like they did nothing. On a
    // still-loading page we wait for the window to finish loading, then
    // jump instantly (nothing left to interrupt) and repeat once more
    // shortly after in case something still shifts the target late (a slow
    // banner image swapping in, for example).
    const focusCatalogInstantly = () => {
      document.getElementById("catalog")?.scrollIntoView({ behavior: "auto", block: "start" });
      window.setTimeout(() => {
        document.getElementById("catalog")?.scrollIntoView({ behavior: "auto", block: "start" });
      }, 350);
    };

    if (typeof document !== "undefined" && document.readyState !== "complete") {
      window.addEventListener("load", focusCatalogInstantly, { once: true });
      return () => window.removeEventListener("load", focusCatalogInstantly);
    }

    // Page is already loaded and stable (e.g. clicking "Каталог" in the
    // header while already browsing the homepage) — a smooth scroll here
    // looks nicer and has nothing to interrupt it.
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
      <header className={`${styles.header} bf-reveal bf-reveal-up`}>
        <h2>{homeCatalogTitle}</h2>
      </header>

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

      {displayedProducts.length === 0 ? (
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
          {displayedProducts.map((bouquet) => (
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
