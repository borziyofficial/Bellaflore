// ==================================================
// SECTION: Admin Catalog Manager — image upload foundation
// РАЗДЕЛ: Загрузка изображений (foundation)
// ==================================================
"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import styles from "@/components/adminCatalogManager/AdminCatalogManager.module.css";

const UPLOAD_ENDPOINT = "/api/admin/products/upload-image";

type AdminProductImageUploadProps = {
  mainImageUrl: string;
  mainImageAlt: string;
  mainImageTemporary: boolean;
  galleryUrls: string[];
  onMainImageChange: (url: string, temporary: boolean) => void;
  onMainImageAltChange: (alt: string) => void;
  onGalleryChange: (urls: string[]) => void;
};

async function uploadImageFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { imageUrl?: string };
    return payload.imageUrl ?? null;
  } catch {
    return null;
  }
}

export function AdminProductImageUpload({
  mainImageUrl,
  mainImageAlt,
  mainImageTemporary,
  galleryUrls,
  onMainImageChange,
  onMainImageAltChange,
  onGalleryChange,
}: AdminProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setUploadNote("Выберите файл изображения (JPEG, PNG, WebP).");
      return;
    }

    setUploadNote("Загрузка…");

    const uploadedUrl = await uploadImageFile(file);
    if (uploadedUrl) {
      onMainImageChange(uploadedUrl, false);
      setUploadNote("Изображение загружено на сервер.");
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    onMainImageChange(blobUrl, true);
    setUploadNote(
      "Временное превью в браузере. Файл не сохранён на сервере — загрузите снова перед публикацией.",
    );
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const addGallerySlot = () => {
    if (galleryUrls.length >= 3) {
      return;
    }

    onGalleryChange([...galleryUrls, ""]);
  };

  return (
    <section className={styles.card} aria-label="Изображения товара">
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Изображения</h3>
        <p className={styles.cardHint}>
          Главное фото и галерея. Без изображения показывается fallback.
        </p>
      </div>

      <div
        className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p className={styles.uploadTitle}>Перетащите фото сюда</p>
        <p className={styles.uploadHint}>или выберите файл с устройства</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файл
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className={styles.hiddenInput}
          onChange={onInputChange}
        />
      </div>

      {uploadNote ? <p className={styles.note}>{uploadNote}</p> : null}

      <div className={styles.imagePreviewGrid}>
        <div className={styles.imagePreviewCard}>
          <p className={styles.imagePreviewLabel}>Главное фото</p>
          <div className={styles.imagePreviewFrame}>
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={mainImageAlt || "Превью товара"}
                fill
                sizes="200px"
                className={styles.imagePreviewMedia}
                unoptimized={mainImageTemporary || mainImageUrl.startsWith("blob:")}
              />
            ) : (
              <div className={styles.imageFallback}>Нет изображения</div>
            )}
          </div>
          {mainImageTemporary ? (
            <span className={styles.tempBadge}>Временное</span>
          ) : null}
        </div>

        <div className={styles.galleryColumn}>
          <div className={styles.galleryHeader}>
            <p className={styles.imagePreviewLabel}>Галерея (placeholder)</p>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={addGallerySlot}
              disabled={galleryUrls.length >= 3}
            >
              + Слот
            </button>
          </div>
          <div className={styles.galleryGrid}>
            {(galleryUrls.length ? galleryUrls : [""]).map((url, index) => (
              <div key={`gallery-${index}`} className={styles.gallerySlot}>
                {url ? (
                  <Image
                    src={url}
                    alt={`Галерея ${index + 1}`}
                    fill
                    sizes="120px"
                    className={styles.imagePreviewMedia}
                    unoptimized={url.startsWith("blob:")}
                  />
                ) : (
                  <span className={styles.galleryPlaceholder}>Слот {index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Alt-текст главного фото</span>
        <input
          className={styles.input}
          value={mainImageAlt}
          onChange={(event) => onMainImageAltChange(event.target.value)}
          placeholder="Букет Velvet Rose — Bellaflore"
        />
      </label>
    </section>
  );
}
