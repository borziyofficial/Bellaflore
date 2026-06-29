// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Product list UI (search, filter, sort, CRUD)
// ==================================================
"use client";

import {
  formatProductPrice,
  formatProductUpdatedAt,
  getProductMainImage,
} from "@/components/productStorage/productStorageBridge";
import { PRODUCT_STORAGE_CATEGORIES } from "@/components/productStorage/productStorageMockData";
import { useProductStorage } from "@/components/productStorage/ProductStorageProvider";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STORAGE_SECTION_ID,
  type ProductStorageStatus,
} from "@/components/productStorage/productStorageTypes";
import { PRODUCT_STORAGE_FUTURE_LAYERS } from "@/components/productStorage/productStorageAdapter";
import styles from "@/components/productStorage/ProductListFoundation.module.css";

const STATUS_CLASS: Record<ProductStorageStatus, string> = {
  draft: styles.statusDraft,
  published: styles.statusPublished,
  hidden: styles.statusHidden,
  archive: styles.statusArchive,
};

export function ProductListFoundation() {
  const {
    filteredProducts,
    filters,
    activeProductId,
    setFilters,
    selectProduct,
    createProduct,
    duplicateProduct,
    archiveProduct,
    deleteProduct,
  } = useProductStorage();

  return (
    <section id={PRODUCT_STORAGE_SECTION_ID} className={styles.section}>
      <p className={styles.eyebrow}>Stage 49 · Product Storage Foundation</p>
      <h3 className={styles.title}>📦 Хранилище товаров</h3>
      <p className={styles.lead}>
        Локальный Product Store с CRUD, статусами и фильтрами. Архитектура готова к
        подключению PostgreSQL и Prisma без переписывания UI.
      </p>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={filters.searchQuery}
          onChange={(event) => setFilters({ searchQuery: event.target.value })}
          placeholder="Поиск по названию, SKU или slug"
          aria-label="Поиск товаров"
        />
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(event) =>
            setFilters({ status: event.target.value as ProductStorageStatus | "all" })
          }
          aria-label="Фильтр по статусу"
        >
          <option value="all">Все статусы</option>
          {(Object.keys(PRODUCT_STATUS_LABELS) as ProductStorageStatus[]).map((status) => (
            <option key={status} value={status}>
              {PRODUCT_STATUS_LABELS[status].emoji} {PRODUCT_STATUS_LABELS[status].label}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filters.category}
          onChange={(event) => setFilters({ category: event.target.value })}
          aria-label="Фильтр по категории"
        >
          {PRODUCT_STORAGE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "Все категории" : category}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filters.sort}
          onChange={(event) =>
            setFilters({
              sort: event.target.value as typeof filters.sort,
            })
          }
          aria-label="Сортировка"
        >
          <option value="updated_desc">Сначала недавние</option>
          <option value="updated_asc">Сначала старые</option>
          <option value="title_asc">По названию А–Я</option>
          <option value="price_desc">По цене ↓</option>
        </select>
        <button type="button" className={styles.createButton} onClick={() => void createProduct()}>
          + Создать товар
        </button>
      </div>

      <p className={styles.resultsMeta}>
        Найдено: {filteredProducts.length} · Активный:{" "}
        {activeProductId ? "выбран" : "не выбран"}
      </p>

      {filteredProducts.length === 0 ? (
        <p className={styles.emptyState}>Товары не найдены. Измените фильтры или создайте новый.</p>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => {
            const mainImage = getProductMainImage(product);
            const statusMeta = PRODUCT_STATUS_LABELS[product.status];
            const isActive = product.id === activeProductId;

            return (
              <article
                key={product.id}
                className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
              >
                <div className={styles.cardHeader}>
                  {mainImage?.placeholderLabel ? (
                    <div className={styles.thumbPlaceholder} aria-hidden="true">
                      {mainImage.placeholderLabel}
                    </div>
                  ) : (
                    <div className={styles.thumbPlaceholder} aria-hidden="true">
                      нет фото
                    </div>
                  )}
                  <div className={styles.cardBody}>
                    <h4 className={styles.productTitle}>{product.title}</h4>
                    <p className={styles.price}>{formatProductPrice(product.price)}</p>
                    <div className={styles.metaRow}>
                      <p className={`${styles.metaPill} ${STATUS_CLASS[product.status]}`}>
                        {statusMeta.emoji} {statusMeta.label}
                      </p>
                      <p className={styles.metaPill}>{product.category}</p>
                    </div>
                  </div>
                </div>
                <p className={styles.updatedAt}>
                  Изменён: {formatProductUpdatedAt(product.updatedAt)}
                </p>
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                    onClick={() => selectProduct(product.id)}
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => void duplicateProduct(product.id)}
                  >
                    📋 Дублировать
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => void archiveProduct(product.id)}
                    disabled={product.status === "archive"}
                  >
                    🔴 Архив
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => void deleteProduct(product.id)}
                  >
                    🗑 Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className={styles.futureBlock}>
        <p className={styles.futureTitle}>Future Ready · Database Layer</p>
        <ul className={styles.futureList}>
          {PRODUCT_STORAGE_FUTURE_LAYERS.map((layer) => (
            <li key={layer} className={styles.futureItem}>
              {layer}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
