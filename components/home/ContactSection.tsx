import Link from "next/link";
// ==================================================
// SECTION: CONTACTS
// РАЗДЕЛ: Контакты
// ==================================================
import styles from "@/components/home/ContactSection.module.css";

export function ContactSection() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.topLine} aria-hidden="true">
        <span />
        <b>✦</b>
        <span />
      </div>

      <div className={styles.shell}>
        <div className={styles.brandColumn}>
          <a className={styles.brand} href="#home" aria-label="BellaFlore — на главную">
            BellaFlore
          </a>
          <p>
            Авторская флористика для признаний, благодарности и самых важных
            моментов.
          </p>
          <div className={styles.socials} aria-label="Связь с BellaFlore">
            <a
              href="https://t.me/BellaFlore_bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              TG <span>Telegram</span>
            </a>
          </div>
        </div>

        <nav className={styles.linksColumn} aria-label="Полезные ссылки">
          <h2>Полезные ссылки</h2>
          <a href="#catalog">Каталог букетов</a>
          <a href="#about">О BellaFlore</a>
          <a href="#reviews">Отзывы клиентов</a>
          <a href="#delivery">Доставка и оплата</a>
          <Link href="/offer">Условия заказа</Link>
          <Link href="/privacy">Конфиденциальность</Link>
        </nav>

        <div className={styles.contactColumn}>
          <h2>Связаться с нами</h2>
          <a className={styles.phone} href="tel:+79912700720">
            +7 (991) 270-07-20
          </a>
          <p>
            Telegram:{" "}
            <a
              href="https://t.me/BellaFlore_bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              @BellaFlore_bot
            </a>
          </p>
          <p>Ежедневно · 09:00–22:00</p>
          <p>Москва и Московская область</p>
        </div>

        <div className={styles.deliveryColumn}>
          <p className={styles.columnLabel}>Доставка</p>
          <strong>Бережно и точно ко времени</strong>
          <p>
            По Москве и Московской области. Стоимость и доступный интервал
            рассчитываются при оформлении заказа.
          </p>
          <span>В день заказа — при наличии свободных интервалов</span>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© {new Date().getFullYear()} BellaFlore</p>
        <div className={styles.payments} aria-label="Способы оплаты">
          <span>СБП</span>
          <span>НАЛИЧНЫЕ</span>
        </div>
        <p>Цветы, которые запоминаются</p>
      </div>
    </footer>
  );
}
