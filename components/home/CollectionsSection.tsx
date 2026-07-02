// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог на главной
//
// Purpose (EN): Premium homepage catalog with search, filters, and product cards.
//
// Назначение (RU): Премиальный каталог на главной с поиском, фильтрами и карточками.
// ==================================================
"use client";

import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import { filterHomeCatalogProducts, getProductCategoryHint } from "@/components/catalog/filterHomeCatalogProducts";
import {
  homeCatalogCategoryChips,
  homeCatalogQuickFilters,
  homeCatalogSearchPlaceholder,
} from "@/components/catalog/homeCatalogConfig";
import styles from "@/components/home/CollectionsSection.module.css";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import { ProductSizeSelector } from "@/components/product/ProductSizeSelector";
import { getProductExperienceData, getProductSizeVariant } from "@/components/product/productExperienceCatalog";
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
  catalogFocusNonce?: number;
  initialCategoryId?: string;
  initialQuickFilterId?: string;
};

export function CollectionsSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleFavoriteTouchEnd,
  handleBouquetOrderClick,
  handleBouquetOrderTouchEnd,
  catalogFocusNonce = 0,
  initialCategoryId = "all",
  initialQuickFilterId = "popular",
}: CollectionsSectionProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [quickFilterId, setQuickFilterId] = useState(initialQuickFilterId);

  useEffect(() => {
    if (!catalogFocusNonce) {
      return;
    }

    searchInputRef.current?.focus({ preventScroll: true });
    document.getElementById("collections")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [catalogFocusNonce]);

  const filteredBouquets = useMemo(
    () =>
      filterHomeCatalogProducts(bouquets, {
        categoryId,
        quickFilterId,
        searchQuery,
      }),
    [bouquets, categoryId, quickFilterId, searchQuery],
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
        <h2>Популярные букеты</h2>
        <p className={styles.headerNote}>
          Выберите букет и оформите заказ за пару минут
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

        <div className={styles.chipRow} role="tablist" aria-label="Категории">
          {homeCatalogCategoryChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={categoryId === chip.id}
              className={`${styles.chip} ${categoryId === chip.id ? styles.chipActive : ""}`}
              onClick={() => setCategoryId(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.filterRow} aria-label="Быстрые фильтры">
          {homeCatalogQuickFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${styles.filterChip} ${quickFilterId === filter.id ? styles.filterChipActive : ""}`}
              onClick={() => setQuickFilterId(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredBouquets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>По вашему запросу букеты не найдены.</p>
          <button
            type="button"
            className={styles.emptyReset}
            onClick={() => {
              setSearchQuery("");
              setCategoryId("all");
              setQuickFilterId("popular");
            }}
          >
            Показать популярные
          </button>
        </div>
      ) : (
        <div className={`bouquet-grid ${styles.grid} bf-reveal-stagger`}>
          {filteredBouquets.map((bouquet) => {
            const isFavorite = favoriteBouquetIds.includes(bouquet.id);
            const badge = catalogProductBadges[bouquet.id];
            const categoryHint = getProductCategoryHint(bouquet);

            return (
              <HomeCatalogCard
                key={bouquet.id}
                bouquet={bouquet}
                formatPrice={formatPrice}
                isFavorite={isFavorite}
                badge={badge}
                categoryHint={categoryHint}
                handleFavoriteClick={handleFavoriteClick}
                handleFavoriteTouchEnd={handleFavoriteTouchEnd}
                handleBouquetOrderClick={handleBouquetOrderClick}
                handleBouquetOrderTouchEnd={handleBouquetOrderTouchEnd}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

type HomeCatalogCardProps = {
  bouquet: CatalogProduct;
  formatPrice: (priceRub: number) => string;
  isFavorite: boolean;
  badge?: string | null;
  categoryHint: string;
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
};

function HomeCatalogCard({
  bouquet,
  formatPrice,
  isFavorite,
  badge = null,
  categoryHint,
  handleFavoriteClick,
  handleFavoriteTouchEnd,
  handleBouquetOrderClick,
  handleBouquetOrderTouchEnd,
}: HomeCatalogCardProps) {
  const experienceData = useMemo(() => getProductExperienceData(bouquet), [bouquet]);
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.defaultSizeId,
  );
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const deliveryHint = experienceData.deliveryNote;

  return (
    <article className={`bouquet-card ${styles.card} bf-reveal-up`} key={bouquet.id}>
      <div className={`bouquet-image ${styles.imageWrap}`}>
        {badge ? <span className={styles.productBadge}>{badge}</span> : null}
        <ProductImageWithFallback
          src={bouquet.src}
          alt={bouquet.alt}
          width={bouquet.width}
          height={bouquet.height}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          imageClassName={styles.productImage}
          fallbackClassName={`${styles.imageFallback}`}
        />
        <button
          type="button"
          className={`bouquet-favorite-button ${isFavorite ? "active" : ""}`}
          onClick={(event) => handleFavoriteClick(event, bouquet.id)}
          onTouchEnd={(event) => handleFavoriteTouchEnd(event, bouquet.id)}
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

      <div className={`bouquet-info ${styles.info}`}>
        <div className={styles.metaRow}>
          <span className={styles.categoryHint}>{categoryHint}</span>
          <span className={styles.deliveryHint}>{deliveryHint}</span>
        </div>
        <h3>{bouquet.title}</h3>
        <p>{bouquet.description}</p>
        <ProductSizeSelector
          layout="compact"
          variants={experienceData.sizeVariants}
          selectedSizeId={selectedSizeId}
          onSelectSize={setSelectedSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L"]}
          ariaLabel={`Размеры для ${bouquet.title}`}
        />
        <button
          type="button"
          className={`buy-button bouquet-order-link ${styles.buyButton}`}
          onClick={(event) =>
            handleBouquetOrderClick(
              event,
              bouquet.id,
              selectedVariant.sizeId,
              selectedVariant.priceRub,
            )
          }
          onTouchEnd={(event) =>
            handleBouquetOrderTouchEnd(
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
    </article>
  );
}
