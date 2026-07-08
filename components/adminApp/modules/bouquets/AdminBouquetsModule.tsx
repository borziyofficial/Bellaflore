// ==================================================
// SECTION: ADMIN APP — Bouquets module (Stage 2.5)
// ==================================================
"use client";

import { useMemo, useState } from "react";
import { AdminBouquetConfirmDialog } from "@/components/adminApp/modules/bouquets/AdminBouquetConfirmDialog";
import { AdminBouquetForm } from "@/components/adminApp/modules/bouquets/AdminBouquetForm";
import { AdminBouquetList } from "@/components/adminApp/modules/bouquets/AdminBouquetList";
import {
  applyBouquetListQuery,
  BOUQUET_BADGE_FILTER_OPTIONS,
  BOUQUET_DISPLAY_FILTER_OPTIONS,
  BOUQUET_SORT_OPTIONS,
  BOUQUET_STATUS_FILTER_OPTIONS,
  DEFAULT_BOUQUET_LIST_FILTERS,
  hasActiveBouquetListFilters,
  type BouquetBadgeFilter,
  type BouquetDisplayFilter,
  type BouquetListFilters,
  type BouquetSortOption,
} from "@/components/adminApp/modules/bouquets/bouquetListUtils";
import { getBouquetDraftById } from "@/lib/bouquetRepository";
import type { BouquetDraft, BouquetStatus } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { useAdminBouquetCategories } from "@/components/adminApp/modules/bouquets/useAdminBouquetCategories";
import { useAdminBouquets } from "@/components/adminApp/modules/bouquets/useAdminBouquets";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; id: string };

type ConfirmState =
  | { open: false }
  | { open: true; title: string; message: string; confirmLabel: string; onConfirm: () => void };

