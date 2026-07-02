// ==================================================
// SECTION: Admin Shell — module card
// РАЗДЕЛ: Карточка раздела модуля
// ==================================================
"use client";

import Link from "next/link";
import type { AdminModuleSection } from "@/components/adminShell/adminModuleTypes";
import styles from "@/components/adminShell/AdminModuleCard.module.css";

type AdminModuleCardProps = {
  section: AdminModuleSection;
};

export function AdminModuleCard({ section }: AdminModuleCardProps) {
  const statusClassName = section.disabled
    ? `${styles.status} ${styles.statusMuted}`
    : styles.status;

  const content = (
    <>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>{section.title}</h3>
        {section.statusLabel ? (
          <span className={statusClassName}>{section.statusLabel}</span>
        ) : null}
      </div>
      <p className={styles.description}>{section.description}</p>
      {section.href && !section.disabled ? (
        <p className={styles.footer}>Открыть раздел →</p>
      ) : null}
    </>
  );

  if (section.href && !section.disabled) {
    return (
      <Link href={section.href} className={`${styles.card} ${styles.cardInteractive}`}>
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`${styles.card} ${section.disabled ? styles.cardDisabled : ""}`}
      aria-disabled={section.disabled ? true : undefined}
    >
      {content}
    </article>
  );
}
