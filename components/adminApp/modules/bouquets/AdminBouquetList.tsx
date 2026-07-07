// ==================================================
// SECTION: ADMIN APP — Bouquet list (Stage 2.2)
// ==================================================
"use client";

import { getAllCatalogCategories } from "@/components/catalogEngine/categoriesEngine";
import { getBouquetCoverImage } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import type { BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_NO_PHOTO_LABEL,
  BOUQUET_STATUS_LABELS,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { formatBouquetPrice } from "@/components/adminApp/modules/bouquets/bouquetUtils";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetListProps = {
  bouquets: BouquetRecord[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
};

function resolveCategoryTitle(categoryId: string): string {
  const categories = getAllCatalogCategories();
  return categories.find((category) => category.id === categoryId)?.title ?? categoryId;
}

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

function BouquetActions({
  bouquetId,
  onEdit,
  onDuplicate,
  onHide,
  onDelete,
}: {
  bouquetId: string;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.actionChip} onClick={() => onEdit(bouquetId)}>
        Изменить
      </button>
      <button
        type="button"
        className={styles.actionChip}
        onClick={() => onDuplicate(bouquetId)}
      >
        Дублировать
      </button>
      <button type="button" className={styles.actionChip} onClick={() => onHide(bouquetId)}>
        Скрыть
      </button>
      <button
        type="button"
        className={`${styles.actionChip} ${styles.actionChipDanger}`}
        onClick={() => onDelete(bouquetId)}
      >
        Удалить
      </button>
    </div>
  );
}

export function AdminBouquetList({
  bouquets,
  onEdit,
  onDuplicate,
  onHide,
  onDelete,
}: AdminBouquetListProps) {
  return (
    <>
      <div className={styles.cardList}>
        {bouquets.map((bouquet) => (
          <article key={bouquet.id} className={styles.card}>
            <BouquetPreview bouquet={bouquet} />
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <h4 className={styles.cardTitle}>{bouquet.name}</h4>
                <span className={`${styles.statusBadge} ${styles[`status_${bouquet.status}`]}`}>
                  {BOUQUET_STATUS_LABELS[bouquet.status]}
                </span>
              </div>
              <p className={styles.cardMeta}>{resolveCategoryTitle(bouquet.category)}</p>
              <p className={styles.cardPrice}>{formatBouquetPrice(bouquet.basePrice)}</p>
              {bouquet.description ? (
                <p className={styles.cardDescription}>{bouquet.description}</p>
              ) : null}
              <BouquetActions
                bouquetId={bouquet.id}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onHide={onHide}
                onDelete={onDelete}
              />
            </div>
          </article>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Фото</th>
              <th scope="col">Название</th>
              <th scope="col">Категория</th>
              <th scope="col">Базовая цена</th>
              <th scope="col">Статус</th>
              <th scope="col">Действия</th>
            </tr>
          </thead>
          <tbody>
            {bouquets.map((bouquet) => (
              <tr key={bouquet.id}>
                <td>
                  <BouquetPreview bouquet={bouquet} variant="table" />
                </td>
                <td>
                  <div className={styles.tableName}>{bouquet.name}</div>
                  {bouquet.description ? (
                    <div className={styles.tableDescription}>{bouquet.description}</div>
                  ) : null}
                </td>
                <td>{resolveCategoryTitle(bouquet.category)}</td>
                <td>{formatBouquetPrice(bouquet.basePrice)}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${styles[`status_${bouquet.status}`]}`}
                  >
                    {BOUQUET_STATUS_LABELS[bouquet.status]}
                  </span>
                </td>
                <td>
                  <BouquetActions
                    bouquetId={bouquet.id}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onHide={onHide}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
