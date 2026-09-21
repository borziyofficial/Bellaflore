// ==================================================
// SECTION: CONTACT HUB
// РАЗДЕЛ: Premium contact panel (bottom nav «Связь»)
// ==================================================
"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "@/components/contact/ContactQuickActions.module.css";

type ContactQuickActionsProps = {
  closeContactHub: () => void;
};

type ContactAction = {
  id: string;
  label: string;
  meta: string;
  href: string;
  external?: boolean;
  icon: ReactNode;
};

const CONTACT_ACTIONS: ContactAction[] = [
  {
    id: "telegram",
    label: "Telegram",
    meta: "@BellaFlore_bot",
    href: "https://t.me/BellaFlore_bot",
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.5 4.5 3.6 11.2c-.7.28-.7.75-.02.96l4.3 1.34 1.66 5.1c.2.5.36.7.72.7.28 0 .4-.13.56-.28l1.98-1.9 4.12 3.04c.76.42 1.3.2 1.5-.7l2.72-12.8c.28-1.1-.42-1.6-1.64-1.16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.7 14.4 17.3 8l-9 5.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Позвонить",
    meta: "+7 (991) 270-07-20",
    href: "tel:+79912700720",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.2 5.2 9.3 4c.6-.3 1.3-.1 1.6.5l1.2 2.5c.2.5.1 1-.3 1.4l-1.1 1.1a9.8 9.8 0 0 0 3.8 3.8l1.1-1.1c.4-.4.9-.5 1.4-.3l2.5 1.2c.6.3.8 1 .5 1.6l-1.2 2.1c-.4.7-1.2 1.1-2 1A14.7 14.7 0 0 1 6.2 6.3c-.1-.8.3-1.6 1-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function ContactQuickActions({
  closeContactHub,
}: ContactQuickActionsProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeContactHub();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeContactHub]);

  // Belt-and-suspenders outside-tap close: the backdrop div below already
  // covers the page content area, but it intentionally stops above the
  // bottom nav strip so the "Связь" trigger button stays tappable (a
  // second tap on it must close the panel, not be swallowed by the
  // backdrop). The fixed top navbar also paints in its own stacking
  // context above the backdrop. This listener catches taps that land on
  // either of those — anywhere that isn't the panel itself or the
  // trigger button — so "tap outside closes it" holds everywhere.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (panelRef.current?.contains(target)) return;

      const trigger = document.querySelector('button[aria-label="Связь"]');
      if (trigger && trigger.contains(target)) return;

      closeContactHub();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, [closeContactHub]);

  return (
    <>
      <div
        className={`${styles.overlay} contact-quick-actions-overlay`}
        onClick={closeContactHub}
        onTouchEnd={(event) => {
          event.preventDefault();
          closeContactHub();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={styles.panel}
        id="contact-quick-actions"
        role="dialog"
        aria-modal="true"
        aria-label="Связь с BellaFlore"
        onClick={(event) => event.stopPropagation()}
      >
        <span className={styles.eyebrow}>Связь с BellaFlore</span>

        <div className={styles.list}>
          {CONTACT_ACTIONS.map((action) => (
            <a
              key={action.id}
              className={styles.row}
              href={action.href}
              {...(action.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              onClick={(event) => {
                event.stopPropagation();
                closeContactHub();
              }}
            >
              <span className={styles.rowIcon} aria-hidden="true">
                {action.icon}
              </span>
              <span className={styles.rowText}>
                <strong>{action.label}</strong>
                <small>{action.meta}</small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
