// ==================================================
// SECTION: FEATURED
// РАЗДЕЛ: Подборка недели (управляется из Admin)
// ==================================================
"use client";

import Image from "next/image";
import { getEnabledCards } from "@/components/home/useHomepageBlocks";
import type { HomepageBlock } from "@/lib/homepageBlocksTypes";
import styles from "@/components/home/FeaturedSection.module.css";

type FeaturedSectionProps = {
  block: HomepageBlock | undefined | null;
};

export function FeaturedSection({ block }: FeaturedSectionProps) {
  if (!block || !block.isEnabled) {
    return null;
  }

  const cards = getEnabledCards(block);
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label={block.title || "Подборка"}>
      <div className={`bf-reveal bf-reveal-up ${styles.intro}`}>
        {block.title ? <h2>{block.title}</h2> : null}
        {block.subtitle ? <p>{block.subtitle}</p> : null}
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
