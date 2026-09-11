// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56B UI System v1)
// ==================================================
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

// Warm neutral placeholder (light beige #F5F3F0) shown during initial load
// while admin-configured banner image loads. SVG data URI prevents caching
// issues and empty flash. Smooth transition: fallback → admin image.
const FALLBACK_PHOTO_URL = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1 1%27%3E%3Crect fill=%27%23F5F3F0%27/%3E%3C/svg%3E";

function isCatalogHeroLink(buttonLink: string): boolean {
  const link = buttonLink.trim();
  if (!link) {
    return true;
  }

  const normalized = link.toLowerCase().replace(/\/+$/, "");
  if (["#catalog", "/#catalog", "/catalog"].includes(normalized)) {
    return true;
  }

  try {
    const url = new URL(link, "https://bellaflore.vercel.app");
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase().replace(/\/+$/, "");
    return (
      pathname === "/catalog" &&
      ["bellaflore.vercel.app", "bellaflore.ru", "www.bellaflore.ru"].includes(hostname)
    );
  } catch {
    return false;
  }
}

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const banner = useHeroBannerSettings();
  // Tracks which requested URL failed to load, if any. Comparing against the
  // current request (rather than a plain boolean) means a new banner image
  // automatically gets a fresh attempt with no effect/reset needed.
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [displayedPhotoUrl, setDisplayedPhotoUrl] = useState(FALLBACK_PHOTO_URL);

  const requestedPhotoUrl = banner?.imageUrl?.trim() || "";
  const targetPhotoUrl =
    requestedPhotoUrl && requestedPhotoUrl !== failedPhotoUrl
      ? requestedPhotoUrl
      : FALLBACK_PHOTO_URL;
  const title = banner?.title?.trim() || "Цветы, которые остаются в памяти";
  const subtitle =
    banner?.subtitle?.trim() ||
    "Авторские букеты из свежих цветов с деликатной доставкой по Москве";
  const buttonText = banner?.buttonText?.trim() || "ПЕРЕЙТИ В КАТАЛОГ";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const subtitleText = subtitle.replace(/\n+/g, " ");

  useEffect(() => {
    if (targetPhotoUrl === displayedPhotoUrl) {
      return;
    }

    if (targetPhotoUrl === FALLBACK_PHOTO_URL) {
      if (!requestedPhotoUrl || displayedPhotoUrl === FALLBACK_PHOTO_URL) {
        setDisplayedPhotoUrl(FALLBACK_PHOTO_URL);
      }
      return;
    }

    let active = true;
    const preload = new window.Image();
    preload.decoding = "async";
    preload.onload = () => {
      if (active) {
        setDisplayedPhotoUrl(targetPhotoUrl);
      }
    };
    preload.onerror = () => {
      if (active) {
        setFailedPhotoUrl(targetPhotoUrl);
      }
    };
    preload.src = targetPhotoUrl;

    return () => {
      active = false;
    };
  }, [displayedPhotoUrl, requestedPhotoUrl, targetPhotoUrl]);

  // Always render as native button element for catalog (ensures touch works on iOS)
  // Only render as link if explicitly configured to external URL
  const isExternalLink = !isCatalogHeroLink(buttonLink);
  const primaryAction = isExternalLink ? (
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
            src={displayedPhotoUrl}
            alt="Премиальный букет BellaFlore"
            fill
            sizes="(max-width: 960px) 90vw, 480px"
            priority
            onError={() => {
              setFailedPhotoUrl(displayedPhotoUrl);
              setDisplayedPhotoUrl(FALLBACK_PHOTO_URL);
            }}
          />
        </div>
      </div>
    </main>
  );
}
