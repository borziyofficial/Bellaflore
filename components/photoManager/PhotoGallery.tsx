"use client";

import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import { PhotoCard } from "@/components/photoManager/PhotoCard";
import styles from "@/components/photoManager/PhotoGallery.module.css";

type PhotoGalleryProps = {
  onEditSeo: (photoId: string) => void;
};

export function PhotoGallery({ onEditSeo }: PhotoGalleryProps) {
  const {
    photos,
    selectedPhotoId,
    selectPhoto,
    setMain,
    removePhoto,
    movePhotoUp,
    movePhotoDown,
  } = usePhotoManager();

  if (photos.length === 0) {
    return (
      <p className={styles.emptyState}>
        Загрузите JPG, PNG или WebP — фото появятся в галерее с SEO-подготовкой.
      </p>
    );
  }

  return (
    <div className={styles.gallery}>
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isSelected={selectedPhotoId === photo.id}
          isFirst={index === 0}
          isLast={index === photos.length - 1}
          onSelect={selectPhoto}
          onSetMain={setMain}
          onEditSeo={onEditSeo}
          onRemove={removePhoto}
          onMoveUp={movePhotoUp}
          onMoveDown={movePhotoDown}
        />
      ))}
    </div>
  );
}
