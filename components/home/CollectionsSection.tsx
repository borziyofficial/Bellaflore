// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог на главной (Stage 57A premium experience)
// ==================================================
"use client";

import {
  filterHomeCatalogProducts,
  matchesHomeCatalogCategory,
  type HomeCatalogSortMode,
} from "@/components/catalog/filterHomeCatalogProducts";
import {
  homeCatalogCategoryChips,
  homeCatalogSearchPlaceholder,
  homeCatalogTitle,
} from "@/components/catalog/homeCatalogConfig";
import { useStorefrontCustomCategories } from "@/components/catalog/useStorefrontCustomCategories";
import { LuxuryCatalogProductCard } from "@/components/catalog/LuxuryCatalogProductCard";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
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
  catalogStatus?: "loading" | "ready" | "error";
  catalogErrorMessage?: string;
  onCatalogRetry?: () => void;
};

function normalizeBudgetInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 7);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseBudgetInput(value: string): number | null {
  const normalized = value.replace(/\D/g, "");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function CollectionsSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleBouquetOrderClick,
  onProductOpen,
  catalogFocusNonce = 0,
  catalogStatus = "ready",
  catalogErrorMessage = "",
  onCatalogRetry,
}: CollectionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [sortMode, setSortMode] = useState<HomeCatalogSortMode>("default");
  const customCategories = useStorefrontCustomCategories();
  const catalogRailRef = useRef<HTMLDivElement | null>(null);
  const catalogInteractionRef = useRef(false);
  const catalogInteractionTimerRef = useRef<number | null>(null);

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
  const parsedBudgetFrom = parseBudgetInput(budgetFrom);
  const parsedBudgetTo = parseBudgetInput(budgetTo);
  const normalizedBudgetFrom = parsedBudgetFrom ?? undefined;
  const normalizedBudgetTo = parsedBudgetTo ?? undefined;
  const hasBudgetFilter =
    typeof normalizedBudgetFrom === "number" ||
    typeof normalizedBudgetTo === "number";
  const activeCatalogMode = isSearchMode ? "search" : activeCategoryId;
  const isAllCategoryMode = activeCatalogMode === "all";
  const catalogViewKey = `${activeCatalogMode}:${normalizedSearchQuery}:${budgetFrom}:${budgetTo}:${sortMode}`;
  const hasCatalogLoadError = catalogStatus === "error";
  const isInitialCatalogLoading = catalogStatus === "loading" && bouquets.length === 0;

  const displayedProducts = useMemo(
    () =>
      filterHomeCatalogProducts(bouquets, {
        categoryId: isSearchMode ? "all" : activeCategoryId,
        quickFilterId: "all",
        searchQuery,
        customCategoryTitleById,
        minPriceRub: normalizedBudgetFrom,
        maxPriceRub: normalizedBudgetTo,
        sortMode,
      }),
    [
      activeCategoryId,
      bouquets,
      customCategoryTitleById,
      isSearchMode,
      normalizedBudgetFrom,
      normalizedBudgetTo,
      searchQuery,
      sortMode,
    ],
  );
  useEffect(() => {
    const rail = catalogRailRef.current;
    if (!rail) {
      return;
    }

    rail.scrollTo({ left: 0, behavior: "auto" });

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isMobile || reduceMotion || displayedProducts.length <= 2) {
      return;
    }

    const advance = () => {
      if (catalogInteractionRef.current) {
        return;
      }

      const firstCard = rail.firstElementChild as HTMLElement | null;
      if (!firstCard) {
        return;
      }

      const computed = window.getComputedStyle(rail);
      const gap = Number.parseFloat(computed.columnGap || computed.gap || "0") || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const nextLeft = rail.scrollLeft + step;

      rail.scrollTo({
        left: nextLeft >= maxScroll - 2 ? 0 : nextLeft,
        behavior: "smooth",
      });
    };

    const intervalId = window.setInterval(advance, 3600);
    return () => window.clearInterval(intervalId);
  }, [catalogViewKey, displayedProducts.length]);

  useEffect(
    () => () => {
      if (catalogInteractionTimerRef.current !== null) {
        window.clearTimeout(catalogInteractionTimerRef.current);
      }
    },
    [],
  );

  const pauseCatalogAutoplay = () => {
    catalogInteractionRef.current = true;
    if (catalogInteractionTimerRef.current !== null) {
      window.clearTimeout(catalogInteractionTimerRef.current);
      catalogInteractionTimerRef.current = null;
    }
  };

  const resumeCatalogAutoplay = () => {
    if (catalogInteractionTimerRef.current !== null) {
      window.clearTimeout(catalogInteractionTimerRef.current);
    }
    catalogInteractionTimerRef.current = window.setTimeout(() => {
      catalogInteractionRef.current = false;
      catalogInteractionTimerRef.current = null;
    }, 1800);
  };

  const collectionHighlights = useMemo(
    () =>
      categoryChips
        .filter((chip) => chip.id !== "all")
        .map((chip) => {
          const categoryProducts = bouquets.filter((bouquet) =>
            matchesHomeCatalogCategory(bouquet, chip.id, customCategoryTitleById),
          );
          const cover = categoryProducts[0];
          return cover
            ? {
                id: chip.id,
                label: chip.label,
                count: categoryProducts.length,
                image: cover,
              }
            : null;
        })
        .filter(
          (
            highlight,
          ): highlight is {
            id: string;
            label: string;
            count: number;
            image: CatalogProduct;
          } => Boolean(highlight),
        ),
    [bouquets, categoryChips, customCategoryTitleById],
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

  const handleBudgetChange =
    (setter: (value: string) => void) =>
    (event: ReactChangeEvent<HTMLInputElement>) => {
      setter(normalizeBudgetInput(event.target.value));
    };

  const resetBudgetControls = () => {
    setBudgetFrom("");
    setBudgetTo("");
    setSortMode("default");
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

        <div className={styles.priceTools} aria-label="Фильтр бюджета">
          <label className={styles.priceField}>
            <span>От</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              value={budgetFrom}
              onChange={handleBudgetChange(setBudgetFrom)}
              placeholder="₽"
              aria-label="Цена от"
            />
          </label>
          <label className={styles.priceField}>
            <span>До</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              value={budgetTo}
              onChange={handleBudgetChange(setBudgetTo)}
              placeholder="₽"
              aria-label="Цена до"
            />
          </label>
          <label className={styles.sortField}>
            <span>Цена</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as HomeCatalogSortMode)}
              aria-label="Сортировка по цене"
            >
              <option value="default">По умолчанию</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
            </select>
          </label>
          {hasBudgetFilter || sortMode !== "default" ? (
            <button type="button" className={styles.priceReset} onClick={resetBudgetControls}>
              Сброс
            </button>
          ) : null}
        </div>
      </div>

      {!isSearchMode && collectionHighlights.length > 0 ? (
        <div className={`${styles.collectionRail} bf-reveal bf-reveal-up`}>
          {collectionHighlights.map((collection) => {
            const isActive = activeCategoryId === collection.id;
            return (
              <button
                key={collection.id}
                type="button"
                className={`${styles.collectionTile} ${
                  isActive ? styles.collectionTileActive : ""
                }`}
                onClick={() => handleCategorySelect(collection.id)}
                aria-pressed={isActive}
              >
                <span className={styles.collectionImage}>
                  <ProductImageWithFallback
                    src={collection.image.src}
                    alt=""
                    width={collection.image.width}
                    height={collection.image.height}
                    sizes="(max-width: 768px) 44vw, 210px"
                    imageClassName={styles.collectionImg}
                    fallbackClassName={styles.collectionFallback}
                  />
                </span>
                <span className={styles.collectionCopy}>
                  <strong>{collection.label}</strong>
                  <span>{collection.count} вариантов</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isInitialCatalogLoading ? (
        <div
          className={`${styles.grid} ${styles.loadingGrid}`}
          data-catalog-state="loading"
          role="status"
          aria-label="Загружаем букеты"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.loadingCard} key={index} aria-hidden="true">
              <div className={styles.loadingImage} />
              <div className={styles.loadingLineShort} />
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineMedium} />
              <div className={styles.loadingButton} />
            </div>
          ))}
        </div>
      ) : hasCatalogLoadError && bouquets.length === 0 ? (
        <div className={styles.emptyState} data-catalog-state="error">
          <p className={styles.emptyTitle}>Каталог временно не загрузился</p>
          <p className={styles.emptyMessage}>
            {catalogErrorMessage || "Проверьте соединение и попробуйте снова."}
          </p>
          {onCatalogRetry ? (
            <button type="button" className={styles.emptyReset} onClick={onCatalogRetry}>
              Повторить
            </button>
          ) : null}
        </div>
      ) : displayedProducts.length === 0 ? (
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
          ref={catalogRailRef}
          className={`${styles.grid} ${
            isAllCategoryMode ? styles.gridAll : styles.gridCategory
          }`}
          data-catalog-mode={activeCatalogMode}
          onTouchStart={pauseCatalogAutoplay}
          onTouchEnd={resumeCatalogAutoplay}
          onTouchCancel={resumeCatalogAutoplay}
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
