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

type HeroOverlayState = {
  index: number;
  imageUrl: string;
  visible: boolean;
  committed: boolean;
};

const FALLBACK_PHOTO_URL = "/0001.jpg";
const HERO_CYCLE_MS = 3000;
const HERO_TRANSITION_MS = 800;
const HERO_HOLD_MS = HERO_CYCLE_MS - HERO_TRANSITION_MS;

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
    : [
        {
          id: "default-hero",
          imageUrl: FALLBACK_PHOTO_URL,
          isEnabled: true,
          isPrimary: true,
          sortOrder: 0,
        },
      ];
}

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const { settings: banner, isResolved: isBannerResolved } =
    useHeroBannerSettings();
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<string[]>([]);
  const [readyPhotoUrls, setReadyPhotoUrls] = useState<string[]>([]);
  const [renderedPhotoUrl, setRenderedPhotoUrl] = useState<string | null>(null);
  const [currentPhotoState, setCurrentPhotoState] = useState({
    signature: "",
    index: 0,
  });
  const [overlay, setOverlay] = useState<HeroOverlayState | null>(null);

  const activeHeroPhotos = useMemo(() => {
    if (!isBannerResolved) {
      return [];
    }

    const failed = new Set(failedPhotoUrls);
    const availablePhotos = normalizeHeroPhotos(banner?.photos, banner?.imageUrl).filter(
      (photo) => !failed.has(photo.imageUrl),
    );
    return availablePhotos.length > 0
      ? availablePhotos
      : [
          {
            id: "default-hero",
            imageUrl: FALLBACK_PHOTO_URL,
            isEnabled: true,
            isPrimary: true,
            sortOrder: 0,
          },
        ];
  }, [banner?.imageUrl, banner?.photos, failedPhotoUrls, isBannerResolved]);

  const readyPhotos = useMemo(() => new Set(readyPhotoUrls), [readyPhotoUrls]);
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
  const displayedPhotoUrl = activeHeroPhotos[currentPhotoIndex]?.imageUrl ?? null;
  const upcomingPhotoIndex =
    activeHeroPhotos.length > 1
      ? (currentPhotoIndex + 1) % activeHeroPhotos.length
      : currentPhotoIndex;
  const upcomingPhotoUrl =
    activeHeroPhotos.length > 1
      ? activeHeroPhotos[upcomingPhotoIndex]?.imageUrl ?? null
      : null;
  const isDisplayedPhotoReady = Boolean(
    displayedPhotoUrl && readyPhotos.has(displayedPhotoUrl),
  );
  const isDisplayedPhotoRendered = Boolean(
    displayedPhotoUrl && renderedPhotoUrl === displayedPhotoUrl,
  );

  const title = banner?.title?.trim() || "Цветы, которые остаются в памяти";
  const subtitle =
    banner?.subtitle?.trim() ||
    "Авторские букеты из свежих цветов с деликатной доставкой по Москве";
  const buttonText = banner?.buttonText?.trim() || "ПЕРЕЙТИ В КАТАЛОГ";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const subtitleText = subtitle.replace(/\n+/g, " ");

  useEffect(() => {
    if (!displayedPhotoUrl || readyPhotos.has(displayedPhotoUrl)) {
      return;
    }

    let active = true;
    const preload = new window.Image();
    preload.decoding = "async";
    preload.onload = () => {
      if (!active) {
        return;
      }
      setReadyPhotoUrls((current) =>
        current.includes(displayedPhotoUrl)
          ? current
          : [...current, displayedPhotoUrl],
      );
    };
    preload.onerror = () => {
      if (!active) {
        return;
      }
      setFailedPhotoUrls((current) =>
        current.includes(displayedPhotoUrl)
          ? current
          : [...current, displayedPhotoUrl],
      );
    };
    preload.src = displayedPhotoUrl;

    return () => {
      active = false;
    };
  }, [displayedPhotoUrl, readyPhotos]);

  useEffect(() => {
    if (
      !displayedPhotoUrl ||
      !upcomingPhotoUrl ||
      !isDisplayedPhotoReady ||
      !isDisplayedPhotoRendered ||
      !readyPhotos.has(upcomingPhotoUrl) ||
      overlay ||
      activeHeroPhotos.length < 2
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOverlay({
        index: upcomingPhotoIndex,
        imageUrl: upcomingPhotoUrl,
        visible: false,
        committed: false,
      });
    }, HERO_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [
    activeHeroPhotos.length,
    displayedPhotoUrl,
    isDisplayedPhotoReady,
    isDisplayedPhotoRendered,
    overlay,
    readyPhotos,
    upcomingPhotoIndex,
    upcomingPhotoUrl,
  ]);

  useEffect(() => {
    if (!overlay?.visible || overlay.committed) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPhotoState({
        signature: activePhotoSignature,
        index: overlay.index,
      });
      setOverlay((current) =>
        current ? { ...current, committed: true } : current,
      );
    }, HERO_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [activePhotoSignature, overlay]);

  useEffect(() => {
    if (!overlay?.committed || renderedPhotoUrl !== overlay.imageUrl) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setOverlay(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [overlay, renderedPhotoUrl]);

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
          {upcomingPhotoUrl && upcomingPhotoUrl !== displayedPhotoUrl ? (
            <Image
              key={`preload:${upcomingPhotoUrl}`}
              className={styles.photoImage}
              src={upcomingPhotoUrl}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 960px) 100vw, 68vw"
              quality={92}
              loading="eager"
              style={{ opacity: 0, pointerEvents: "none", zIndex: 0 }}
              onLoad={() =>
                setReadyPhotoUrls((current) =>
                  current.includes(upcomingPhotoUrl)
                    ? current
                    : [...current, upcomingPhotoUrl],
                )
              }
              onError={() =>
                setFailedPhotoUrls((current) =>
                  current.includes(upcomingPhotoUrl)
                    ? current
                    : [...current, upcomingPhotoUrl],
                )
              }
            />
          ) : null}

          {displayedPhotoUrl && isDisplayedPhotoReady ? (
            <Image
              key={`base:${displayedPhotoUrl}`}
              className={styles.photoImage}
              src={displayedPhotoUrl}
              alt="Премиальный букет BellaFlore"
              fill
              sizes="(max-width: 960px) 100vw, 68vw"
              quality={92}
              fetchPriority="high"
              style={{ opacity: 1, zIndex: 1 }}
              onLoad={() => setRenderedPhotoUrl(displayedPhotoUrl)}
              onError={() => {
                setReadyPhotoUrls((current) =>
                  current.filter((photoUrl) => photoUrl !== displayedPhotoUrl),
                );
                setFailedPhotoUrls((current) =>
                  current.includes(displayedPhotoUrl)
                    ? current
                    : [...current, displayedPhotoUrl],
                );
              }}
            />
          ) : null}

          {overlay ? (
            <Image
              key={`overlay:${overlay.imageUrl}`}
              className={styles.photoImage}
              src={overlay.imageUrl}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 960px) 100vw, 68vw"
              quality={92}
              loading="eager"
              style={{
                opacity: overlay.visible ? 1 : 0,
                zIndex: 2,
                pointerEvents: "none",
                willChange: "opacity",
                transition: `opacity ${HERO_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
              onLoad={() => {
                setReadyPhotoUrls((current) =>
                  current.includes(overlay.imageUrl)
                    ? current
                    : [...current, overlay.imageUrl],
                );
                if (!overlay.visible) {
                  window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                      setOverlay((current) =>
                        current && current.imageUrl === overlay.imageUrl
                          ? { ...current, visible: true }
                          : current,
                      );
                    });
                  });
                }
              }}
              onError={() => {
                setFailedPhotoUrls((current) =>
                  current.includes(overlay.imageUrl)
                    ? current
                    : [...current, overlay.imageUrl],
                );
                setOverlay(null);
              }}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
