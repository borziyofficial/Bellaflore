// ==================================================
// SECTION: ADMIN APP — Bouquet media manager (Stage 2.6)
// ==================================================
"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AdminBouquetConfirmDialog } from "@/components/adminApp/modules/bouquets/AdminBouquetConfirmDialog";
import { AdminBouquetImagePreviewModal } from "@/components/adminApp/modules/bouquets/AdminBouquetImagePreviewModal";
import {
  createBouquetImagesFromFiles,
  moveBouquetImage,
  removeBouquetImage,
  reorderBouquetImages,
  setBouquetCoverImage,
} from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import type { BouquetImage } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_ACCEPTED_IMAGE_TYPES,
  BOUQUET_MAX_IMAGES_PER_UPLOAD,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetPhotoUploadProps = {
  images: BouquetImage[];
  onChange: (images: BouquetImage[]) => void;
};

type DeleteConfirmState =
  | { open: false }
  | { open: true; imageId: string; imageName: string };

export function AdminBouquetPhotoUpload({
  images,
  onChange,
}: AdminBouquetPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragImageId, setDragImageId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });

  const sortedImages = useMemo(
    () => [...images].sort((left, right) => left.sortOrder - right.sortOrder),
    [images],
  );

  const processFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const batch = files.slice(0, BOUQUET_MAX_IMAGES_PER_UPLOAD);
    setUploading(true);
    setErrors([]);

    try {
      const result = await createBouquetImagesFromFiles(batch, images);
      onChange(result.images);
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
    } catch {
      setErrors(["Не удалось загрузить фото."]);
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await processFiles(files);
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    await processFiles(files);
  };

  const handleGalleryDragStart = (imageId: string) => {
    setDragImageId(imageId);
  };

  const handleGalleryDrop = (targetId: string) => {
    if (!dragImageId || dragImageId === targetId) {
      setDragImageId(null);
      return;
    }

    const fromIndex = sortedImages.findIndex((image) => image.id === dragImageId);
    const toIndex = sortedImages.findIndex((image) => image.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragImageId(null);
      return;
    }

    onChange(reorderBouquetImages(sortedImages, fromIndex, toIndex));
    setDragImageId(null);
  };

  const requestDelete = (image: BouquetImage) => {
    setDeleteConfirm({
      open: true,
      imageId: image.id,
      imageName: image.name,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.open) {
      return;
    }

    onChange(removeBouquetImage(images, deleteConfirm.imageId));
    setDeleteConfirm({ open: false });
  };

  return (
    <div className={styles.mediaBlock}>
      <div className={styles.photoHeader}>
        <span className={styles.fieldLabel}>Медиатека букета</span>
        <button
          type="button"
          className={styles.photoAddButton}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Загрузка…" : "Выбрать фото"}
        </button>
      </div>

      <div
        className={`${styles.mediaDropZone} ${dragActive ? styles.mediaDropZoneActive : ""}`.trim()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Зона загрузки фото"
      >
        <p className={styles.mediaDropTitle}>Перетащите фото сюда</p>
        <p className={styles.mediaDropHint}>
          JPG, PNG, WebP · до {BOUQUET_MAX_IMAGES_PER_UPLOAD} файлов · макс. 20 МБ
        </p>
      </div>

      <input
        ref={inputRef}
        className={styles.photoInput}
        type="file"
        accept={BOUQUET_ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        onChange={handleSelect}
        aria-label="Загрузить фото букета"
      />

      {errors.length > 0 ? (
        <div className={styles.mediaErrorList}>
          {errors.map((error) => (
            <p key={error} className={styles.photoError}>
              {error}
            </p>
          ))}
        </div>
      ) : null}

      {sortedImages.length === 0 ? (
        <p className={styles.mediaEmptyHint}>Фото не добавлено</p>
      ) : (
        <div className={styles.mediaGallery}>
          {sortedImages.map((image, index) => (
            <article
              key={image.id}
              className={`${styles.mediaGalleryItem} ${dragImageId === image.id ? styles.mediaGalleryItemDragging : ""}`.trim()}
              draggable
              onDragStart={() => handleGalleryDragStart(image.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleGalleryDrop(image.id)}
              onDragEnd={() => setDragImageId(null)}
            >
              <button
                type="button"
                className={styles.mediaThumbButton}
                onClick={() => setPreviewId(image.id)}
                aria-label={`Открыть ${image.name}`}
              >
                <div className={styles.photoThumbWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.name} className={styles.photoThumb} />
                  {image.isCover ? (
                    <span className={styles.photoCoverBadge}>Главная</span>
                  ) : null}
                </div>
              </button>

              <p className={styles.photoName} title={image.name}>
                {image.name}
              </p>

              <div className={styles.mediaItemControls}>
                <button
                  type="button"
                  className={styles.mediaMoveButton}
                  onClick={() => onChange(moveBouquetImage(sortedImages, image.id, "left"))}
                  disabled={index === 0}
                  aria-label="Сдвинуть влево"
                >
                  ←
                </button>
                <button
                  type="button"
                  className={styles.mediaMoveButton}
                  onClick={() => onChange(moveBouquetImage(sortedImages, image.id, "right"))}
                  disabled={index === sortedImages.length - 1}
                  aria-label="Сдвинуть вправо"
                >
                  →
                </button>
              </div>

              <div className={styles.photoActions}>
                {!image.isCover ? (
                  <button
                    type="button"
                    className={styles.photoActionButton}
                    onClick={() => onChange(setBouquetCoverImage(images, image.id))}
                  >
                    ★ Сделать главной
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
                  onClick={() => requestDelete(image)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminBouquetImagePreviewModal
        open={previewId !== null}
        images={sortedImages}
        activeId={previewId}
        onClose={() => setPreviewId(null)}
        onChangeActive={setPreviewId}
      />

      {deleteConfirm.open ? (
        <AdminBouquetConfirmDialog
          open
          title="Удалить фото?"
          message={`«${deleteConfirm.imageName}» будет удалено из букета. Сам букет не удаляется.`}
          confirmLabel="Удалить"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ open: false })}
        />
      ) : null}
    </div>
  );
}
