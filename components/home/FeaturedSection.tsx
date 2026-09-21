// ==================================================
// SECTION: FEATURED
// РАЗДЕЛ: Подборка недели (управляется из Admin)
// ==================================================
"use client";

import Image from "next/image";
import { getEnabledCards } from "@/components/home/useHomepageBlocks";
import type { HomepageBlock } from "@/lib/homepageBlocksTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/FeaturedSection.module.css";

type FeaturedSectionProps = {
  block: HomepageBlock | undefined | null;
  products?: CatalogProduct[];
};

type FeaturedCard = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
};

function getProductFeaturedCards(products: CatalogProduct[]): FeaturedCard[] {
  return products
    .filter((product) => Boolean(product.src && product.title))
    .slice(0, 3)
    .map((product) => ({
      id: product.id,
      imageUrl: product.src,
      title: product.title,
      subtitle: product.description || product.category || "Авторская композиция",
      buttonText: "Открыть",
      buttonLink: `/?product=${encodeURIComponent(product.id)}#catalog`,
    }));
}

export function FeaturedSection({ block, products = [] }: FeaturedSectionProps) {
  const productCards = getProductFeaturedCards(products);

  if (productCards.length === 0 && (!block || !block.isEnabled)) {
    return null;
  }

  const cards = productCards.length > 0 ? productCards : getEnabledCards(block);
  if (cards.length === 0) {
    return null;
  }

  const title = block?.isEnabled && block.title ? block.title : "Подборка недели";
  const subtitle =
    block?.isEnabled && block.subtitle
      ? block.subtitle
      : "Реальные композиции BellaFlore, которые чаще всего выбирают сейчас.";

  return (
    <section className={styles.section} aria-label={title || "Подборка"}>
      <div className={`bf-reveal bf-reveal-up ${styles.intro}`}>
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className={`bf-reveal-stagger ${styles.row}`}>
        {cards.map((card) => {
          const content = (
            <>
              <span className={styles.imageWrap}>
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.title || ""}
                    fill
                    sizes="(max-width: 780px) 78vw, 30vw"
                    className={styles.image}
                  />
                ) : (
                  <span className={styles.placeholder} aria-hidden="true">
                    <span className={styles.placeholderGlyph}>✿</span>
                  </span>
                )}
              </span>
              <span className={styles.caption}>
                {card.title ? <strong>{card.title}</strong> : null}
                {card.subtitle ? <span>{card.subtitle}</span> : null}
                {card.buttonText ? (
                  <span className={styles.cardLink} aria-hidden="true">
                    {card.buttonText} →
                  </span>
                ) : null}
              </span>
            </>
          );

          return card.buttonLink ? (
            <a
              key={card.id}
              href={card.buttonLink}
              className={`bf-reveal-up ${styles.card}`}
            >
              {content}
            </a>
          ) : (
            <div key={card.id} className={`bf-reveal-up ${styles.card}`}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
