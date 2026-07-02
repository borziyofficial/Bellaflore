// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56B UI System v1)
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onOrderBouquet: () => void;
};

export function HeroSection({ onOrderBouquet }: HeroSectionProps) {
  return (
    <main id="home" className="hero">
      <div className={`hero-content bf-reveal bf-reveal-up ${styles.content}`}>
        <BrandLogo as="h1" variant="hero" className="hero-title" />
        <p className={`hero-subtitle ${styles.subtitle}`}>
          Премиальная доставка цветов
          <br />
          для особых моментов
        </p>
        <button
          type="button"
          className={`buy-button hero-order-link ${styles.primaryAction}`}
          onClick={onOrderBouquet}
        >
          Выбрать букет
        </button>
      </div>
    </main>
  );
}
