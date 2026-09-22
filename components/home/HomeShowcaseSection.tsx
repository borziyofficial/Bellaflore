// ==================================================
// SECTION: HOME SHOWCASE
// РАЗДЕЛ: Premium commerce-подборка на месте бывшего "Выберите настроение"
// ==================================================
"use client";

import { LuxuryCatalogProductCard } from "@/components/catalog/LuxuryCatalogProductCard";
import styles from "@/components/home/HomeShowcaseSection.module.css";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import { useMemo, type MouseEvent as ReactMouseEvent } from "react";

const MAX_SHOWCASE_PRODUCTS = 6;
const MIN_SHOWCASE_PRODUCTS = 4;
// Skip the first few real products, which FeaturedSection ("Подборка
// недели") already shows just above this section on the homepage — avoids
// showing the same bouquets twice in a row.
const SHOWCASE_START_INDEX = 3;

type HomeShowcaseSectionProps = {
  bouquets: CatalogProduct[];
  favoriteBouquetIds: string[];
  formatPrice: (priceRub: number) => string;
  handleFavoriteClick: (event: ReactMouseEvent<HTMLButtonElement>, bouquetId: string) => void;
  handleBouquetOrderClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onProductOpen?: (productId: string) => void;
};

// Replaces the old "Выберите настроение" mood-picker teaser (chips + a
// "Смотреть весь каталог" button, no products) with a compact, real-product
// commerce strip: 4-6 actual BellaFlore bouquets with photo, name, price and
// a direct "Купить" action — using the same catalog card used in the real
// catalog, so behavior (favorite, buy, open) stays fully consistent.
export function HomeShowcaseSection({
  bouquets,
  favoriteBouquetIds,
  formatPrice,
  handleFavoriteClick,
  handleBouquetOrderClick,
  onProductOpen,
}: HomeShowcaseSectionProps) {
  const showcaseProducts = useMemo(() => {
    const eligible = bouquets.filter((product) => Boolean(product.src && product.title));
    const rest = eligible.slice(SHOWCASE_START_INDEX);
    const pool = rest.length >= MIN_SHOWCASE_PRODUCTS ? rest : eligible;
    return pool.slice(0, MAX_SHOWCASE_PRODUCTS);
  }, [bouquets]);

  if (showcaseProducts.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Актуальные композиции BellaFlore">
      <header className={`${styles.header} bf-reveal bf-reveal-up`}>
        <span className={styles.eyebrow}>Рекомендуем сейчас</span>
        <h2>Цветы, которые выбирают сегодня</h2>
      </header>

      <div className={`bf-reveal-stagger ${styles.grid}`}>
        {showcaseProducts.map((product) => (
          <LuxuryCatalogProductCard
            key={product.id}
            product={product}
            formatPrice={formatPrice}
            isFavorite={favoriteBouquetIds.includes(product.id)}
            onFavoriteClick={handleFavoriteClick}
            onBuyClick={handleBouquetOrderClick}
            onProductOpen={onProductOpen}
          />
        ))}
      </div>
    </section>
  );
}
