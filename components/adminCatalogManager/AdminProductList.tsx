// ==================================================
// SECTION: Admin Catalog Manager — product list
// РАЗДЕЛ: Список товаров
// ==================================================
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AdminProductStatusFilter } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  getAdminProductStatusLabel,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

type AdminProductListProps = {
  products: CatalogProductRecord[];
  onCreate: () => void;
  onEdit: (productId: string) => void;
  onArchive: (productId: string) => void;
};

function formatPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU").format(priceRub);
}

export function AdminProductList({
  products,
  onCreate,
  onEdit,
  onArchive,
}: AdminProductListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AdminProductStatusFilter>("all");

  const categories = useMemo(() => {
    const ids = new Set(products.flatMap((product) => product.categoryIds));
    return Array.from(ids)
      .map((id) => CATALOG_CATEGORY_BY_ID[id])
      .filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesCategory =
        categoryFilter === "all" || product.categoryIds.includes(categoryFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" &&
          product.isPublished &&
          product.status !== "ARCHIVED") ||
        (statusFilter === "draft" &&
          !product.isPublished &&
          product.status !== "ARCHIVED") ||
        (statusFilter === "archived" && product.status === "ARCHIVED");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  return (
    <div className={styles.listLayout}>
      <header className={styles.listHeader}>
        <div>
          <p className={styles.formEyebrow}>Каталог Bellaflore</p>
          <h2 className={styles.formTitle}>Товары</h2>
          <p className={styles.listLead}>
            Управление букетами, размерами S–XL, статусами и превью витрины.
          </p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onCreate}>
          + Добавить товар
        </button>
      </header>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Поиск по названию, slug или тегам"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className={styles.select}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">Все категории</option>
          {categories.map((category) =>
            category ? (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ) : null,
          )}
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as AdminProductStatusFilter)
          }
        >
          <option value="all">Все статусы</option>
          <option value="published">Опубликован</option>
          <option value="draft">Черновик</option>
          <option value="archived">Архив</option>
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th>Цена от</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const image =
                product.images.find((item) => item.isPrimary) ?? product.images[0];
              const categoryTitle =
                CATALOG_CATEGORY_BY_ID[product.categoryIds[0] ?? ""]?.title ?? "—";
              const statusLabel = getAdminProductStatusLabel(product);

              return (
                <tr key={product.id}>
                  <td>
                    <div className={styles.tableProduct}>
                      <div className={styles.tableThumb}>
                        {image?.url ? (
                          <Image
                            src={image.url}
                            alt={image.alt || product.title}
                            fill
                            sizes="48px"
                            className={styles.tableThumbImage}
                            unoptimized={image.url.startsWith("blob:")}
                          />
                        ) : (
                          <span className={styles.tableThumbFallback}>BF</span>
                        )}
                      </div>
                      <div>
                        <p className={styles.tableTitle}>{product.title}</p>
                        <p className={styles.tableMeta}>{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td>{categoryTitle}</td>
                  <td>{formatPrice(product.basePriceRub)} ₽</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        product.status === "ARCHIVED"
                          ? styles.statusArchived
                          : product.isPublished
                            ? styles.statusPublished
                            : styles.statusDraft
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => onEdit(product.id)}
                      >
                        ✏️ Редактировать
                      </button>
                      {product.status !== "ARCHIVED" ? (
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => onArchive(product.id)}
                        >
                          🗑 Архивировать
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 ? (
          <p className={styles.emptyState}>Товары не найдены.</p>
        ) : null}
      </div>
    </div>
  );
}
