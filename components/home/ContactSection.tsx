// ==================================================
// SECTION: CONTACTS
// РАЗДЕЛ: Контакты
// ==================================================
import styles from "@/components/home/ContactSection.module.css";

export function ContactSection() {
  return (
    <section id="contact" className={`contact ${styles.section}`}>
      <h2 className={styles.heading}>Связь с BellaFlore</h2>
      <div className={styles.grid}>
        <a
          className={`${styles.item} ${styles.telegram}`}
          href="https://t.me/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20.5 4.7 4 11.2l6.3 2.3 2.4 6.1 2.9-4.2 4.9-10.7Z" />
            </svg>
          </span>
          <span className={styles.label}>Telegram</span>
        </a>
        <a
          className={`${styles.item} ${styles.instagram}`}
          href="https://instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" rx="4" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
          </span>
          <span className={styles.label}>Instagram</span>
        </a>
        <a
          className={`${styles.item} ${styles.whatsapp}`}
          href="https://wa.me/70000000000"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5.6 18.6 6.8 15A7.2 7.2 0 1 1 9 17.2l-3.4 1.4Z" />
            </svg>
          </span>
          <span className={styles.label}>WhatsApp</span>
        </a>
        <a className={`${styles.item} ${styles.phone}`} href="tel:+70000000000">
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7.2 5.2 9.3 4c.6-.3 1.3-.1 1.6.5l1.2 2.5c.2.5.1 1-.3 1.4l-1.1 1.1a9.8 9.8 0 0 0 3.8 3.8l1.1-1.1c.4-.4.9-.5 1.4-.3l2.5 1.2c.6.3.8 1 .5 1.6l-1.2 2.1c-.4.7-1.2 1.1-2 1A14.7 14.7 0 0 1 6.2 6.3c-.1-.8.3-1.6 1-2Z" />
            </svg>
          </span>
          <span className={styles.label}>Позвонить</span>
        </a>
      </div>
    </section>
  );
}
