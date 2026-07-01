// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран
//
// Purpose (EN): Premium landing hero with catalog entry and order CTA.
//
// Назначение (RU): Премиальный hero с входом в каталог и CTA заказа.
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { homeCatalogCategoryChips } from "@/components/catalog/homeCatalogConfig";
import styles from "@/components/home/HeroSection.module.css";

type HeroSectionProps = {
  onBrowseCatalog: () => void;
  onCategorySelect: (categoryId: string) => void;
  onSearchEntryClick: () => void;
};

export function HeroSection({
  onBrowseCatalog,
  onCategorySelect,
  onSearchEntryClick,
}: HeroSectionProps) {
  return (
    <main id="home" className="hero">
      <div className={`hero-content bf-reveal bf-reveal-up ${styles.content}`}>
        <BrandLogo as="h1" variant="hero" className="hero-title" />
        <p className="hero-subtitle">
          Премиальная доставка цветов для особых моментов
        </p>

        <button
          type="button"
          className={styles.searchEntry}
          onClick={onSearchEntryClick}
          aria-label="Перейти к поиску букетов в каталоге"
        >
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <span>Найти букет в каталоге</span>
        </button>

        <div className={styles.categoryRow} aria-label="Быстрые категории">
          {homeCatalogCategoryChips
            .filter((chip) => chip.id !== "all")
            .slice(0, 5)
            .map((chip) => (
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
