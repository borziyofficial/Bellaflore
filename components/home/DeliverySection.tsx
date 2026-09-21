// ==================================================
// SECTION: DELIVERY
// РАЗДЕЛ: Доставка — премиальный editorial-блок на главной
//
// Purpose (EN): Marketing-only delivery info. No prices/zones here —
// live address, zone and cost are calculated in Checkout.
//
// Назначение (RU): Только маркетинговая информация. Цены и зоны
// доставки не показываем здесь — точный расчёт живёт в Checkout.
// ==================================================
"use client";

import styles from "@/components/home/DeliverySection.module.css";

function CarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 16V11.6a1 1 0 0 1 .9-1L7 10.4l1.5-3a1 1 0 0 1 .9-.6h4.4a1 1 0 0 1 .9.55L16 10.4l2.1.55a1 1 0 0 1 .9 1V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 16h1.5M19.5 16H21M8 16h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6.3" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.7" cy="16" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.6A1.6 1.6 0 0 1 5.6 7h2l.9-1.5a1 1 0 0 1 .86-.5h3.28a1 1 0 0 1 .86.5L14.4 7h2A1.6 1.6 0 0 1 18 8.6v7.8A1.6 1.6 0 0 1 16.4 18H5.6A1.6 1.6 0 0 1 4 16.4V8.6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SealedEnvelopeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4.2 7.2l7.1 6 7.1-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DELIVERY_FEATURES = [
  {
    id: "care",
    title: "Бережная доставка",
    text: null,
    Icon: CarIcon,
  },
  {
    id: "photo",
    title: "Фото перед отправкой",
    text: "Покажем готовый букет перед передачей курьеру.",
    Icon: CameraIcon,
  },
  {
    id: "anonymous",
    title: "Анонимно",
    text: "По вашему желанию имя отправителя останется конфиденциальным.",
    Icon: SealedEnvelopeIcon,
  },
  {
    id: "time",
    title: "Точное время",
    text: "Выберите доступный интервал при оформлении заказа.",
    Icon: ClockIcon,
  },
] as const;

export function DeliverySection() {
  return (
    <section id="delivery" className={`delivery ${styles.section}`}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Доставка</span>
          <h2 className={styles.heading}>Доставка по Москве и области</h2>
          <p className={styles.body}>
            Бережно доставляем букеты и композиции по Москве и Московской
            области.
          </p>
          <p className={styles.accent}>
            Точную стоимость и доступное время доставки покажем после
            указания адреса.
          </p>
        </div>

        <div className={styles.featuresCol}>
          <div className={styles.features}>
            {DELIVERY_FEATURES.map(({ id, title, text, Icon }) => (
              <div className={styles.feature} key={id}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon />
                </span>
                <span className={styles.featureTitle}>{title}</span>
                {text ? <p className={styles.featureText}>{text}</p> : null}
              </div>
            ))}
          </div>

          <p className={styles.note}>
            Доставка в день заказа доступна при наличии свободных интервалов.
          </p>
          <p className={styles.signature}>Москва · Московская область</p>
        </div>
      </div>
    </section>
  );
}
