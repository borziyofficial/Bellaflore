// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56B UI System v1)
// ==================================================
"use client";

import { useState } from "react";
import Image from "next/image";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

// Guaranteed-present bundled photo — always shown if the admin-configured
// banner image fails to load (missing file, blocked remote host, network error).
const FALLBACK_PHOTO_URL = "/roza rouze royal.PNG";

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const banner = useHeroBannerSettings();
  // Tracks which requested URL failed to load, if any. Comparing against the
  // current request (rather than a plain boolean) means a new banner image
  // automatically gets a fresh attempt with no effect/reset needed.
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const requestedPhotoUrl = banner?.imageUrl?.trim() || FALLBACK_PHOTO_URL;
  const photoUrl = requestedPhotoUrl === failedPhotoUrl ? FALLBACK_PHOTO_URL : requestedPhotoUrl;
  const title = banner?.title?.trim() || "Цветы, которые остаются в памяти";
  const subtitle =
    banner?.subtitle?.trim() ||
    "Авторские букеты из свежих цветов с деликатной доставкой по Москве";
  const buttonText = banner?.buttonText?.trim() || "Выбрать букет";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const subtitleText = subtitle.replace(/\n+/g, " ");
  const normalizedButtonLink = buttonLink.toLowerCase();
  const opensStorefrontCatalog =
    !buttonLink ||
    normalizedButtonLink === "#catalog" ||
    normalizedButtonLink === "/catalog" ||
    normalizedButtonLink === "https://bellaflore.ru/catalog" ||
    normalizedButtonLink === "https://www.bellaflore.ru/catalog";

  const primaryAction = !opensStorefrontCatalog ? (
    <a href={buttonLink} className={styles.primaryAction}>
      {buttonText}
    </a>
  ) : (
    <button type="button" className={styles.primaryAction} onClick={onOrderBouquet}>
      {buttonText}
    </button>
  );

  return (
    <main id="home" className={`hero ${styles.hero}`}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={`bf-reveal bf-reveal-up ${styles.content}`}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Авторская флористика · Москва
          </p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitleText}</p>

          <div className={styles.actions}>
            {primaryAction}
            <a className={styles.secondaryAction} href="#catalog">
              Смотреть коллекцию
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <ul className={styles.trustList} aria-label="Преимущества BellaFlore">
            <li>
              <strong>90 минут</strong>
              <span>экспресс-доставка</span>
            </li>
            <li>
              <strong>Ежедневно</strong>
              <span>свежие поставки</span>
            </li>
            <li>
              <strong>Персонально</strong>
              <span>открытка к заказу</span>
            </li>
          </ul>
        </div>

        <div className={styles.photo}>
          <Image
            key={photoUrl}
            src={photoUrl}
            alt="Премиальный букет BellaFlore"
            fill
            sizes="(max-width: 960px) 90vw, 480px"
            priority
            onError={() => setFailedPhotoUrl(requestedPhotoUrl)}
          />
        </div>
      </div>
    </main>
  );
}
