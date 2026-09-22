// ==================================================
// SECTION: SEASONAL / OCCASION
// РАЗДЕЛ: Готовые решения под повод (управляется из Admin)
// ==================================================
"use client";

import Image from "next/image";
import { getEnabledCards } from "@/components/home/useHomepageBlocks";
import type { HomepageBlock, HomepageBlockCard } from "@/lib/homepageBlocksTypes";
import styles from "@/components/home/SeasonalSection.module.css";

type SeasonalSectionProps = {
  block: HomepageBlock | undefined | null;
};

// Real BellaFlore catalog photos used whenever an occasion card has no
// admin-set image yet — replaces the empty "✿" placeholder circles with an
// actual, thematically matching bouquet photo. An admin-uploaded imageUrl
// (set from the Admin panel) always takes priority over this fallback.
const OCCASION_FALLBACK_IMAGES: Record<string, string> = {
  "день рождения": "/roza rouze royal.PNG", // bright, festive red roses
  "свадьба": "/white rose 101.PNG", // light, tender white roses
  "годовщина": "/0002.jpg", // romantic pink composition
};
const GENERIC_FALLBACK_IMAGE = "/0002.jpg";

function resolveCardImage(card: HomepageBlockCard): string {
  if (card.imageUrl) {
    return card.imageUrl;
  }
  const key = card.title.trim().toLowerCase();
  return OCCASION_FALLBACK_IMAGES[key] ?? GENERIC_FALLBACK_IMAGE;
}

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
                <Image
                  src={resolveCardImage(card)}
                  alt={card.title || ""}
                  fill
                  sizes="(max-width: 780px) 46vw, 22vw"
                  className={styles.image}
                />
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
