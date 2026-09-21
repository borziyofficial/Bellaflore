// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный editorial-экран BellaFlore
// ==================================================
"use client";

import Image from "next/image";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

const EDITORIAL_HERO_URL = "/images/hero-editorial-premium.png";

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
      <div className={styles.artwork} aria-hidden="true">
        <Image
          src={EDITORIAL_HERO_URL}
          alt=""
          fill
          preload
          quality={92}
          sizes="100vw"
          className={styles.artworkImage}
        />
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
          <span>01 <i>/</i> 01</span>
          <p>{tagline}</p>
        </div>
      </div>
    </main>
  );
}
