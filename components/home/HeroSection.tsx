// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный editorial-экран BellaFlore
// ==================================================
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

const EDITORIAL_HERO_URL = "/images/hero-editorial-premium.png";
const HERO_SLIDE_INTERVAL_MS = 2000;

function isCatalogHeroLink(buttonLink: string): boolean {
  const link = buttonLink.trim();
  if (!link) return true;

  const normalized = link.toLowerCase().replace(/\/+$/, "");
  if (["#catalog", "/#catalog", "/catalog"].includes(normalized)) return true;

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
  const { settings: banner } = useHeroBannerSettings();
  const configuredTitle = banner?.title?.trim();
  const title =
    !configuredTitle || configuredTitle === "Цветы, которые запоминаются"
      ? "Больше, чем цветы"
      : configuredTitle;
  const subtitle =
    banner?.subtitle?.trim() ||
    "Авторские букеты для особенных моментов в Москве";
  const eyebrow = banner?.eyebrow?.trim() || "Цветы · искусство · люди";
  const cardTitle = banner?.cardTitle?.trim() || "Красота\nв каждой\nдетали";
  const cardSubtitle = banner?.cardSubtitle?.trim() || "BellaFlore\nMoscow";
  const tagline = banner?.tagline?.trim() || "Вдохновение — всегда";
  const buttonText = banner?.buttonText?.trim() || "Выбрать букет";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const isExternalLink = !isCatalogHeroLink(buttonLink);

  const photos = useMemo(
    () =>
      (banner?.photos ?? [])
        .filter((photo) => photo.isEnabled && photo.imageUrl.trim())
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [banner?.photos],
  );
  const fallbackImageUrl = banner?.imageUrl?.trim() || EDITORIAL_HERO_URL;
  const heroPhotos = useMemo(() => {
    if (photos.length > 0) return photos;
    return [
      {
        id: "editorial-fallback",
        imageUrl: fallbackImageUrl,
        mobileImageUrl: "",
        objectPosition: "64% 50%",
        isEnabled: true,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
  }, [photos, fallbackImageUrl]);
  const primaryIndex = Math.max(
    0,
    heroPhotos.findIndex((photo) => photo.isPrimary),
  );
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const resolvedActiveIndex = heroPhotos.findIndex((photo) => photo.id === activePhotoId);
  const safeActiveIndex =
    resolvedActiveIndex >= 0 ? resolvedActiveIndex : primaryIndex;

  const touchStartX = useRef<number | null>(null);

  const goToPhoto = (direction: -1 | 1) => {
    if (heroPhotos.length <= 1) return;
    const nextIndex = (safeActiveIndex + direction + heroPhotos.length) % heroPhotos.length;
    setActivePhotoId(heroPhotos[nextIndex]?.id ?? null);
  };

  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      const nextIndex = (safeActiveIndex + 1) % heroPhotos.length;
      setActivePhotoId(heroPhotos[nextIndex]?.id ?? null);
    }, HERO_SLIDE_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [heroPhotos, safeActiveIndex]);

  const primaryAction = isExternalLink ? (
    <a href={buttonLink} className={styles.primaryAction}>
      {buttonText}
      <span aria-hidden="true">→</span>
    </a>
  ) : (
    <button type="button" className={styles.primaryAction} onClick={onOrderBouquet}>
      {buttonText}
      <span aria-hidden="true">→</span>
    </button>
  );

  return (
    <main id="home" className={`hero ${styles.hero}`}>
      <div
        className={styles.artwork}
        aria-label={heroPhotos.length > 1 ? "Фотографии Hero, можно листать свайпом" : undefined}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          touchStartX.current = null;
          const endX = event.changedTouches[0]?.clientX ?? null;
          if (startX === null || endX === null || Math.abs(endX - startX) < 45) return;
          goToPhoto(endX < startX ? 1 : -1);
        }}
      >
        {heroPhotos.map((photo, index) => (
          <Image
            key={photo.id}
            src={photo.mobileImageUrl || photo.imageUrl}
            alt=""
            fill
            preload={index === primaryIndex}
            quality={92}
            sizes="100vw"
            className={`${styles.artworkImage} ${
              index === safeActiveIndex ? styles.artworkImageActive : ""
            }`}
            style={{ objectPosition: photo.objectPosition || "50% 50%" }}
          />
        ))}
      </div>

      <div className={styles.wash} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.orbitInner} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={`bf-reveal bf-reveal-up ${styles.content}`}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle.replace(/\n+/g, " ")}</p>
          <div className={styles.actions}>{primaryAction}</div>
        </div>

        <aside className={styles.detailCard} aria-label="BellaFlore — красота в каждой детали">
          <span className={styles.detailRule} aria-hidden="true" />
          <p>{cardTitle}</p>
          <small>{cardSubtitle}</small>
        </aside>

        <div className={styles.sceneFooter} aria-hidden="true">
          <span>
            {String(safeActiveIndex + 1).padStart(2, "0")} <i>/</i>{" "}
            {String(heroPhotos.length).padStart(2, "0")}
          </span>
          <p>{tagline}</p>
        </div>
      </div>
    </main>
  );
}
