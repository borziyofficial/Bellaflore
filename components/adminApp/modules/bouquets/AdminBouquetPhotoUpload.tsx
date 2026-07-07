// ==================================================
// SECTION: ADMIN APP — Bouquet photo upload (Stage 2.2)
// ==================================================
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  createBouquetImagesFromFiles,
  removeBouquetImage,
  setBouquetCoverImage,
} from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import type { BouquetImage } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_ACCEPTED_IMAGE_TYPES } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetPhotoUploadProps = {
  images: BouquetImage[];
  onChange: (images: BouquetImage[]) => void;
};

export function AdminBouquetPhotoUpload({
  images,
  onChange,
}: AdminBouquetPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const next = await createBouquetImagesFromFiles(files, images);
      if (next.length === images.length) {
        setError("Поддерживаются только JPG, PNG и WebP.");
        return;
      }

      onChange(next);
    } catch {
      setError("Не удалось загрузить фото.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.photoBlock}>
      <div className={styles.photoHeader}>
        <span className={styles.fieldLabel}>Фото букета</span>
        <button
          type="button"
          className={styles.photoAddButton}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Загрузка…" : "Добавить фото"}
        </button>
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

      {error ? <p className={styles.photoError}>{error}</p> : null}

      {images.length === 0 ? (
        <div className={styles.photoEmpty}>Фото не добавлено</div>
      ) : (
        <div className={styles.photoGrid}>
          {images.map((image) => (
            <article key={image.id} className={styles.photoItem}>
              <div className={styles.photoThumbWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className={styles.photoThumb}
                />
                {image.isCover ? (
                  <span className={styles.photoCoverBadge}>Обложка</span>
                ) : null}
              </div>

              <p className={styles.photoName} title={image.name}>
                {image.name}
              </p>

              <div className={styles.photoActions}>
                {!image.isCover ? (
                  <button
                    type="button"
                    className={styles.photoActionButton}
                    onClick={() => onChange(setBouquetCoverImage(images, image.id))}
                  >
                    Сделать обложкой
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
                  onClick={() => onChange(removeBouquetImage(images, image.id))}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
