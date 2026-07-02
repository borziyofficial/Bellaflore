// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран (Stage 56A)
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { homeCatalogCategoryChips } from "@/components/catalog/homeCatalogConfig";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onBrowseCatalog: () => void;
  onCategorySelect: (categoryId: string) => void;
};

export function HeroSection({
  onBrowseCatalog,
  onCategorySelect,
}: HeroSectionProps) {
  return (
    <main id="home" className="hero">
      <div className={`hero-content bf-reveal bf-reveal-up ${styles.content}`}>
        <BrandLogo as="h1" variant="hero" className="hero-title" />
        <p className="hero-subtitle">
          Премиальная доставка цветов для особых моментов
        </p>

        <div className={styles.categoryRow} aria-label="Категории каталога">
          {homeCatalogCategoryChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={styles.categoryChip}
              onClick={() => onCategorySelect(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`buy-button hero-order-link ${styles.primaryAction}`}
            onClick={onBrowseCatalog}
          >
            Смотреть каталог
          </button>
          <a className={styles.secondaryAction} href="#contact">
            Заказать букет
          </a>
        </div>

        <ul className={styles.trustRow} aria-label="Преимущества доставки">
          <li>Доставка сегодня</li>
          <li>Премиальные букеты</li>
          <li>Москва и область</li>
        </ul>
      </div>
    </main>
  );
}
