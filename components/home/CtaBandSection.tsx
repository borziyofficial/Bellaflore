// ==================================================
// SECTION: CTA BAND
// РАЗДЕЛ: Финальный призыв к действию перед Footer (управляется из Admin)
// ==================================================
"use client";

import type { HomepageBlock } from "@/lib/homepageBlocksTypes";
import styles from "@/components/home/CtaBandSection.module.css";

type CtaBandSectionProps = {
  block: HomepageBlock | undefined | null;
  onOrderBouquet: () => void;
};

function isCatalogLink(link: string): boolean {
  const normalized = link.trim().toLowerCase().replace(/\/+$/, "");
  return !normalized || ["#catalog", "/#catalog", "/catalog"].includes(normalized);
}

export function CtaBandSection({ block, onOrderBouquet }: CtaBandSectionProps) {
  if (!block || !block.isEnabled) {
    return null;
  }

  const title = block.title?.trim();
  const subtitle = block.subtitle?.trim();
  const buttonText = block.buttonText?.trim() || "Выбрать букет";
  const buttonLink = block.buttonLink?.trim() || "";

  if (!title && !subtitle) {
    return null;
  }

  const action = isCatalogLink(buttonLink) ? (
    <button type="button" className={styles.action} onClick={onOrderBouquet}>
      {buttonText}
      <span aria-hidden="true">→</span>
    </button>
  ) : (
    <a href={buttonLink} className={styles.action}>
      {buttonText}
      <span aria-hidden="true">→</span>
    </a>
  );

  return (
    <section className={styles.section} aria-label={title || "Призыв к действию"}>
      <div className={`bf-reveal bf-reveal-up ${styles.shell}`}>
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p>{subtitle}</p> : null}
        {action}
      </div>
    </section>
  );
}
