"use client";

import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/VisualStoriesSection.module.css";

type VisualStoriesSectionProps = {
  bouquets: CatalogProduct[];
  onProductOpen?: (productId: string) => void;
  onOpenCatalog?: () => void;
};

const STORY_IDS = [
  "royal-collection",
  "pink-elegance",
  "white-pearl",
  "luxury-box",
  "red-luxury",
] as const;

function selectStories(bouquets: CatalogProduct[]): CatalogProduct[] {
  const selected: CatalogProduct[] = [];
  const used = new Set<string>();

  for (const id of STORY_IDS) {
    const product = bouquets.find((item) => item.id === id);
    if (product && !used.has(product.id)) {
      selected.push(product);
      used.add(product.id);
    }
  }

  for (const product of bouquets) {
    if (selected.length >= 5) break;
    if (!used.has(product.id)) {
      selected.push(product);
      used.add(product.id);
    }
  }

  return selected.slice(0, 5);
}

export function VisualStoriesSection({
  bouquets,
  onProductOpen,
  onOpenCatalog,
}: VisualStoriesSectionProps) {
  const stories = selectStories(bouquets);

  if (stories.length === 0) {
    return null;
  }

  const storyClassNames = [
    styles.heroStory,
    styles.tallStory,
    styles.tallStory,
    styles.wideStory,
    styles.wideStory,
  ];

  return (
    <section className={styles.section} aria-label="Коллекции BellaFlore">
      <div className={styles.intro}>
        <span>Коллекции BellaFlore</span>
        <h2>Цветы крупным планом</h2>
        <p>
          Без лишних карточек и цен на первом взгляде — только композиция,
          настроение и живой масштаб.
        </p>
      </div>

      <div className={styles.grid}>
        {stories.map((product, index) => (
          <button
            key={product.id}
            type="button"
            className={`${styles.story} ${storyClassNames[index] ?? styles.wideStory}`}
            onClick={() => onProductOpen?.(product.id)}
            aria-label={`Открыть ${product.title}`}
          >
            <span className={styles.imageWrap}>
              <ProductImageWithFallback
                src={product.src}
                alt={product.alt}
                width={product.width}
                height={product.height}
                sizes={index === 0 ? "100vw" : "(max-width: 780px) 100vw, 50vw"}
                imageClassName={styles.image}
                fallbackClassName={styles.fallback}
              />
            </span>

            <span className={styles.shade} aria-hidden="true" />

            <span className={styles.caption}>
              <small>{product.category || "Коллекция"}</small>
              <strong>{product.title}</strong>
              <span className={styles.captionLink}>
                Смотреть
                <b aria-hidden="true">↗</b>
              </span>
            </span>
          </button>
        ))}
      </div>

      <button type="button" className={styles.catalogLink} onClick={onOpenCatalog}>
        Смотреть весь каталог
        <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
