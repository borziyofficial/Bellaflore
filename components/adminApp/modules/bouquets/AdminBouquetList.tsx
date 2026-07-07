// ==================================================
// SECTION: ADMIN APP — Bouquet list (Stage 2.5)
// ==================================================
"use client";

import { resolveAdminBouquetCategoryName } from "@/components/adminApp/modules/bouquets/bouquetCategoryStore";
import { getBouquetCoverImage } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  formatBouquetSizeSummary,
  resolveBouquetBadgeLabel,
  resolveBouquetVisibilitySummary,
} from "@/components/adminApp/modules/bouquets/bouquetListUtils";
import type { BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_NO_PHOTO_LABEL,
  BOUQUET_STATUS_LABELS,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { formatBouquetPrice } from "@/components/adminApp/modules/bouquets/bouquetUtils";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetListProps = {
  bouquets: BouquetRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onEdit: (id: string) => void;
  onActivate: (id: string) => void;
  onHide: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function BouquetPreview({
  bouquet,
  variant = "card",
}: {
  bouquet: BouquetRecord;
  variant?: "card" | "table";
}) {
  const cover = getBouquetCoverImage(bouquet.images);
  const previewClass =
    variant === "table" ? `${styles.imagePreview} ${styles.imagePreviewTable}` : styles.imagePreview;

  if (cover) {
    return (
      <div className={previewClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover.url} alt={cover.name} className={styles.imagePreviewImg} />
      </div>
    );
  }

  return (
    <div className={previewClass}>
      <span className={styles.imagePlaceholder}>{BOUQUET_NO_PHOTO_LABEL}</span>
    </div>
  );
}

function BouquetSummaryMeta({ bouquet }: { bouquet: BouquetRecord }) {
  const sizeSummary = formatBouquetSizeSummary(bouquet);
  const visibility = resolveBouquetVisibilitySummary(bouquet);
  const badgeLabel = resolveBouquetBadgeLabel(bouquet.badge);

  return (
    <div className={styles.cardSummaryRow}>
      <span className={styles.cardSummaryItem}>Размеры: {sizeSummary}</span>
      <span className={styles.cardSummaryItem}>Приоритет: {bouquet.displayPriority}</span>
      {badgeLabel ? (
        <span className={`${styles.miniBadge} ${styles.miniBadgeGold}`}>{badgeLabel}</span>
      ) : null}
      {visibility.map((label) => (
        <span key={label} className={styles.miniBadge}>
          {label}
        </span>
      ))}
    </div>
  );
}

function BouquetQuickActions({
  bouquet,
  onActivate,
  onHide,
  onDuplicate,
  onDelete,
}: {
  bouquet: BouquetRecord;
  onActivate: (id: string) => void;
  onHide: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles.rowActions}>
      {bouquet.status !== "active" ? (
        <button
          type="button"
          className={styles.actionChip}
          onClick={() => onActivate(bouquet.id)}
        >
          Активировать
        </button>
      ) : null}
      {bouquet.status !== "hidden" ? (
        <button type="button" className={styles.actionChip} onClick={() => onHide(bouquet.id)}>
          Скрыть
        </button>
      ) : null}
      <button type="button" className={styles.actionChip} onClick={() => onDuplicate(bouquet.id)}>
        Дублировать
      </button>
      <button
        type="button"
        className={`${styles.actionChip} ${styles.actionChipDanger}`}
        onClick={() => onDelete(bouquet.id)}
      >
        Удалить
      </button>
    </div>
  );
}

export function AdminBouquetList({
  bouquets,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onEdit,
  onActivate,
  onHide,
  onDuplicate,
  onDelete,
}: AdminBouquetListProps) {
  return (
    <>
      <div className={styles.cardList}>
        {bouquets.map((bouquet) => {
          const isSelected = selectedIds.has(bouquet.id);

          return (
            <article
              key={bouquet.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`.trim()}
            >
              <label className={styles.cardSelect}>
                <input
                  className={styles.cardCheckbox}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(bouquet.id)}
                  aria-label={`Выбрать ${bouquet.name}`}
                />
              </label>
              <button
                type="button"
                className={styles.cardMediaButton}
                onClick={() => onEdit(bouquet.id)}
                aria-label={`Редактировать ${bouquet.name}`}
              >
                <BouquetPreview bouquet={bouquet} />
              </button>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <button
                    type="button"
                    className={styles.cardTitleButton}
                    onClick={() => onEdit(bouquet.id)}
                  >
                    <h4 className={styles.cardTitle}>{bouquet.name}</h4>
                  </button>
                  <span
                    className={`${styles.statusBadge} ${styles[`status_${bouquet.status}`]}`}
                  >
                    {BOUQUET_STATUS_LABELS[bouquet.status]}
                  </span>
                </div>
                <p className={styles.cardMeta}>
                  {resolveAdminBouquetCategoryName(bouquet.category)}
                </p>
                <p className={styles.cardPrice}>{formatBouquetPrice(bouquet.basePrice)}</p>
                <BouquetSummaryMeta bouquet={bouquet} />
                <BouquetQuickActions
                  bouquet={bouquet}
                  onActivate={onActivate}
                  onHide={onHide}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.tableCheckboxCol}>
                <input
                  className={styles.cardCheckbox}
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Выбрать все"
                />
              </th>
              <th scope="col">Фото</th>
              <th scope="col">Название</th>
              <th scope="col">Категория</th>
              <th scope="col">Цена</th>
              <th scope="col">Размеры</th>
              <th scope="col">Статус</th>
              <th scope="col">Бейдж</th>
              <th scope="col">Приоритет</th>
              <th scope="col">Показ</th>
              <th scope="col">Действия</th>
            </tr>
          </thead>
          <tbody>
            {bouquets.map((bouquet) => {
              const isSelected = selectedIds.has(bouquet.id);
              const badgeLabel = resolveBouquetBadgeLabel(bouquet.badge);
              const visibility = resolveBouquetVisibilitySummary(bouquet);

              return (
                <tr key={bouquet.id} className={isSelected ? styles.tableRowSelected : undefined}>
                  <td>
                    <input
                      className={styles.cardCheckbox}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(bouquet.id)}
                      aria-label={`Выбрать ${bouquet.name}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.tableMediaButton}
                      onClick={() => onEdit(bouquet.id)}
                    >
                      <BouquetPreview bouquet={bouquet} variant="table" />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.tableNameButton}
                      onClick={() => onEdit(bouquet.id)}
                    >
                      <div className={styles.tableName}>{bouquet.name}</div>
                    </button>
                  </td>
                  <td>{resolveAdminBouquetCategoryName(bouquet.category)}</td>
                  <td>{formatBouquetPrice(bouquet.basePrice)}</td>
                  <td>{formatBouquetSizeSummary(bouquet)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${bouquet.status}`]}`}
                    >
                      {BOUQUET_STATUS_LABELS[bouquet.status]}
                    </span>
                  </td>
                  <td>{badgeLabel || "—"}</td>
                  <td>{bouquet.displayPriority}</td>
                  <td>{visibility.length > 0 ? visibility.join(", ") : "—"}</td>
                  <td>
                    <BouquetQuickActions
                      bouquet={bouquet}
                      onActivate={onActivate}
                      onHide={onHide}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
