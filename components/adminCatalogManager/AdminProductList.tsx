// ==================================================
// SECTION: Admin Catalog Manager — product list
// РАЗДЕЛ: Список товаров
// ==================================================
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminProductStatusFilter } from "@/components/adminCatalogManager/adminCatalogTypes";
import { getAdminProductStatusLabel } from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { resolveAdminCategoryTitle } from "@/components/adminCatalogManager/adminCustomCategories";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminProductList.module.css";

type AdminProductListProps = {
  products: CatalogProductRecord[];
  compactHeader?: boolean;
  onCreate: () => void;
  onEdit: (productId: string) => void;
  onArchive: (productId: string) => void;
};

type StatusChip = {
  id: AdminProductStatusFilter;
  label: string;
};

const STATUS_CHIPS: StatusChip[] = [
  { id: "all", label: "Все" },
  { id: "published", label: "Активные" },
  { id: "draft", label: "Черновики" },
  { id: "archived", label: "Архив" },
];

function formatPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU").format(priceRub);
}

function formatProductCountLine(
  total: number,
  publishedCount: number,
): string {
  const totalLabel =
    total === 1 ? "1 товар" : total >= 2 && total <= 4 ? `${total} товара` : `${total} товаров`;

  return `${totalLabel} · ${publishedCount} опубликовано`;
}

function getStatusTone(product: CatalogProductRecord): "archived" | "published" | "draft" {
  if (product.status === "ARCHIVED") {
    return "archived";
  }

  if (product.isPublished) {
    return "published";
  }

  return "draft";
}

function downloadProductsCsv(products: CatalogProductRecord[]) {
  const header = ["title", "slug", "category", "price_rub", "status"];
  const rows = products.map((product) => {
    const categoryTitle = resolveAdminCategoryTitle(product.categoryIds[0] ?? "");
    const statusLabel = getAdminProductStatusLabel(product);

    return [
      product.title,
      product.slug,
      categoryTitle,
      String(product.basePriceRub),
      statusLabel,
    ];
  });

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bellaflore-products.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ProductCard({
  product,
  onEdit,
  onArchive,
}: {
  product: CatalogProductRecord;
  onEdit: (productId: string) => void;
  onArchive: (productId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
  const categoryTitle = resolveAdminCategoryTitle(product.categoryIds[0] ?? "");
  const statusLabel = getAdminProductStatusLabel(product);
  const statusTone = getStatusTone(product);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  return (
    <article className={styles.productCard}>
      <div className={styles.cardThumb}>
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || product.title}
            fill
            sizes="(max-width: 390px) 88px, 96px"
            className={styles.cardThumbImage}
            unoptimized={image.url.startsWith("blob:")}
          />
        ) : (
          <span className={styles.cardThumbFallback}>BF</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTopRow}>
          <div className={styles.cardCopy}>
            <h3 className={styles.cardTitle}>{product.title}</h3>
            <p className={styles.cardCategory}>{categoryTitle || "—"}</p>
          </div>
          <span className={`${styles.statusPill} ${styles[`status_${statusTone}`]}`}>
            {statusLabel}
          </span>
        </div>

        <div className={styles.cardBottomRow}>
          <strong className={styles.cardPrice}>{formatPrice(product.basePriceRub)} ₽</strong>

          <div className={styles.menuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Действия для ${product.title}`}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
            >
              ···
            </button>

            {menuOpen ? (
              <div className={styles.menuPanel} role="menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(product.id);
                  }}
                >
                  Редактировать
                </button>
                {product.status !== "ARCHIVED" ? (
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(product.id);
                    }}
                  >
                    Архивировать
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminProductList({
  products,
  compactHeader = false,
  onCreate,
  onEdit,
  onArchive,
}: AdminProductListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AdminProductStatusFilter>("all");
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);

  const publishedCount = useMemo(
    () =>
      products.filter(
        (product) => product.isPublished && product.status !== "ARCHIVED",
      ).length,
    [products],
  );

  const categories = useMemo(() => {
    const ids = new Set(products.flatMap((product) => product.categoryIds));
    return Array.from(ids).map((id) => ({
      id,
      title: resolveAdminCategoryTitle(id),
    }));
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

  const activeCategoryLabel =
    categoryFilter === "all"
      ? "Категории"
      : categories.find((category) => category.id === categoryFilter)?.title ?? "Категории";

  return (
    <div className={styles.listRoot}>
      <header className={styles.listHeader}>
        <div className={styles.listHeaderCopy}>
          {!compactHeader ? <p className={styles.listEyebrow}>Каталог Bellaflore</p> : null}
          <h2 className={styles.listTitle}>Товары</h2>
          <p className={styles.listMeta}>
            {formatProductCountLine(products.length, publishedCount)}
          </p>
        </div>

        <div className={styles.listHeaderActions}>
          <button
            type="button"
            className={styles.csvButton}
            onClick={() => downloadProductsCsv(filteredProducts)}
            disabled={filteredProducts.length === 0}
          >
            CSV
          </button>
          <button type="button" className={styles.addButton} onClick={onCreate}>
            + Добавить
          </button>
        </div>
      </header>

      <label className={styles.searchField}>
        <span className={styles.searchIcon} aria-hidden="true">
          ⌕
        </span>
        <input
          className={styles.searchInput}
          placeholder="Поиск по названию, slug или тегам"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className={styles.filterRow}>
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`${styles.filterChip} ${
              statusFilter === chip.id ? styles.filterChipActive : ""
            }`}
            onClick={() => {
              setStatusFilter(chip.id);
              setCategoryPanelOpen(false);
            }}
          >
            {chip.label}
          </button>
        ))}

        <button
          type="button"
          className={`${styles.filterChip} ${
            categoryFilter !== "all" || categoryPanelOpen ? styles.filterChipActive : ""
          }`}
          onClick={() => setCategoryPanelOpen((open) => !open)}
        >
          {activeCategoryLabel}
        </button>
      </div>

      {categoryPanelOpen ? (
        <div className={styles.categoryRow}>
          <button
            type="button"
            className={`${styles.categoryChip} ${
              categoryFilter === "all" ? styles.categoryChipActive : ""
            }`}
            onClick={() => setCategoryFilter("all")}
          >
            Все категории
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryChip} ${
                categoryFilter === category.id ? styles.categoryChipActive : ""
              }`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.cardGrid}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}

        {filteredProducts.length === 0 ? (
          <p className={styles.emptyState}>Товары не найдены.</p>
        ) : null}
      </div>
    </div>
  );
}
