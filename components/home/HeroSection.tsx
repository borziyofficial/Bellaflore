// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56B UI System v1)
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { useHeroBannerSettings } from "@/components/home/useHeroBannerSettings";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  const banner = useHeroBannerSettings();

  const title = banner?.title?.trim() || "";
  const subtitle = banner?.subtitle?.trim() || "Премиальная доставка цветов\nдля особых моментов";
  const buttonText = banner?.buttonText?.trim() || "Выбрать букет";
  const buttonLink = banner?.buttonLink?.trim() || "";
  const subtitleLines = subtitle.split("\n");

  return (
    <main
      id="home"
      className="hero"
      style={banner?.imageUrl ? { backgroundImage: `url(${banner.imageUrl})` } : undefined}
    >
      <div className={`hero-content bf-reveal bf-reveal-up ${styles.content}`}>
        {title ? (
          <h1 className="hero-title">{title}</h1>
        ) : (
          <BrandLogo as="h1" variant="hero" className="hero-title" />
        )}
        <p className={`hero-subtitle ${styles.subtitle}`}>
          {subtitleLines.map((line, index) => (
            <span key={index}>
              {line}
              {index < subtitleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
        {buttonLink ? (
          <a href={buttonLink} className={styles.primaryAction}>
            {buttonText}
          </a>
        ) : (
          <button type="button" className={styles.primaryAction} onClick={onOrderBouquet}>
            {buttonText}
          </button>
        )}
      </div>
    </main>
  );
}
