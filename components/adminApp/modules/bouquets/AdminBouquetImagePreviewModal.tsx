// ==================================================
// SECTION: ADMIN APP — Bouquet image preview modal (Stage 2.6)
// ==================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import type { BouquetImage } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetImagePreviewModalProps = {
  open: boolean;
  images: BouquetImage[];
  activeId: string | null;
  onClose: () => void;
  onChangeActive: (id: string) => void;
};

export function AdminBouquetImagePreviewModal({
  open,
  images,
  activeId,
  onClose,
  onChangeActive,
}: AdminBouquetImagePreviewModalProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const sorted = [...images].sort((left, right) => left.sortOrder - right.sortOrder);
  const activeIndex = sorted.findIndex((image) => image.id === activeId);
  const activeImage = activeIndex >= 0 ? sorted[activeIndex] : null;

  const goPrev = useCallback(() => {
    if (sorted.length === 0 || activeIndex <= 0) {
      return;
    }
    onChangeActive(sorted[activeIndex - 1].id);
  }, [sorted, activeIndex, onChangeActive]);

  const goNext = useCallback(() => {
    if (sorted.length === 0 || activeIndex < 0 || activeIndex >= sorted.length - 1) {
      return;
    }
    onChangeActive(sorted[activeIndex + 1].id);
  }, [sorted, activeIndex, onChangeActive]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowLeft") {
        goPrev();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  if (!open || !activeImage) {
    return null;
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(delta) < 40) {
      return;
    }

    if (delta > 0) {
      goPrev();
      return;
    }

    goNext();
  };

  return (
    <div className={styles.mediaPreviewOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.mediaPreviewSheet}
        role="dialog"
        aria-modal="true"
        aria-label="Просмотр фото"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <header className={styles.mediaPreviewHeader}>
          <div className={styles.mediaPreviewMeta}>
            <p className={styles.mediaPreviewName}>{activeImage.name}</p>
            <p className={styles.mediaPreviewCounter}>
              {activeIndex + 1} / {sorted.length}
              {activeImage.isCover ? " · Главная" : ""}
            </p>
          </div>
          <button
            type="button"
            className={styles.formClose}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <span className={styles.formCloseIcon} aria-hidden="true">
              ×
            </span>
          </button>
        </header>

        <div className={styles.mediaPreviewStage}>
          <button
            type="button"
            className={styles.mediaPreviewNav}
            onClick={goPrev}
            disabled={activeIndex <= 0}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={activeImage.name}
            className={styles.mediaPreviewImage}
          />

          <button
            type="button"
            className={styles.mediaPreviewNav}
            onClick={goNext}
            disabled={activeIndex >= sorted.length - 1}
            aria-label="Следующее фото"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
