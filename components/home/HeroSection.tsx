// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56B UI System v1)
// ==================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  useHeroBannerSettings,
  type HeroBannerPhoto,
} from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

// Warm neutral placeholder (light beige #F5F3F0) shown during initial load
// while admin-configured banner image loads. SVG data URI prevents caching
// issues and empty flash. Smooth transition: fallback → admin image.
const FALLBACK_PHOTO_URL = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1 1%27%3E%3Crect fill=%27%23F5F3F0%27/%3E%3C/svg%3E";
const HERO_ROTATION_MS = 6200;
const HERO_TRANSITION_MS = 1100;

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

function normalizeHeroPhotos(
  photos: HeroBannerPhoto[] | undefined,
  imageUrl: string | undefined,
): HeroBannerPhoto[] {
  const normalized = Array.isArray(photos)
    ? photos
        .filter((photo) => photo.imageUrl.trim() && photo.isEnabled)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((photo, index) => ({ ...photo, sortOrder: index }))
    : [];

  if (normalized.length > 0) {
    return normalized;
  }

  const legacyImageUrl = imageUrl?.trim();
  return legacyImageUrl
    ? [
        {
          id: "legacy-primary",
          imageUrl: legacyImageUrl,
          isEnabled: true,
          isPrimary: true,
          sortOrder: 0,
        },
      ]
    : [];
}

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const banner = useHeroBannerSettings();
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<string[]>([]);
  const [currentPhotoState, setCurrentPhotoState] = useState({
    signature: "",
    index: 0,
  });
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);

  const activeHeroPhotos = useMemo(() => {
    const failed = new Set(failedPhotoUrls);
    return normalizeHeroPhotos(banner?.photos, banner?.imageUrl).filter(
      (photo) => !failed.has(photo.imageUrl),
    );
  }, [banner?.imageUrl, banner?.photos, failedPhotoUrls]);
  const activePhotoSignature = activeHeroPhotos
    .map((photo) => `${photo.id}:${photo.imageUrl}:${photo.isPrimary}`)
    .join("|");
  const primaryPhotoIndex = Math.max(
    0,
    activeHeroPhotos.findIndex((photo) => photo.isPrimary),
  );
  const currentPhotoIndex =
    currentPhotoState.signature === activePhotoSignature &&
    currentPhotoState.index < activeHeroPhotos.length
      ? currentPhotoState.index
      : primaryPhotoIndex;
  const displayedPhotoUrl =
    activeHeroPhotos[currentPhotoIndex]?.imageUrl ?? FALLBACK_PHOTO_URL;
  const title = banner?.title?.trim() || "Цветы, которые остаются в памяти";
  const subtitle =
    banner?.subtitle?.trim() ||
    "Авторские букеты из свежих цветов с деликатной доставкой по Москве";
  const buttonText = banner?.buttonText?.trim() || "ПЕРЕЙТИ В КАТАЛОГ";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const subtitleText = subtitle.replace(/\n+/g, " ");

  useEffect(() => {
    if (activeHeroPhotos.length < 2) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      const nextIndex = (currentPhotoIndex + 1) % activeHeroPhotos.length;
      const nextPhotoUrl = activeHeroPhotos[nextIndex]?.imageUrl;
      if (!nextPhotoUrl) {
        return;
      }

      const preload = new window.Image();
      preload.decoding = "async";
      preload.onload = () => {
        if (!active) {
          return;
        }
        setPreviousPhotoUrl(displayedPhotoUrl);
        setCurrentPhotoState({ signature: activePhotoSignature, index: nextIndex });
      };
      preload.onerror = () => {
        if (!active) {
          return;
        }
        setFailedPhotoUrls((current) =>
          current.includes(nextPhotoUrl) ? current : [...current, nextPhotoUrl],
        );
      };
      preload.src = nextPhotoUrl;
    }, HERO_ROTATION_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeHeroPhotos, activePhotoSignature, currentPhotoIndex, displayedPhotoUrl]);

  useEffect(() => {
    if (!previousPhotoUrl) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPreviousPhotoUrl(null);
    }, HERO_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [previousPhotoUrl]);

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
          {previousPhotoUrl ? (
            <Image
              key={`previous:${previousPhotoUrl}`}
              className={`${styles.photoImage} ${styles.photoImagePrevious}`}
              src={previousPhotoUrl}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 960px) 92vw, 48vw"
              unoptimized={previousPhotoUrl.startsWith("data:")}
            />
          ) : null}
          <Image
            key={`current:${displayedPhotoUrl}`}
            className={`${styles.photoImage} ${styles.photoImageCurrent}`}
            src={displayedPhotoUrl}
            alt="Премиальный букет BellaFlore"
            fill
            sizes="(max-width: 960px) 92vw, 48vw"
            priority
            unoptimized={displayedPhotoUrl.startsWith("data:")}
            onError={() => {
              if (displayedPhotoUrl !== FALLBACK_PHOTO_URL) {
                setFailedPhotoUrls((current) =>
                  current.includes(displayedPhotoUrl)
                    ? current
                    : [...current, displayedPhotoUrl],
                );
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
