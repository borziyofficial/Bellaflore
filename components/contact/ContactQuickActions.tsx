// ==================================================
// SECTION: CONTACT HUB
// РАЗДЕЛ: Fan popup (bottom nav «Связь»)
// ==================================================
"use client";

import { type ReactNode, useEffect, useState } from "react";
import styles from "@/components/contact/ContactQuickActions.module.css";

type ContactQuickActionsProps = {
  closeContactHub: () => void;
};

type FanAction = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  positionClass: string;
  brandClass: string;
  icon: ReactNode;
};

const FAN_ACTIONS: FanAction[] = [
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/BellaFlore_bot",
    external: true,
    positionClass: styles.fanTelegram,
    brandClass: styles.fanTelegram,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.5 4.7 4 11.2l6.3 2.3 2.4 6.1 2.9-4.2 4.9-10.7Z"
        />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Позвонить",
    href: "tel:+79912700720",
    positionClass: styles.fanPhone,
    brandClass: styles.fanPhone,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7.2 5.2 9.3 4c.6-.3 1.3-.1 1.6.5l1.2 2.5c.2.5.1 1-.3 1.4l-1.1 1.1a9.8 9.8 0 0 0 3.8 3.8l1.1-1.1c.4-.4.9-.5 1.4-.3l2.5 1.2c.6.3.8 1 .5 1.6l-1.2 2.1c-.4.7-1.2 1.1-2 1A14.7 14.7 0 0 1 6.2 6.3c-.1-.8.3-1.6 1-2Z"
        />
      </svg>
    ),
  },
];

export function ContactQuickActions({
  closeContactHub,
}: ContactQuickActionsProps) {
  const [fanOpen, setFanOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFanOpen(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        className={`${styles.overlay} contact-quick-actions-overlay`}
        onClick={closeContactHub}
        aria-hidden="true"
      />
      <div
        className={`${styles.fanRoot} ${fanOpen ? styles.fanOpen : ""}`}
        id="contact-quick-actions"
        role="dialog"
        aria-modal="true"
        aria-label="Связь с BellaFlore"
      >
        {FAN_ACTIONS.map((action) => (
          <a
            key={action.id}
            className={`${styles.fanItem} ${action.positionClass} ${action.brandClass}`}
            href={action.href}
            {...(action.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            aria-label={action.label}
            onClick={(event) => {
              event.stopPropagation();
              closeContactHub();
            }}
          >
            {action.icon}
          </a>
        ))}
      </div>
    </>
  );
}
