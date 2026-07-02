// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Аккордеон оформления заказа
//
// Purpose (EN):
// Collapsible accordion panels for compact checkout layout.
//
// Назначение (RU):
// Сворачиваемые панели для компактного checkout.
// ==================================================
"use client";

import type { ReactNode } from "react";
import styles from "@/components/checkout/CheckoutAccordion.module.css";

export type CheckoutAccordionPanelId =
  | "recipient"
  | "delivery"
  | "address"
  | "map"
  | "payment"
  | "comment"
  | "summary";

type CheckoutAccordionProps = {
  children: ReactNode;
};

type CheckoutAccordionPanelProps = {
  id: CheckoutAccordionPanelId;
  title: string;
  summary?: string | null;
  openPanels: Set<CheckoutAccordionPanelId>;
  onTogglePanel: (panelId: CheckoutAccordionPanelId) => void;
  overflowVisible?: boolean;
  children: ReactNode;
};

export function CheckoutAccordion({ children }: CheckoutAccordionProps) {
  return <div className={styles.checkoutAccordion}>{children}</div>;
}

export function CheckoutAccordionPanel({
  id,
  title,
  summary,
  openPanels,
  onTogglePanel,
  overflowVisible = false,
  children,
}: CheckoutAccordionPanelProps) {
  const isOpen = openPanels.has(id);
  const panelId = `checkout-accordion-panel-${id}`;
  const triggerId = `checkout-accordion-trigger-${id}`;

  return (
    <section
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ""} ${
        isOpen && overflowVisible ? styles.panelOverflowVisible : ""
      }`}
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
          {summary ? (
            <span className={styles.summary}>{summary}</span>
          ) : null}
        </span>
        <span className={styles.toggleIcon} aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <div
        id={panelId}
        className={styles.body}
        role="region"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div
          className={`${styles.bodyInner} ${
            isOpen ? "" : styles.bodyInnerCollapsed
          } ${isOpen && overflowVisible ? styles.bodyInnerVisible : ""}`}
        >
          <div className={styles.content}>
            <div className={styles.contentGrid}>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
