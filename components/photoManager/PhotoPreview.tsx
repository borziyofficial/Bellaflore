"use client";

import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import styles from "@/components/photoManager/PhotoPreview.module.css";

export function PhotoPreview() {
  const { selectedPhoto, mainPhoto } = usePhotoManager();
  const previewPhoto = selectedPhoto ?? mainPhoto;

  return (
    <aside className={styles.previewPanel} aria-label="Предпросмотр фотографии">
      <h4 className={styles.previewTitle}>Предпросмотр</h4>
      <div className={styles.previewFrame}>
        {previewPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */}
            <img
              src={previewPhoto.objectUrl}
              alt={previewPhoto.seo.imageAlt || previewPhoto.fileName}
              className={styles.previewImage}
            />
            <div className={styles.previewMeta}>
              <p className={styles.previewFileName}>{previewPhoto.fileName}</p>
              <p className={styles.previewDetails}>
                № {previewPhoto.photoNumber} · {previewPhoto.fileSizeLabel} ·{" "}
                {previewPhoto.fileFormat}
              </p>
              {previewPhoto.isMain ? (
                <span className={styles.mainBadge}>Главное фото</span>
              ) : null}
            </div>
          </>
        ) : (
          <p className={styles.previewPlaceholderText}>Предпросмотр фотографии</p>
        )}
      </div>
    </aside>
  );
}
