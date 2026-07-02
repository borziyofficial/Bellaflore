// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог на главной (Stage 56A luxury reset)
// ==================================================
"use client";

import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import { filterHomeCatalogProducts } from "@/components/catalog/filterHomeCatalogProducts";
import { homeCatalogSearchPlaceholder } from "@/components/catalog/homeCatalogConfig";
import {
  getHomeCatalogSectionProducts,
  HOME_CATALOG_SECTIONS,
  type HomeCatalogSectionId,
} from "@/components/catalog/homeCatalogSections";
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

  useEffect(() => {
    if (!catalogFocusNonce) {
      return;
    }

    document.getElementById("collections")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    if (focusSectionId) {
      window.setTimeout(() => {
        document
          .getElementById(
            HOME_CATALOG_SECTIONS.find((section) => section.id === focusSectionId)
              ?.anchorId ?? "collections",
          )
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
      return;
    }

    searchInputRef.current?.focus({ preventScroll: true });
  }, [catalogFocusNonce, focusSectionId]);

  const normalizedSearchQuery = searchQuery.trim();
  const isSearchMode = normalizedSearchQuery.length > 0;

  const searchResults = useMemo(
    () =>
      filterHomeCatalogProducts(bouquets, {
        categoryId: "all",
        quickFilterId: "all",
        searchQuery,
      }),
    [bouquets, searchQuery],
  );

  const sectionGroups = useMemo(
    () =>
      HOME_CATALOG_SECTIONS.map((section) => ({
        ...section,
        products: getHomeCatalogSectionProducts(section.id, bouquets),
      })).filter((section) => section.products.length > 0),
    [bouquets],
  );

  const handleSearchChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <section id="collections" className={`bouquets ${styles.section}`}>
      <div className={`section-header bf-reveal bf-reveal-up ${styles.header}`}>
        <span>Каталог</span>
        <h2>Букеты Bellaflore</h2>
        <p className={styles.headerNote}>
          Премиальные композиции с доставкой сегодня по Москве
        </p>
      </div>

      <div className={`${styles.catalogToolbar} bf-reveal bf-reveal-up`}>
        <label className={styles.searchField}>
          <span className={styles.searchFieldIcon} aria-hidden="true">
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
      </div>

      {isSearchMode ? (
        searchResults.length === 0 ? (
          <div className={styles.emptyState}>
            <p>По вашему запросу букеты не найдены.</p>
            <button type="button" className={styles.emptyReset} onClick={clearSearch}>
              Очистить поиск
            </button>
          </div>
        ) : (
          <div className={`bouquet-grid ${styles.grid} ${styles.searchGrid}`}>
            {searchResults.map((bouquet) => (
              <LuxuryCatalogProductCard
                key={bouquet.id}
                product={bouquet}
                formatPrice={formatPrice}
                isFavorite={favoriteBouquetIds.includes(bouquet.id)}
                badge={catalogProductBadges[bouquet.id]}
                onFavoriteClick={handleFavoriteClick}
                onFavoriteTouchEnd={handleFavoriteTouchEnd}
                onBuyClick={handleBouquetOrderClick}
                onBuyTouchEnd={handleBouquetOrderTouchEnd}
                onProductOpen={onProductOpen}
              />
            ))}
          </div>
        )
      ) : (
        <div className={styles.sections}>
          {sectionGroups.map((section) => (
            <section
              key={section.id}
              id={section.anchorId}
              className={styles.sectionBlock}
              aria-labelledby={`${section.anchorId}-title`}
            >
              <div className={styles.sectionHeader}>
                <h3 id={`${section.anchorId}-title`}>{section.title}</h3>
              </div>
              <div className={`bouquet-grid ${styles.grid}`}>
                {section.products.map((bouquet) => (
                  <LuxuryCatalogProductCard
                    key={`${section.id}-${bouquet.id}`}
                    product={bouquet}
                    formatPrice={formatPrice}
                    isFavorite={favoriteBouquetIds.includes(bouquet.id)}
                    badge={catalogProductBadges[bouquet.id]}
                    onFavoriteClick={handleFavoriteClick}
                    onFavoriteTouchEnd={handleFavoriteTouchEnd}
                    onBuyClick={handleBouquetOrderClick}
                    onBuyTouchEnd={handleBouquetOrderTouchEnd}
                    onProductOpen={onProductOpen}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
