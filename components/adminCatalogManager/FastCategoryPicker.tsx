// ==================================================
// SECTION: Admin — fast category picker
// РАЗДЕЛ: Поисковый выбор категории с избранным
// ==================================================
"use client";

import { useMemo, useState } from "react";
import {
  createAdminCustomCategory,
  getAdminProductCategories,
  resolveAdminCategoryTitle,
} from "@/components/adminCatalogManager/adminCustomCategories";
import {
  getFavoriteCategoryIds,
  getRecentCategoryIds,
  isCategoryFavorite,
  recordCategoryUse,
  toggleCategoryFavorite,
} from "@/components/adminCatalogManager/adminCategoryPreferences";
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/FastCategoryPicker.module.css";

type FastCategoryPickerProps = {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function buildSections(categories: CatalogCategoryRecord[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  const filtered = normalizedQuery
    ? categories.filter((category) =>
        category.title.toLowerCase().includes(normalizedQuery),
      )
    : categories;

  const favoriteIds = getFavoriteCategoryIds();
  const recentIds = getRecentCategoryIds();

  const favorites = filtered.filter((category) =>
    favoriteIds.includes(category.id),
  );
  const recent = filtered.filter(
    (category) =>
      recentIds.includes(category.id) && !favoriteIds.includes(category.id),
  );
  const rest = filtered.filter(
    (category) =>
      !favoriteIds.includes(category.id) && !recentIds.includes(category.id),
  );

  return { favorites, recent, rest, filtered };
}

export function FastCategoryPicker({
  value,
  onChange,
  error,
}: FastCategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CatalogCategoryRecord[]>(() =>
    getAdminProductCategories(),
  );
  const [favoriteRevision, setFavoriteRevision] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const sections = useMemo(
    () => buildSections(categories.filter((item) => item.isActive), search),
    [categories, search, favoriteRevision],
  );

  const selectedTitle = resolveAdminCategoryTitle(value);

  const refreshCategories = () => {
    setCategories(getAdminProductCategories());
  };

  const selectCategory = (categoryId: string) => {
    recordCategoryUse(categoryId);
    onChange(categoryId);
    setOpen(false);
    setSearch("");
  };

  const handleToggleFavorite = (
    event: React.MouseEvent,
    categoryId: string,
  ) => {
    event.stopPropagation();
    toggleCategoryFavorite(categoryId);
    setFavoriteRevision((current) => current + 1);
  };

  const handleCreate = () => {
    setCreateError(null);

    try {
      const created = createAdminCustomCategory(newTitle);
      refreshCategories();
      selectCategory(created.id);
      setCreateOpen(false);
      setNewTitle("");
    } catch (createFailure) {
      setCreateError(
        createFailure instanceof Error
          ? createFailure.message
          : "Не удалось создать категорию.",
      );
    }
  };

  const renderCategory = (category: CatalogCategoryRecord) => {
    const isActive = category.id === value;
    const favorite = isCategoryFavorite(category.id);

    return (
      <div
        key={category.id}
        className={`${styles.categoryItem} ${isActive ? styles.categoryItemActive : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => selectCategory(category.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectCategory(category.id);
          }
        }}
      >
        <span className={styles.categoryTitle}>{category.title}</span>
        <button
          type="button"
          className={styles.favoriteButton}
          aria-label={favorite ? "Убрать из избранного" : "В избранное"}
          onClick={(event) => handleToggleFavorite(event, category.id)}
        >
          {favorite ? "★" : "☆"}
        </button>
      </div>
    );
  };

  return (
    <>
      <div>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={styles.triggerValue}>{selectedTitle}</span>
          <span className={styles.triggerHint}>Выбрать</span>
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>

      {open ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className={styles.sheet}
            role="dialog"
            aria-label="Выбор категории"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Категория</h2>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                value={search}
                placeholder="Поиск категории"
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.list}>
              {sections.favorites.length > 0 ? (
                <>
                  <p className={styles.sectionLabel}>Избранное</p>
                  {sections.favorites.map(renderCategory)}
                </>
              ) : null}

              {sections.recent.length > 0 ? (
                <>
                  <p className={styles.sectionLabel}>Недавние</p>
                  {sections.recent.map(renderCategory)}
                </>
              ) : null}

              {sections.rest.length > 0 ? (
                <>
                  <p className={styles.sectionLabel}>Все категории</p>
                  {sections.rest.map(renderCategory)}
                </>
              ) : null}

              {sections.filtered.length === 0 ? (
                <p className={styles.error}>Категории не найдены.</p>
              ) : null}

              <button
                type="button"
                className={styles.createButton}
                onClick={() => setCreateOpen(true)}
              >
                + Создать категорию
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {createOpen ? (
        <div
          className={styles.createPopup}
          role="presentation"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className={styles.createCard}
            role="dialog"
            aria-label="Новая категория"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.createTitle}>Новая категория</h3>
            <input
              className={styles.createInput}
              value={newTitle}
              placeholder="Например: Тюльпаны"
              onChange={(event) => setNewTitle(event.target.value)}
              autoFocus
            />
            {createError ? <p className={styles.error}>{createError}</p> : null}
            <div className={styles.createActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setCreateOpen(false);
                  setNewTitle("");
                  setCreateError(null);
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreate}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
