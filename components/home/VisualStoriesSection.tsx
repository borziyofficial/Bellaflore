"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import type { VisualStory } from "@/lib/visualStoriesTypes";
import styles from "@/components/home/VisualStoriesSection.module.css";

type VisualStoriesSectionProps = {
  bouquets: CatalogProduct[];
  onProductOpen?: (productId: string) => void;
  onOpenCatalog?: () => void;
};

const FALLBACK_IDS = [
  "royal-collection",
  "pink-elegance",
  "white-pearl",
  "luxury-box",
  "red-luxury",
] as const;

type StoryView = {
  id: string;
  imageUrl: string;
  eyebrow: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  destinationType: VisualStory["destinationType"];
  destinationValue: string;
};

function buildFallbackStories(bouquets: CatalogProduct[]): StoryView[] {
  const selected: CatalogProduct[] = [];
  const used = new Set<string>();

  for (const id of FALLBACK_IDS) {
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

  return selected.slice(0, 5).map((product) => ({
    id: product.id,
    imageUrl: product.src,
    eyebrow: product.category || "BellaFlore",
    title: product.title,
    alt: product.alt,
    width: product.width,
    height: product.height,
    destinationType: "product",
    destinationValue: product.id,
  }));
}

function mapAdminStory(story: VisualStory): StoryView {
  return {
    id: story.id,
    imageUrl: story.imageUrl,
    eyebrow: story.eyebrow || "BellaFlore",
    title: story.title || "Коллекция BellaFlore",
    alt: story.title || "Коллекция BellaFlore",
    width: 1800,
    height: 2400,
    destinationType: story.destinationType,
    destinationValue: story.destinationValue,
  };
}

export function VisualStoriesSection({
  bouquets,
  onProductOpen,
  onOpenCatalog,
}: VisualStoriesSectionProps) {
  const fallbackStories = useMemo(() => buildFallbackStories(bouquets), [bouquets]);
  const [managedStories, setManagedStories] = useState<VisualStory[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/visual-stories", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          settings?: { stories?: VisualStory[] };
        };
      })
      .then((body) => {
        const stories = body?.settings?.stories;
        if (Array.isArray(stories)) {
          setManagedStories(
            stories
              .filter((story) => story.isEnabled && story.imageUrl)
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .slice(0, 6),
          );
        }
      })
      .catch(() => {
        // The static catalog-based fallback remains visible if admin settings
        // are temporarily unavailable.
      });

    return () => controller.abort();
  }, []);

  const stories =
    managedStories && managedStories.length > 0
      ? managedStories.map(mapAdminStory)
      : fallbackStories;

  if (stories.length === 0) {
    return null;
  }

  const storyClassNames = [
    styles.heroStory,
    styles.tallStory,
    styles.tallStory,
    styles.wideStory,
    styles.wideStory,
    styles.finalStory,
  ];

  const openStory = (story: StoryView) => {
    if (story.destinationType === "product" && story.destinationValue) {
      onProductOpen?.(story.destinationValue);
      return;
    }

    if (story.destinationType === "catalog") {
      onOpenCatalog?.();
      return;
    }

    if (story.destinationType === "category" && story.destinationValue) {
      window.location.assign(
        `/?category=${encodeURIComponent(story.destinationValue)}#catalog`,
      );
      return;
    }

    if (story.destinationType === "url" && story.destinationValue) {
      window.location.assign(story.destinationValue);
      return;
    }

    onOpenCatalog?.();
  };

  return (
    <section className={styles.section} aria-label="Коллекции BellaFlore">
      <div className={styles.intro}>
        <span>Коллекции BellaFlore</span>
        <h2>Коллекции, которые хочется рассматривать</h2>
        <p>
          Авторские композиции BellaFlore для признаний, праздников и красивых
          моментов без повода.
        </p>
      </div>

      <div className={styles.grid}>
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            className={`${styles.story} ${storyClassNames[index] ?? styles.wideStory}`}
            onClick={() => openStory(story)}
            aria-label={`Открыть ${story.title}`}
          >
            <span className={styles.imageWrap}>
              <ProductImageWithFallback
                src={story.imageUrl}
                alt={story.alt}
                width={story.width}
                height={story.height}
                sizes={index === 0 ? "100vw" : "(max-width: 780px) 100vw, 50vw"}
                imageClassName={styles.image}
                fallbackClassName={styles.fallback}
              />
            </span>

            <span className={styles.shade} aria-hidden="true" />

            <span className={styles.caption}>
              <small>{story.eyebrow}</small>
              <strong>{story.title}</strong>
              <span className={styles.captionLink}>Смотреть</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.catalogRow}>
        <button type="button" className={styles.catalogLink} onClick={onOpenCatalog}>
          Смотреть весь каталог
        </button>
      </div>
    </section>
  );
}
