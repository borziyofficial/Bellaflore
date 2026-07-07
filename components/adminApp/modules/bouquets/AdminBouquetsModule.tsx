// ==================================================
// SECTION: ADMIN APP — Bouquets module (Stage 2.2)
// ==================================================
"use client";

import { useMemo, useState } from "react";
import { useAdminBouquetCategories } from "@/components/adminApp/modules/bouquets/useAdminBouquetCategories";
import { AdminBouquetForm } from "@/components/adminApp/modules/bouquets/AdminBouquetForm";
import { AdminBouquetList } from "@/components/adminApp/modules/bouquets/AdminBouquetList";
import { getAdminBouquetDraftById } from "@/components/adminApp/modules/bouquets/bouquetStore";
import type { BouquetDraft, BouquetStatus } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_STATUS_LABELS } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { useAdminBouquets } from "@/components/adminApp/modules/bouquets/useAdminBouquets";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; id: string };

const STATUS_FILTER_OPTIONS: Array<{ value: "all" | BouquetStatus; label: string }> = [
  { value: "all", label: "Все статусы" },
  { value: "draft", label: BOUQUET_STATUS_LABELS.draft },
  { value: "active", label: BOUQUET_STATUS_LABELS.active },
  { value: "hidden", label: BOUQUET_STATUS_LABELS.hidden },
];

export function AdminBouquetsModule() {
  const { bouquets, ready, saveBouquet, duplicateBouquet, hideBouquet, removeBouquet } =
    useAdminBouquets();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | BouquetStatus>("all");
  const [formState, setFormState] = useState<FormState>({ open: false });

  const { categories } = useAdminBouquetCategories();

  const filteredBouquets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bouquets.filter((bouquet) => {
      const matchesSearch =
        !query ||
        bouquet.name.toLowerCase().includes(query) ||
        bouquet.description.toLowerCase().includes(query) ||
        bouquet.slug.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || bouquet.category === categoryFilter;

      const matchesStatus = statusFilter === "all" || bouquet.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [bouquets, search, categoryFilter, statusFilter]);

  const editingDraft =
    formState.open && formState.mode === "edit"
      ? getAdminBouquetDraftById(bouquets, formState.id)
      : null;

  const closeForm = () => setFormState({ open: false });

  const handleSave = (draft: BouquetDraft) => {
    if (formState.open && formState.mode === "edit") {
      saveBouquet(draft, formState.id);
    } else {
      saveBouquet(draft);
    }

    closeForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Удалить букет из локального списка?")) {
      removeBouquet(id);
    }
  };

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Букеты"
        subtitle="Каталог букетов — название, категория, фото, базовая цена, статус"
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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

          <div className={styles.filterRow}>
            <select
              className={styles.filterSelect}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Фильтр по категории"
            >
              <option value="all">Категория — все</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | BouquetStatus)
              }
              aria-label="Фильтр по статусу"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Статус — {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Список букетов">
        {!ready ? (
          <div className={styles.loadingState}>Загрузка букетов…</div>
        ) : filteredBouquets.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Букетов пока нет</p>
            <p className={styles.emptyHint}>
              {bouquets.length === 0
                ? "Создайте первый букет через «Добавить букет». Размеры S / M / L / XL появятся на следующем этапе."
                : "Нет букетов по текущему поиску или фильтрам."}
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
            onEdit={(id) => setFormState({ open: true, mode: "edit", id })}
            onDuplicate={duplicateBouquet}
            onHide={hideBouquet}
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
    </div>
  );
}
