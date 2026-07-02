// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Photo Manager
// ==================================================
"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import styles from "@/components/adminFoundation/AdminPhotoManager.module.css";
import {
  appendAdminPhotoLibraryItems,
  createAdminPhotoItem,
  getAdminPhotoLibrarySnapshot,
  removeAdminPhotoItem,
  setAdminMainPhoto,
  useAdminPhotoLibraryPhotos,
  moveAdminPhotoItem,
} from "@/components/adminFoundation/adminPhotoLibraryStore";

type AcceptedFileResult = {
  accepted: File[];
  rejected: File[];
};

type DemoPhotoSpec = {
  base64?: string;
  mimeType: string;
  name: string;
  url?: string;
};

const ACCEPTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(sizeBytes < 10 * 1024 ? 1 : 0)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(sizeBytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index < 0) {
    return "";
  }

  return fileName.slice(index + 1).toLowerCase();
}

function isAcceptedImageFile(file: File): boolean {
  const extension = getExtension(file.name);
  return (
    ACCEPTED_IMAGE_MIME_TYPES.has(file.type) ||
    ACCEPTED_IMAGE_EXTENSIONS.has(extension)
  );
}

function classifyFiles(files: File[]): AcceptedFileResult {
  return files.reduce<AcceptedFileResult>(
    (accumulator, file) => {
      if (isAcceptedImageFile(file)) {
        accumulator.accepted.push(file);
      } else {
        accumulator.rejected.push(file);
      }

      return accumulator;
    },
    { accepted: [], rejected: [] },
  );
}

function fileFromBase64Spec(spec: DemoPhotoSpec): File {
  const binary = window.atob(spec.base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], spec.name, { type: spec.mimeType });
}

