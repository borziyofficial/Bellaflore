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
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://wa.me/70000000000",
    external: true,
    positionClass: styles.fanWhatsapp,
    brandClass: styles.fanWhatsapp,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.09.61 4.03 1.66 5.66L2 22l4.58-1.76A9.86 9.86 0 0 0 12.04 22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.57 13.93c-.24.67-1.2 1.24-1.96 1.4-.5.11-1.15.2-3.34-.72-2.8-1.22-4.61-4.1-4.75-4.29-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06 1-2.34.24-.24.62-.35.99-.35.12 0 .24 0 .35.01.11.01.26-.04.4.31.15.36.51 1.24.55 1.33.04.09.07.2.01.32-.06.12-.09.2-.18.31-.09.11-.19.24-.27.32-.09.09-.18.19-.08.37.1.18.45.74.96 1.2.66.59 1.22.77 1.4.86.18.09.28.08.38-.05.1-.13.43-.5.54-.67.11-.17.22-.14.37-.09.15.05.96.45 1.12.53.16.08.27.12.31.19.04.07.04.41-.2 1.08Z"
        />
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/",
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
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/",
    external: true,
    positionClass: styles.fanInstagram,
    brandClass: styles.fanInstagram,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Позвонить",
    href: "tel:+70000000000",
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
        className={`${styles.fanRoot} ${fanOpen ? styles.fanOpen : ""} contact-quick-actions`}
        id="contact-quick-actions"
        role="dialog"
        aria-modal="true"
        aria-label="Связь с BellaFlore"
      >
        {FAN_ACTIONS.map((action) => (
          <a
            key={action.id}
            className={`${styles.fanItem} ${action.positionClass} ${action.brandClass} contact-quick-action contact-quick-action-${action.id}`}
            href={action.href}
            {...(action.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            aria-label={action.label}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {action.icon}
          </a>
        ))}
      </div>
    </>
  );
}
