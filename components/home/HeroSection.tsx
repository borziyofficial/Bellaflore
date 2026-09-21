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

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const { settings: banner } = useHeroBannerSettings();

  const headline = banner?.title?.trim() || "Больше\nчем цветы";
  const [headlineLine1, headlineLine2] = headline
    .split("\n")
    .map((line) => line.trim());

  const supportingCopy =
    banner?.subtitle?.trim() ||
    "Авторские букеты\nдля особенных\nмоментов\nв Москве";
  const supportingLines = supportingCopy.split("\n").map((line) => line.trim());

  const buttonText = banner?.buttonText?.trim() || "Выбрать букет";
  const buttonLink = banner?.buttonLink?.trim() || "";

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
    <main id="home" className={`hero ${styles.hero}`}>
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
            Эмоции,
            <br />
            которые остаются
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
            <circle
              cx="210"
              cy="150"
              r="168"
              stroke="url(#heroArcGradient)"
              strokeWidth="1.5"
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
            <Image
              className={styles.photoImage}
              src="/images/hero-floral-composition.png"
              alt="Авторская флористическая композиция BellaFlore"
              fill
              sizes="(max-width: 960px) 92vw, 46vw"
              quality={88}
              fetchPriority="high"
              priority
            />
          </div>

          <div className={styles.glassCard}>
            <p className={styles.glassCardTitle}>
              Красота
              <br />в каждой
              <br />
              детали
            </p>
            <span className={styles.glassDivider} aria-hidden="true" />
            <p className={styles.glassCardBrand}>
              BellaFlore
              <br />
              Moscow
            </p>
          </div>
        </div>

        <div className={styles.sceneFooter}>
          <span className={styles.counter}>01 / 03</span>
          <span className={styles.footerDivider} aria-hidden="true" />
          <span className={styles.tagline}>Вдохновлять — всегда</span>
        </div>
      </div>
    </main>
  );
}
