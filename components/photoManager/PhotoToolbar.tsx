"use client";

import { useRef } from "react";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import styles from "@/components/photoManager/PhotoToolbar.module.css";

export function PhotoToolbar() {
  const { uploadFiles, photos } = usePhotoManager();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.photoToolbar}>
      <input
        ref={inputRef}
        type="file"
        className={styles.fileInput}
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          if (event.target.files) {
            uploadFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
      <button
        type="button"
        className={styles.uploadButton}
        onClick={() => inputRef.current?.click()}
      >
        ➕ Загрузить фото
      </button>
      <p className={styles.toolbarNote}>
        Локальный upload · {photos.length} фото · без API и БД
      </p>
    </div>
  );
}
