// ==================================================
// SECTION: CATALOG ADMIN
// РАЗДЕЛ: Catalog Manager foundation UI
// ==================================================
"use client";

import { useMemo, useState } from "react";
import {
  CATALOG_ADMIN_ALL_CATEGORIES,
  filterCatalogAdminProducts,
  formatCatalogProductPrice,
  getCatalogProductStatusLabel,
} from "@/components/catalogAdmin/catalogAdminFoundation";
import {
  CATALOG_ADMIN_MOCK_PRODUCTS,
  getCatalogAdminCategories,
} from "@/components/catalogAdmin/catalogAdminMockData";
import { CATALOG_ADMIN_SECTION_ID } from "@/components/catalogAdmin/catalogAdminTypes";
import styles from "@/components/catalogAdmin/CatalogAdminManager.module.css";

const STATUS_CLASS = {
  active: styles.statusActive,
  draft: styles.statusDraft,
  hidden: styles.statusHidden,
} as const;

export function CatalogAdminManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState(CATALOG_ADMIN_ALL_CATEGORIES);

  const categories = useMemo(
    () => getCatalogAdminCategories(CATALOG_ADMIN_MOCK_PRODUCTS),
    [],
  );

  const filteredProducts = useMemo(
    () =>
      filterCatalogAdminProducts(CATALOG_ADMIN_MOCK_PRODUCTS, {
        searchQuery,
        category,
      }),
    [searchQuery, category],
  );

  return (
    <section id={CATALOG_ADMIN_SECTION_ID} className={styles.section}>
      <p className={styles.eyebrow}>Stage 44 · Catalog Manager</p>
      <h3 className={styles.title}>🌸 Каталог товаров</h3>
      <p className={styles.lead}>
        Foundation-модуль каталога: mock-данные, поиск и фильтры без БД и без
        загрузки фото.
      </p>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск по названию или описанию"
          aria-label="Поиск по названию"
        />
        <select
          className={styles.categorySelect}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Фильтр по категории"
        >
          <option value={CATALOG_ADMIN_ALL_CATEGORIES}>Все категории</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="button" className={styles.addButton} disabled>
          Добавить букет
        </button>
      </div>

      <p className={styles.resultsMeta}>
        Показано {filteredProducts.length} из {CATALOG_ADMIN_MOCK_PRODUCTS.length}{" "}
        товаров
      </p>

      {filteredProducts.length === 0 ? (
        <p className={styles.emptyState}>
          По текущему поиску и фильтру товары не найдены.
        </p>
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <article key={product.id} className={styles.productCard}>
              <div className={styles.imagePlaceholder}>{product.placeholderImageLabel}</div>
              <h4 className={styles.productName}>{product.name}</h4>
              <div className={styles.metaRow}>
                <p className={styles.metaPill}>{product.category}</p>
                <p className={`${styles.metaPill} ${styles.pricePill}`}>
                  {formatCatalogProductPrice(product.priceRub)}
                </p>
                <p className={`${styles.metaPill} ${STATUS_CLASS[product.status]}`}>
                  {getCatalogProductStatusLabel(product.status)}
                </p>
                <p className={styles.metaPill}>{product.flowerCount} цветов</p>
              </div>
              <p className={styles.description}>{product.shortDescription}</p>
              <div className={styles.actionRow}>
                <button type="button" className={styles.actionButton} disabled>
                  Редактировать
                </button>
                <button type="button" className={styles.actionButton} disabled>
                  Скрыть
                </button>
                <button type="button" className={styles.actionButton} disabled>
                  Фото
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={styles.futureNote}>
        <p className={styles.futureTitle}>Следующий этап: Stage 45 — Photo Manager</p>
        <p className={styles.futureDescription}>
          Здесь будет загрузка, замена и сортировка фотографий товаров.
        </p>
      </div>
    </section>
  );
}
