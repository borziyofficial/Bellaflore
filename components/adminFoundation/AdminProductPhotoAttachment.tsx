// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Привязка фото к товару
// ==================================================
"use client";

import styles from "@/components/adminFoundation/AdminProductPhotoAttachment.module.css";
import {
  getAdminPhotosByIds,
  useAdminPhotoLibraryPhotos,
} from "@/components/adminFoundation/adminPhotoLibraryStore";

type AdminProductPhotoAttachmentProps = {
  attachedPhotoIds: string[];
  mainPhotoId: string | null;
  onChange: (next: { photoIds: string[]; mainPhotoId: string | null }) => void;
};

function toggleAttachedPhoto(
  attachedPhotoIds: string[],
  mainPhotoId: string | null,
  photoId: string,
): { photoIds: string[]; mainPhotoId: string | null } {
  if (attachedPhotoIds.includes(photoId)) {
    const nextPhotoIds = attachedPhotoIds.filter((id) => id !== photoId);

    if (nextPhotoIds.length === 0) {
      return { photoIds: [], mainPhotoId: null };
    }

    const nextMainPhotoId =
      mainPhotoId === photoId ? nextPhotoIds[0] : mainPhotoId;

    return {
      photoIds: nextPhotoIds,
      mainPhotoId: nextMainPhotoId,
    };
  }

  const nextPhotoIds = [...attachedPhotoIds, photoId];

  return {
    photoIds: nextPhotoIds,
    mainPhotoId: mainPhotoId ?? photoId,
  };
}

export function AdminProductPhotoAttachment({
  attachedPhotoIds,
  mainPhotoId,
  onChange,
}: AdminProductPhotoAttachmentProps) {
  const libraryPhotos = useAdminPhotoLibraryPhotos();
  const attachedPhotos = getAdminPhotosByIds(attachedPhotoIds);

  const handleToggleAttach = (photoId: string) => {
    onChange(toggleAttachedPhoto(attachedPhotoIds, mainPhotoId, photoId));
  };

  const handleSetMain = (photoId: string) => {
    if (!attachedPhotoIds.includes(photoId)) {
      return;
    }

    onChange({
      photoIds: attachedPhotoIds,
      mainPhotoId: photoId,
    });
  };

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <p className={styles.title}>Фото товара</p>
        <p className={styles.note}>
          Выберите фото из общей библиотеки сессии. Загрузка — во вкладке «Фото».
        </p>
      </div>

      <div className={styles.attachedSection}>
        <p className={styles.sectionLabel}>Прикреплённые фото</p>
        {attachedPhotos.length === 0 ? (
          <p className={styles.emptyState}>
            К этому товару пока не прикреплено ни одного фото.
          </p>
        ) : (
          <div className={styles.photoGrid}>
            {attachedPhotos.map((photo) => {
              const isMain = photo.id === mainPhotoId;

              return (
                <article
                  key={photo.id}
                  className={`${styles.photoTile} ${styles.photoTileAttached} ${
                    isMain ? styles.photoTileMain : ""
                  }`}
                >
                  <div className={styles.previewFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={photo.fileName}
                      className={styles.previewImage}
                    />
                    {isMain ? <span className={styles.mainBadge}>Main</span> : null}
                  </div>
                  <p className={styles.fileName}>{photo.fileName}</p>
                  <div className={styles.actionRow}>
                    {!isMain ? (
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => handleSetMain(photo.id)}
                      >
                        Сделать main
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => handleToggleAttach(photo.id)}
                    >
                      Открепить
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.librarySection}>
        <p className={styles.sectionLabel}>Библиотека фото</p>
        {libraryPhotos.length === 0 ? (
          <p className={styles.emptyState}>
            Библиотека пуста. Загрузите фото во вкладке «Фото».
          </p>
        ) : (
          <div className={styles.photoGrid}>
            {libraryPhotos.map((photo) => {
              const isAttached = attachedPhotoIds.includes(photo.id);

              return (
                <article
                  key={photo.id}
                  className={`${styles.photoTile} ${isAttached ? styles.photoTileAttached : ""}`}
                >
                  <div className={styles.previewFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={photo.fileName}
                      className={styles.previewImage}
                    />
                  </div>
                  <p className={styles.fileName}>{photo.fileName}</p>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${
                        isAttached ? styles.actionButtonActive : ""
                      }`}
                      onClick={() => handleToggleAttach(photo.id)}
                    >
                      {isAttached ? "Прикреплено" : "Прикрепить"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