export function AdminBouquetsModule() {
  const {
    bouquets,
    ready,
    saveBouquet,
    duplicateBouquet,
    hideBouquet,
    activateBouquet,
    bulkSetStatus,
    removeBouquet,
    bulkRemoveBouquets,
  } = useAdminBouquets();
  const [filters, setFilters] = useState<BouquetListFilters>(DEFAULT_BOUQUET_LIST_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false });

  const { categories } = useAdminBouquetCategories();

  const filteredBouquets = useMemo(
    () => applyBouquetListQuery(bouquets, filters),
    [bouquets, filters],
  );

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    filteredBouquets.length > 0 &&
    filteredBouquets.every((bouquet) => selectedIds.has(bouquet.id));
  const hasFilters = hasActiveBouquetListFilters(filters);
  const isFilteredEmpty = bouquets.length > 0 && filteredBouquets.length === 0;

  const editingDraft =
    formState.open && formState.mode === "edit"
      ? getBouquetDraftById(bouquets, formState.id)
      : null;

  const updateFilter = <K extends keyof BouquetListFilters>(
    key: K,
    value: BouquetListFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setFilters(DEFAULT_BOUQUET_LIST_FILTERS);
    setSelectedIds(new Set());
  };

  const closeForm = () => setFormState({ open: false });

  const closeConfirm = () => setConfirmState({ open: false });

  const openDeleteConfirm = (ids: string[], title: string, message: string) => {
    setConfirmState({
      open: true,
      title,
      message,
      confirmLabel: "Удалить",
      onConfirm: () => {
        bulkRemoveBouquets(ids);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        closeConfirm();
      },
    });
  };

  const handleSave = (draft: BouquetDraft) => {
    if (formState.open && formState.mode === "edit") {
      saveBouquet(draft, formState.id);
    } else {
      saveBouquet(draft);
    }

    closeForm();
  };

  const handleDelete = (id: string) => {
    openDeleteConfirm(
      [id],
      "Удалить букет?",
      "Букет будет удалён из списка. Это действие нельзя отменить.",
    );
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }

    openDeleteConfirm(
      ids,
      `Удалить ${ids.length} букет(ов)?`,
      "Выбранные букеты будут удалены из списка. Это действие нельзя отменить.",
    );
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredBouquets.forEach((bouquet) => next.delete(bouquet.id));
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredBouquets.forEach((bouquet) => next.add(bouquet.id));
      return next;
    });
  };

  const handleBulkStatus = (status: BouquetStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }

    bulkSetStatus(ids, status);
    setSelectedIds(new Set());
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Букеты"
        subtitle="Управление списком — фильтры, сортировка, быстрые и массовые действия"
        action={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormState({ open: true, mode: "create" })}
            >
              Добавить букет
            </button>
          </div>
        }
      />

      <AdminPanel>
        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Поиск букетов"
              aria-label="Поиск букетов"
            />
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormState({ open: true, mode: "create" })}
            >
              Добавить букет
            </button>
          </div>

          <div className={styles.filterGrid}>
            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Статус</span>
              <select
                className={styles.filterSelect}
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value as BouquetListFilters["status"])
                }
                aria-label="Фильтр по статусу"
              >
                {BOUQUET_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Категория</span>
              <select
                className={styles.filterSelect}
                value={filters.category}
                onChange={(event) => updateFilter("category", event.target.value)}
                aria-label="Фильтр по категории"
              >
                <option value="all">Все</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Бейдж</span>
              <select
                className={styles.filterSelect}
                value={filters.badge}
                onChange={(event) =>
                  updateFilter("badge", event.target.value as BouquetBadgeFilter)
                }
                aria-label="Фильтр по бейджу"
              >
                {BOUQUET_BADGE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Отображение</span>
              <select
                className={styles.filterSelect}
                value={filters.display}
                onChange={(event) =>
                  updateFilter("display", event.target.value as BouquetDisplayFilter)
                }
                aria-label="Фильтр по отображению"
              >
                {BOUQUET_DISPLAY_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Сортировка</span>
            <select
              className={styles.filterSelect}
              value={filters.sort}
              onChange={(event) =>
                updateFilter("sort", event.target.value as BouquetSortOption)
              }
              aria-label="Сортировка букетов"
            >
              {BOUQUET_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </AdminPanel>

      {selectedCount > 0 ? (
        <div className={styles.bulkBar}>
          <div className={styles.bulkBarMain}>
            <span className={styles.bulkCount}>Выбрано: {selectedCount}</span>
            <button type="button" className={styles.bulkClear} onClick={clearSelection}>
              Снять выбор
            </button>
          </div>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.actionChip}
              onClick={() => handleBulkStatus("active")}
            >
              Активировать
            </button>
            <button
              type="button"
              className={styles.actionChip}
              onClick={() => handleBulkStatus("hidden")}
            >
              Скрыть
            </button>
            <button
              type="button"
              className={styles.actionChip}
              onClick={() => handleBulkStatus("draft")}
            >
              В черновик
            </button>
            <button
              type="button"
              className={`${styles.actionChip} ${styles.actionChipDanger}`}
              onClick={handleBulkDelete}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : null}

      <AdminPanel title="Список букетов">
        {!ready ? (
          <div className={styles.loadingState}>Загрузка букетов…</div>
        ) : isFilteredEmpty ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Ничего не найдено</p>
            <p className={styles.emptyHint}>
              По текущим фильтрам букеты не найдены. Измените условия или сбросьте фильтры.
            </p>
            {hasFilters ? (
              <button type="button" className={styles.primaryButton} onClick={resetFilters}>
                Сбросить фильтры
              </button>
            ) : null}
          </div>
        ) : bouquets.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Букетов пока нет</p>
            <p className={styles.emptyHint}>
              Создайте первый букет через «Добавить букет».
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormState({ open: true, mode: "create" })}
            >
              Добавить букет
            </button>
          </div>
        ) : (
          <AdminBouquetList
            bouquets={filteredBouquets}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allSelected={allVisibleSelected}
            categories={categories}
            onEdit={(id) => setFormState({ open: true, mode: "edit", id })}
            onActivate={activateBouquet}
            onHide={hideBouquet}
            onDuplicate={duplicateBouquet}
            onDelete={handleDelete}
          />
        )}
      </AdminPanel>

      <AdminBouquetForm
        open={formState.open}
        mode={formState.open && formState.mode === "edit" ? "edit" : "create"}
        initialDraft={editingDraft}
        onSave={handleSave}
        onCancel={closeForm}
      />

      {confirmState.open ? (
        <AdminBouquetConfirmDialog
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
        />
      ) : null}
    </div>
  );
}