export function AdminPhotoManager() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const photos = useAdminPhotoLibraryPhotos();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveSelectedPhotoId = useMemo(() => {
    if (selectedPhotoId && photos.some((photo) => photo.id === selectedPhotoId)) {
      return selectedPhotoId;
    }

    return photos[0]?.id ?? null;
  }, [photos, selectedPhotoId]);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === effectiveSelectedPhotoId) ?? null,
    [effectiveSelectedPhotoId, photos],
  );

  const addFiles = useCallback((incomingFiles: File[]) => {
    const { accepted, rejected } = classifyFiles(incomingFiles);

    if (rejected.length > 0) {
      setErrorMessage("Поддерживаются только JPG, JPEG, PNG и WebP.");
    }

    if (accepted.length === 0) {
      return;
    }

    setErrorMessage(null);

    const currentPhotos = getAdminPhotoLibrarySnapshot();
    const hasMain = currentPhotos.some((photo) => photo.isMain);
    const uploaded = accepted.map((file, index) =>
      createAdminPhotoItem(file, !hasMain && index === 0 && currentPhotos.length === 0),
    );

    appendAdminPhotoLibraryItems(uploaded);

    if (uploaded[0]) {
      setSelectedPhotoId(uploaded[0].id);
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      addFiles(files);
    }
    event.target.value = "";
  };

  const importSpecs = useCallback(async (specs: DemoPhotoSpec[]) => {
    const files: File[] = [];

    for (const spec of specs) {
      if (spec.base64) {
        files.push(fileFromBase64Spec(spec));
        continue;
      }

      if (spec.url) {
      const response = await fetch(spec.url);
      const blob = await response.blob();
      files.push(new File([blob], spec.name, { type: spec.mimeType || blob.type }));
      }
    }

    addFiles(files);
  }, [addFiles]);

  const loadDemoPhotos = () => {
    void importSpecs([
      {
        name: "0001.jpg",
        mimeType: "image/jpeg",
        url: "/0001.jpg",
      },
      {
        name: "0002.jpg",
        mimeType: "image/jpeg",
        url: "/0002.jpg",
      },
    ]);
  };

  const testInvalidFile = () => {
    void importSpecs([
      {
        name: "bellaflore-not-image.txt",
        mimeType: "text/plain",
        base64: "bm90IGFuIGltYWdl",
      },
    ]);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const setMainPhoto = (photoId: string) => {
    setAdminMainPhoto(photoId);
    setSelectedPhotoId(photoId);
  };

  const removePhoto = (photoId: string) => {
    const removed = removeAdminPhotoItem(photoId);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
  };

  const moveLeft = (photoId: string) => {
    moveAdminPhotoItem(photoId, -1);
  };

  const moveRight = (photoId: string) => {
    moveAdminPhotoItem(photoId, 1);
  };

  return (
    <section className={styles.manager} aria-label="Photo Manager">
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Photo Manager</p>
          <h2 className={styles.title}>Фото</h2>
          <p className={styles.lead}>
            Локальная загрузка и предпросмотр изображений для админки без базы данных
            и без server upload.
          </p>
        </div>

        <div className={styles.headerStats}>
          <p className={styles.statPill}>Фото: {photos.length}</p>
          <p className={styles.statPill}>
            Главное: {photos.find((photo) => photo.isMain)?.fileName ?? "не выбрано"}
          </p>
        </div>
      </div>

      <div
        className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaActive : ""}`}
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        aria-label="Зона загрузки фотографий"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        <p className={styles.uploadTitle}>Click to choose images or drop them here</p>
        <p className={styles.uploadHint}>
          Accepts JPG, JPEG, PNG, WebP. Multiple selection is supported.
        </p>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <div className={styles.uploadActions}>
          <button type="button" className={styles.secondaryButton} onClick={loadDemoPhotos}>
            Load demo photos
          </button>
          <button type="button" className={styles.secondaryButton} onClick={testInvalidFile}>
            Try invalid file
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.gridColumn} aria-label="Сетка фотографий">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Photo grid</h3>
            <p className={styles.sectionNote}>Карточки и порядок хранятся только в текущей сессии браузера.</p>
          </div>

          {photos.length > 0 ? (
            <div className={styles.grid}>
              {photos.map((photo, index) => {
                const isSelected = effectiveSelectedPhotoId === photo.id;

                return (
                  <article
                    key={photo.id}
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedPhotoId(photo.id);
                      }
                    }}
                    aria-label={`Фотография ${photo.fileName}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */}
                    <img src={photo.previewUrl} alt={photo.fileName} className={styles.image} />

                    <div className={styles.cardMeta}>
                      <div className={styles.cardHeaderRow}>
                        <p className={styles.fileName}>{photo.fileName}</p>
                        {photo.isMain ? <span className={styles.mainBadge}>Главное фото</span> : null}
                      </div>
                      <p className={styles.fileMeta}>
                        {formatFileSize(photo.sizeBytes)} · {photo.mimeType}
                      </p>
                    </div>

                    <div className={styles.actionRow} onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => setMainPhoto(photo.id)}
                        disabled={photo.isMain}
                      >
                        Set as main
                      </button>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => moveLeft(photo.id)}
                        disabled={index === 0}
                      >
                        Move left
                      </button>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => moveRight(photo.id)}
                        disabled={index === photos.length - 1}
                      >
                        Move right
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        onClick={() => removePhoto(photo.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No photos yet</p>
              <p className={styles.emptyText}>
                Upload one or more images to start the browser-only preview session.
              </p>
            </div>
          )}
        </section>

        <aside className={styles.previewColumn} aria-label="Selected photo preview">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Selected photo preview</h3>
            <p className={styles.sectionNote}>Preview updates with the currently selected card.</p>
          </div>

          {selectedPhoto ? (
            <div className={styles.previewCard}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local objectURL preview only */}
              <img
                src={selectedPhoto.previewUrl}
                alt={selectedPhoto.fileName}
                className={styles.previewImage}
              />
              <div className={styles.previewMeta}>
                <p className={styles.previewName}>{selectedPhoto.fileName}</p>
                <p className={styles.previewDetails}>
                  {formatFileSize(selectedPhoto.sizeBytes)} · {selectedPhoto.mimeType}
                </p>
                {selectedPhoto.isMain ? <span className={styles.mainBadge}>Main photo</span> : null}
                <p className={styles.previewCreatedAt}>
                  Created {new Intl.DateTimeFormat("ru-RU", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(selectedPhoto.createdAt))}
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.previewEmpty}>
              <p className={styles.emptyTitle}>Selected photo preview</p>
              <p className={styles.emptyText}>
                Choose a card after uploading images to inspect the preview.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
