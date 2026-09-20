"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/EditorialShowcase.module.css";

type EditorialShowcaseProps = {
  bouquets: CatalogProduct[];
  formatPrice: (priceRub: number) => string;
  onProductOpen?: (productId: string) => void;
  onOpenCatalog?: () => void;
};

const FEATURED_IDS = [
  "red-luxury",
  "royal-collection",
  "luxury-box",
  "white-pearl",
  "pink-elegance",
] as const;

const AUTOPLAY_MS = 4800;

function buildFeaturedProducts(bouquets: CatalogProduct[]): CatalogProduct[] {
  const picked: CatalogProduct[] = [];
  const used = new Set<string>();

  for (const id of FEATURED_IDS) {
    const product = bouquets.find((item) => item.id === id);
    if (product && !used.has(product.id)) {
      picked.push(product);
      used.add(product.id);
    }
  }

  const ranked = [...bouquets].sort((left, right) => {
    const leftScore =
      (left.isPopular ? 4 : 0) +
      (left.isNew ? 3 : 0) +
      (left.badge ? 2 : 0) +
      (left.galleryImages?.length ? 1 : 0);
    const rightScore =
      (right.isPopular ? 4 : 0) +
      (right.isNew ? 3 : 0) +
      (right.badge ? 2 : 0) +
      (right.galleryImages?.length ? 1 : 0);
    return rightScore - leftScore;
  });

  for (const product of ranked) {
    if (picked.length >= 5) break;
    if (!used.has(product.id)) {
      picked.push(product);
      used.add(product.id);
    }
  }

  return picked.slice(0, 5);
}

export function EditorialShowcase({
  bouquets,
  formatPrice,
  onProductOpen,
  onOpenCatalog,
}: EditorialShowcaseProps) {
  const featured = useMemo(() => buildFeaturedProducts(bouquets), [bouquets]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (activeIndex >= featured.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, featured.length]);

  useEffect(() => {
    if (paused || featured.length < 2) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featured.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [featured.length, paused]);

  if (featured.length === 0) {
    return null;
  }

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + featured.length) % featured.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % featured.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    setPaused(true);
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    window.setTimeout(() => setPaused(false), 1200);

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) {
      return;
    }

    if (deltaX < 0) {
      showNext();
    } else {
      showPrevious();
    }
  };

  return (
    <section className={styles.section} aria-labelledby="editorial-showcase-title">
      <div className={styles.heading}>
        <span>Витрина BellaFlore</span>
        <h2 id="editorial-showcase-title">Композиции крупным планом</h2>
        <p>
          Пять акцентных историй из реального каталога. Нажмите на композицию,
          чтобы рассмотреть её ближе.
        </p>
      </div>

      <div
        className={styles.viewport}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartRef.current = null;
          window.setTimeout(() => setPaused(false), 1200);
        }}
      >
        <div
          className={styles.track}
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {featured.map((product, index) => (
            <article className={styles.slide} key={product.id} aria-hidden={index !== activeIndex}>
              <div className={styles.imageStage}>
                <ProductImageWithFallback
                  src={product.src}
                  alt={product.alt}
                  width={product.width}
                  height={product.height}
                  sizes="100vw"
                  imageClassName={styles.image}
                  fallbackClassName={styles.fallback}
                />
                <div className={styles.imageShade} aria-hidden="true" />
              </div>

              <div className={styles.copy}>
                <span className={styles.kicker}>
                  {product.badge || product.category || "BellaFlore selection"}
                </span>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <div className={styles.meta}>
                  <strong>от {formatPrice(product.priceRub)}</strong>
                  <span>{String(index + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")}</span>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.productAction}
                    onClick={() => onProductOpen?.(product.id)}
                  >
                    Смотреть композицию
                    <span aria-hidden="true">↗</span>
                  </button>
                  <button
                    type="button"
                    className={styles.catalogAction}
                    onClick={onOpenCatalog}
                  >
                    Весь каталог
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {featured.length > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={showPrevious}
              aria-label="Предыдущая композиция"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={showNext}
              aria-label="Следующая композиция"
            >
              ›
            </button>

            <div className={styles.dots} aria-label="Композиции">
              {featured.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Показать композицию ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
