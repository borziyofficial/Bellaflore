// ==================================================
// SECTION: Admin — fast photo upload
// РАЗДЕЛ: Фото первым: drag/drop, preview, действия
// ==================================================
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  fileToDataUrl,
  persistProductImageFile,
  shouldUseUnoptimizedImage,
} from "@/components/adminCatalogManager/adminImagePersistence";
import { cropImageToPortraitBlob } from "@/components/adminCatalogManager/fastPhotoCrop";
import styles from "@/components/adminCatalogManager/FastPhotoUpload.module.css";

type FastPhotoUploadProps = {
  imageUrl: string;
  imageAlt: string;
  onImageChange: (patch: {
    mainImageUrl: string;
    mainImageStorage: "none" | "server" | "blob";
    mainImageTemporary: boolean;
  }) => void;
  onAiSuggest: () => void;
  isAiLoading?: boolean;
  error?: string;
};

export function FastPhotoUpload({
  imageUrl,
  imageAlt,
  onImageChange,
  onAiSuggest,
  isAiLoading = false,
  error,
}: FastPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setNote("Выберите изображение (JPEG, PNG, WebP).");
      return;
    }

    setNote(null);
    setIsUploading(true);

    try {
      const instantPreview = await fileToDataUrl(file);
      onImageChange({
        mainImageUrl: instantPreview,
        mainImageTemporary: true,
        mainImageStorage: "none",
      });

      const persisted = await persistProductImageFile(file);
      onImageChange({
        mainImageUrl: persisted.url,
        mainImageStorage: persisted.storage,
        mainImageTemporary: false,
      });
      setNote("Фото загружено.");
    } catch (uploadError) {
      setNote(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить изображение.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCrop = async () => {
    if (!imageUrl) {
      return;
    }

    setIsCropping(true);
    setNote(null);

    try {
      const croppedBlob = await cropImageToPortraitBlob(imageUrl);
      const croppedFile = new File([croppedBlob], "cropped-bouquet.jpg", {
        type: "image/jpeg",
      });
      await handleFile(croppedFile);
      setNote("Фото обрезано 4:5.");
    } catch (cropError) {
      setNote(
        cropError instanceof Error
          ? cropError.message
          : "Не удалось обрезать фото.",
      );
    } finally {
      setIsCropping(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <section className={styles.section} aria-label="Фото товара">
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""} ${
          imageUrl ? styles.dropzoneFilled : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!imageUrl) {
            inputRef.current?.click();
          }
        }}
        role={imageUrl ? undefined : "button"}
        tabIndex={imageUrl ? undefined : 0}
        onKeyDown={(event) => {
          if (!imageUrl && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={imageAlt || "Фото товара"}
              fill
              sizes="(max-width: 560px) 100vw, 400px"
              className={styles.photoImage}
              unoptimized={shouldUseUnoptimizedImage(imageUrl)}
              priority
            />
            {isUploading ? <span className={styles.uploadBadge}>Загрузка…</span> : null}
          </>
        ) : (
          <div className={styles.photoEmpty}>
            <p className={styles.photoEmptyTitle}>Добавьте фото букета</p>
            <p className={styles.photoEmptyHint}>
              Нажмите или перетащите изображение сюда
            </p>
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolButton} ${styles.toolButtonPrimary}`}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || isCropping}
        >
          {isUploading ? "Загрузка…" : imageUrl ? "Заменить" : "Загрузить фото"}
        </button>

        {imageUrl ? (
          <>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => void handleCrop()}
              disabled={isUploading || isCropping}
            >
              {isCropping ? "Обрезка…" : "Обрезать"}
            </button>
            <button
              type="button"
              className={styles.toolButton}
              onClick={() => {
                onImageChange({
                  mainImageUrl: "",
                  mainImageStorage: "none",
                  mainImageTemporary: false,
                });
                setNote(null);
              }}
              disabled={isUploading || isCropping}
            >
              Удалить
            </button>
            <button
              type="button"
              className={`${styles.toolButton} ${styles.toolButtonAi}`}
              onClick={onAiSuggest}
              disabled={isAiLoading || isUploading || isCropping}
            >
              {isAiLoading ? "AI…" : "✨ AI Suggest"}
            </button>
          </>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={styles.hiddenInput}
        onChange={(event) => {
          void handleFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      {error ? <p className={styles.error}>{error}</p> : null}
      {note ? <p className={styles.note}>{note}</p> : null}
    </section>
  );
}
