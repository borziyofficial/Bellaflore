"use client";

import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import styles from "@/components/productEditor/ProductEditorFoundation.module.css";

export function ProductEditorPhotoIntegration() {
  const { mainPhoto } = usePhotoManager();

  return (
    <div className={styles.photoBlock}>
      <h4 className={styles.photoTitle}>Фото товара</h4>
      {mainPhoto?.objectUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */}
          <img
            src={mainPhoto.objectUrl}
            alt={mainPhoto.seo.imageAlt || mainPhoto.fileName}
            className={styles.photoPreviewImage}
          />
          <p className={styles.photoMeta}>
            Главное фото: {mainPhoto.fileName} · {mainPhoto.fileSizeLabel}
          </p>
        </>
      ) : mainPhoto ? (
        <div className={styles.photoPlaceholder}>
          {mainPhoto.placeholderLabel || "placeholder · главное фото"}
        </div>
      ) : (
        <div className={styles.photoPlaceholder}>placeholder · главное фото</div>
      )}
      <p className={styles.photoNote}>
        Фото связаны с активным товаром через Product Store и Photo Manager.
      </p>
    </div>
  );
}
