"use client";

import type { PhotoUploadItem } from "@/components/photoManager/photoManagerTypes";
import styles from "@/components/photoManager/PhotoCard.module.css";

type PhotoCardProps = {
  photo: PhotoUploadItem;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (photoId: string) => void;
  onSetMain: (photoId: string) => void;
  onEditSeo: (photoId: string) => void;
  onRemove: (photoId: string) => void;
  onMoveUp: (photoId: string) => void;
  onMoveDown: (photoId: string) => void;
};

export function PhotoCard({
  photo,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onSetMain,
  onEditSeo,
  onRemove,
  onMoveUp,
  onMoveDown,
}: PhotoCardProps) {
  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
      onClick={() => onSelect(photo.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(photo.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Фото ${photo.photoNumber}: ${photo.fileName}`}
    >
      {photo.objectUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */
        <img
          src={photo.objectUrl}
          alt={photo.seo.imageAlt || photo.fileName}
          className={styles.image}
        />
      ) : (
        <div className={styles.imagePlaceholder} aria-hidden="true">
          {photo.placeholderLabel || "placeholder · фото"}
        </div>
      )}
      <div className={styles.headerRow}>
        <p className={styles.photoNumber}>№ {photo.photoNumber}</p>
        {photo.isMain ? <p className={styles.mainBadge}>Главное фото</p> : null}
      </div>
      <p className={styles.fileName}>{photo.fileName}</p>
      <p className={styles.fileMeta}>
        {photo.fileSizeLabel} · {photo.fileFormat}
      </p>
      <div
        className={styles.actionRow}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onSetMain(photo.id)}
          disabled={photo.isMain}
        >
          ⭐ Сделать главным
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onEditSeo(photo.id)}
        >
          🖊 Редактировать SEO
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
          onClick={() => onRemove(photo.id)}
        >
          🗑 Удалить
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onMoveUp(photo.id)}
          disabled={isFirst}
        >
          ⬆️ Вверх
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onMoveDown(photo.id)}
          disabled={isLast}
        >
          ⬇️ Вниз
        </button>
      </div>
    </article>
  );
}
