// ==================================================
// SECTION: UI
// РАЗДЕЛ: Bellaflore Accordion
//
// Purpose (EN): Shared accordion pattern (checkout-style) for product and content.
//
// Назначение (RU): Общий аккордеон в стиле Bellaflore.
// ==================================================
"use client";

import type { ReactNode } from "react";
import styles from "@/components/ui/BellafloreAccordion.module.css";

export type BellafloreAccordionPanelId = string;

type BellafloreAccordionProps = {
  children: ReactNode;
};

type BellafloreAccordionPanelProps = {
  id: BellafloreAccordionPanelId;
  title: string;
  summary?: string | null;
  openPanels: Set<BellafloreAccordionPanelId>;
  onTogglePanel: (panelId: BellafloreAccordionPanelId) => void;
  children: ReactNode;
};

export function BellafloreAccordion({ children }: BellafloreAccordionProps) {
  return <div className={styles.accordion}>{children}</div>;
}

export function BellafloreAccordionPanel({
  id,
  title,
  summary,
  openPanels,
  onTogglePanel,
  children,
}: BellafloreAccordionPanelProps) {
  const isOpen = openPanels.has(id);
  const panelId = `bellaflore-accordion-panel-${id}`;
  const triggerId = `bellaflore-accordion-trigger-${id}`;

  return (
    <section
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
      aria-labelledby={triggerId}
    >
      <button
        type="button"
        id={triggerId}
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onTogglePanel(id)}
      >
        <span className={styles.triggerCopy}>
          <span className={styles.title}>{title}</span>
          {summary ? <span className={styles.summary}>{summary}</span> : null}
        </span>
        <span className={styles.toggleIcon} aria-hidden="true">
          {isOpen ? "×" : "+"}
        </span>
      </button>

      <div id={panelId} className={styles.body}>
        <div className={styles.bodyInner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </section>
  );
}
