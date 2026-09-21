// ==================================================
// SECTION: SEASONAL / OCCASION
// РАЗДЕЛ: Готовые решения под повод (управляется из Admin)
// ==================================================
"use client";

import Image from "next/image";
import { getEnabledCards } from "@/components/home/useHomepageBlocks";
import type { HomepageBlock } from "@/lib/homepageBlocksTypes";
import styles from "@/components/home/SeasonalSection.module.css";

type SeasonalSectionProps = {
  block: HomepageBlock | undefined | null;
};

export function SeasonalSection({ block }: SeasonalSectionProps) {
  if (!block || !block.isEnabled) {
    return null;
  }

  const cards = getEnabledCards(block);
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label={block.title || "Повод"}>
      <div className={`bf-reveal bf-reveal-up ${styles.intro}`}>
        {block.title ? <h2>{block.title}</h2> : null}
        {block.subtitle ? <p>{block.subtitle}</p> : null}
      </div>

      <div className={`bf-reveal-stagger ${styles.grid}`}>
        {cards.map((card) => {
          const content = (
            <>
              <span className={styles.imageWrap}>
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.title || ""}
                    fill
                    sizes="(max-width: 780px) 46vw, 22vw"
                    className={styles.image}
                  />
                ) : (
                  <span className={styles.placeholder} aria-hidden="true">
                    <span className={styles.placeholderGlyph}>✿</span>
                  </span>
                )}
                <span className={styles.shade} aria-hidden="true" />
                {card.title ? <span className={styles.chipTitle}>{card.title}</span> : null}
              </span>
              {card.subtitle ? <span className={styles.chipSubtitle}>{card.subtitle}</span> : null}
            </>
          );

          return card.buttonLink ? (
            <a key={card.id} href={card.buttonLink} className={`bf-reveal-up ${styles.chip}`}>
              {content}
            </a>
          ) : (
            <div key={card.id} className={`bf-reveal-up ${styles.chip}`}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
