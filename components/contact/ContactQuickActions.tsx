// ==================================================
// SECTION: CONTACT HUB
// РАЗДЕЛ: Быстрая связь (mobile floating)
// ==================================================
"use client";

import styles from "@/components/contact/ContactQuickActions.module.css";

type ContactQuickActionsProps = {
  closeContactHub: () => void;
};

export function ContactQuickActions({
  closeContactHub,
}: ContactQuickActionsProps) {
  return (
    <>
      <div
        className={`${styles.overlay} contact-quick-actions-overlay`}
        onClick={closeContactHub}
        aria-hidden="true"
      />
      <div
        className={`${styles.panel} contact-quick-actions`}
        id="contact-quick-actions"
        aria-label="Быстрые способы связи"
      >
        <div className={styles.grid}>
          <a
            className={`${styles.action} contact-quick-action contact-quick-action-telegram`}
            href="https://t.me/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          >
            <span
              className={`${styles.icon} contact-quick-action-icon`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M20.5 4.7 4 11.2l6.3 2.3 2.4 6.1 2.9-4.2 4.9-10.7Z" />
              </svg>
            </span>
            <span className={`${styles.label} contact-quick-action-label`}>
              Telegram
            </span>
          </a>
          <a
            className={`${styles.action} contact-quick-action contact-quick-action-instagram`}
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <span
              className={`${styles.icon} contact-quick-action-icon`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="4" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
            </span>
            <span className={`${styles.label} contact-quick-action-label`}>
              Instagram
            </span>
          </a>
          <a
            className={`${styles.action} contact-quick-action contact-quick-action-whatsapp`}
            href="https://wa.me/70000000000"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <span
              className={`${styles.icon} contact-quick-action-icon`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5.6 18.6 6.8 15A7.2 7.2 0 1 1 9 17.2l-3.4 1.4Z" />
              </svg>
            </span>
            <span className={`${styles.label} contact-quick-action-label`}>
              WhatsApp
            </span>
          </a>
          <a
            className={`${styles.action} contact-quick-action contact-quick-action-phone`}
            href="tel:+70000000000"
            aria-label="Позвонить"
          >
            <span
              className={`${styles.icon} contact-quick-action-icon`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7.2 5.2 9.3 4c.6-.3 1.3-.1 1.6.5l1.2 2.5c.2.5.1 1-.3 1.4l-1.1 1.1a9.8 9.8 0 0 0 3.8 3.8l1.1-1.1c.4-.4.9-.5 1.4-.3l2.5 1.2c.6.3.8 1 .5 1.6l-1.2 2.1c-.4.7-1.2 1.1-2 1A14.7 14.7 0 0 1 6.2 6.3c-.1-.8.3-1.6 1-2Z" />
              </svg>
            </span>
            <span className={`${styles.label} contact-quick-action-label`}>
              Позвонить
            </span>
          </a>
        </div>
      </div>
    </>
  );
}
