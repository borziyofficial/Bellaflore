// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (PHASE V2 — editorial art scene)
// ==================================================
"use client";

import Image from "next/image";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

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

const FALLBACK_HERO_IMAGE = "/images/hero-floral-composition.png";

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const { settings: banner } = useHeroBannerSettings();

  const enabledPhotos = (banner?.photos ?? []).filter((photo) => photo.isEnabled);
  const primaryPhoto =
    enabledPhotos.find((photo) => photo.isPrimary) ?? enabledPhotos[0] ?? null;
  const slideTotal = enabledPhotos.length || 1;

  const desktopImageUrl = primaryPhoto?.imageUrl?.trim() || FALLBACK_HERO_IMAGE;
  const mobileImageUrl = primaryPhoto?.mobileImageUrl?.trim() || "";
  const objectPosition = primaryPhoto?.objectPosition?.trim() || "50% 50%";

  const headline = banner?.title?.trim() || "Больше\nчем цветы";
  const [headlineLine1, headlineLine2] = headline
    .split("\n")
    .map((line) => line.trim());

  const eyebrowCopy = banner?.eyebrow?.trim() || "Эмоции,\nкоторые остаются";
  const eyebrowLines = eyebrowCopy.split("\n").map((line) => line.trim());

  const supportingCopy =
    banner?.subtitle?.trim() ||
    "Авторские букеты\nдля особенных\nмоментов\nв Москве";
  const supportingLines = supportingCopy.split("\n").map((line) => line.trim());

  const buttonText = banner?.buttonText?.trim() || "Выбрать букет";
  const buttonLink = banner?.buttonLink?.trim() || "";

  const cardTitleCopy = banner?.cardTitle?.trim() || "Красота\nв каждой\nдетали";
  const cardTitleLines = cardTitleCopy.split("\n").map((line) => line.trim());

  const cardSubtitleCopy = banner?.cardSubtitle?.trim() || "BellaFlore\nMoscow";
  const cardSubtitleLines = cardSubtitleCopy.split("\n").map((line) => line.trim());

  const tagline = banner?.tagline?.trim() || "Вдохновлять — всегда";

  const isExternalLink = !isCatalogHeroLink(buttonLink);
  const primaryAction = isExternalLink ? (
    <a href={buttonLink} className={styles.primaryAction}>
      {buttonText}
      <span aria-hidden="true" className={styles.primaryActionArrow}>
        →
      </span>
    </a>
  ) : (
    <button type="button" className={styles.primaryAction} onClick={onOrderBouquet}>
      {buttonText}
      <span aria-hidden="true" className={styles.primaryActionArrow}>
        →
      </span>
    </button>
  );

  return (
    <main id="home" className={styles.hero}>
      <div className={styles.scene}>
        <div className={`bf-reveal bf-reveal-up ${styles.textBlock}`}>
          <h1 className={styles.headline}>
            {headlineLine1}
            {headlineLine2 ? (
              <>
                <br />
                {headlineLine2}
              </>
            ) : null}
          </h1>
          <p className={styles.eyebrow}>
            {eyebrowLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < eyebrowLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <p className={styles.supporting}>
            {supportingLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < supportingLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          {primaryAction}
        </div>

        <div className={styles.artWrap} aria-hidden="true">
          <svg
            className={styles.arc}
            viewBox="0 0 420 420"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M145,11.5 A190,190 0 1,1 87.8,335.5"
              stroke="url(#heroArcGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="heroArcGradient"
                x1="42"
                y1="0"
                x2="378"
                y2="320"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#c4aa7a" stopOpacity="0" />
                <stop offset="35%" stopColor="#c4aa7a" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#a88a5a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#a88a5a" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className={styles.photo}>
            {mobileImageUrl ? (
              <>
                <Image
                  className={`${styles.photoImage} ${styles.photoImageMobile}`}
                  src={mobileImageUrl}
                  alt="Авторская флористическая композиция BellaFlore"
                  fill
                  style={{ objectPosition }}
                  sizes="320px"
                  quality={88}
                  fetchPriority="high"
                  priority
                />
                <Image
                  className={`${styles.photoImage} ${styles.photoImageDesktop}`}
                  src={desktopImageUrl}
                  alt="Авторская флористическая композиция BellaFlore"
                  fill
                  style={{ objectPosition }}
                  sizes="560px"
                  quality={88}
                  fetchPriority="high"
                  priority
                />
              </>
            ) : (
              <Image
                className={styles.photoImage}
                src={desktopImageUrl}
                alt="Авторская флористическая композиция BellaFlore"
                fill
                style={{ objectPosition }}
                sizes="(max-width: 960px) 320px, 560px"
                quality={88}
                fetchPriority="high"
                priority
              />
            )}
          </div>

          <div className={styles.glassCard}>
            <p className={styles.glassCardTitle}>
              {cardTitleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < cardTitleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
            <span className={styles.glassDivider} aria-hidden="true" />
            <p className={styles.glassCardBrand}>
              {cardSubtitleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < cardSubtitleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className={styles.sceneFooter}>
          <span className={styles.counter}>
            {String(primaryPhoto ? enabledPhotos.indexOf(primaryPhoto) + 1 : 1).padStart(2, "0")} /{" "}
            {String(slideTotal).padStart(2, "0")}
          </span>
          <span className={styles.footerDivider} aria-hidden="true" />
          <span className={styles.tagline}>{tagline}</span>
        </div>
      </div>
    </main>
  );
}
