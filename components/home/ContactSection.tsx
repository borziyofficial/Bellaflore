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
          <div className={styles.socials} aria-label="Социальные сети BellaFlore">
            <a href="https://wa.me/70000000000" target="_blank" rel="noopener noreferrer">
              WA <span>WhatsApp</span>
            </a>
            <a href="https://t.me/" target="_blank" rel="noopener noreferrer">
              TG <span>Telegram</span>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
              IG <span>Instagram</span>
            </a>
          </div>
        </div>

        <nav className={styles.linksColumn} aria-label="Полезные ссылки">
          <h2>Полезные ссылки</h2>
          <a href="#catalog">Каталог букетов</a>
          <a href="#about">О BellaFlore</a>
          <a href="#reviews">Отзывы клиентов</a>
          <a href="#delivery">Доставка и оплата</a>
        </nav>

        <div className={styles.contactColumn}>
          <h2>Связаться с нами</h2>
          <a className={styles.phone} href="tel:+70000000000">
            +7 (000) 000-00-00
          </a>
          <p>Ежедневно · 09:00–22:00</p>
          <p>Москва и Московская область</p>
        </div>

        <div id="delivery" className={styles.deliveryColumn}>
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
          <span>МИР</span>
          <span>VISA</span>
          <span>MC</span>
          <span>СБП</span>
        </div>
        <p>Цветы, которые запоминаются</p>
      </div>
    </footer>
  );
}
