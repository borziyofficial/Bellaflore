// ==================================================
// SECTION: ADMIN APP — Bouquet category field (Stage 2.3.1)
// ==================================================
"use client";

import { useState } from "react";
import type { AdminBouquetCategory } from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type CategoryPanel = "none" | "add" | "edit";

type AdminBouquetCategoryFieldProps = {
  value: string;
  categories: AdminBouquetCategory[];
  onChange: (categoryId: string) => void;
  onCreateCategory: (name: string) => AdminBouquetCategory | null;
  onRenameCategory: (categoryId: string, name: string) => AdminBouquetCategory | null;
};

export function AdminBouquetCategoryField({
  value,
  categories,
  onChange,
  onCreateCategory,
  onRenameCategory,
}: AdminBouquetCategoryFieldProps) {
  const [panel, setPanel] = useState<CategoryPanel>("none");
  const [draftName, setDraftName] = useState("");

  const selectedCategory = categories.find((category) => category.id === value) ?? null;

  const closePanel = () => {
    setPanel("none");
    setDraftName("");
  };

  const openAddPanel = () => {
    setPanel("add");
    setDraftName("");
  };

  const openEditPanel = () => {
    if (!selectedCategory) {
      return;
    }

    setPanel("edit");
    setDraftName(selectedCategory.name);
  };

  const handleSaveAdd = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      return;
    }

    const created = onCreateCategory(trimmed);
    if (created) {
      onChange(created.id);
      closePanel();
    }
  };

  const handleSaveEdit = () => {
    if (!selectedCategory) {
      return;
    }

    const trimmed = draftName.trim();
    if (!trimmed) {
      return;
    }

    const updated = onRenameCategory(selectedCategory.id, trimmed);
    if (updated) {
      closePanel();
    }
  };

  return (
    <div className={styles.categoryBlock}>
      <span className={styles.fieldLabel}>Категория</span>

      <select
        className={styles.fieldInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="">Выберите категорию</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <div className={styles.categoryActions}>
        <button type="button" className={styles.categoryActionButton} onClick={openAddPanel}>
          + Добавить
        </button>
        <button
          type="button"
          className={styles.categoryActionButton}
          onClick={openEditPanel}
          disabled={!selectedCategory}
        >
          Изменить
        </button>
      </div>

      {panel === "add" ? (
        <div className={styles.categoryInlinePanel}>
          <label className={styles.categoryInlineField}>
            <span className={styles.categoryInlineLabel}>Название категории</span>
            <input
              className={styles.fieldInput}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Например, Авторские"
              autoFocus
            />
          </label>
          <div className={styles.categoryInlineActions}>
            <button type="button" className={styles.secondaryButton} onClick={closePanel}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSaveAdd}
              disabled={!draftName.trim()}
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : null}

      {panel === "edit" && selectedCategory ? (
        <div className={styles.categoryInlinePanel}>
          <label className={styles.categoryInlineField}>
            <span className={styles.categoryInlineLabel}>Название категории</span>
            <input
              className={styles.fieldInput}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              autoFocus
            />
          </label>
          <div className={styles.categoryInlineActions}>
            <button type="button" className={styles.secondaryButton} onClick={closePanel}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSaveEdit}
              disabled={!draftName.trim()}
            >
              Сохранить
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
