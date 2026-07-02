// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Галерея товара
//
// Purpose (EN): Premium product gallery with thumbnails and safe image fallback.
//
// Назначение (RU): Премиальная галерея с миниатюрами и безопасным fallback.
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import Image from "next/image";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductGalleryImage } from "@/components/product/productExperienceTypes";
import styles from "@/components/product/ProductGallery.module.css";

type ProductGalleryProps = {
  images: ProductGalleryImage[];
  productTitle: string;
  failedImageIds: Set<string>;
  onImageError: (imageId: string) => void;
};

const SWIPE_THRESHOLD_PX = 42;

export function ProductGallery({
  images,
  productTitle,
  failedImageIds,
  onImageError,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaRef = useRef(0);

  const slideCount = images.length;
  const hasMultipleImages = slideCount > 1;

  const goToSlide = useCallback(
    (index: number) => {
      if (slideCount === 0) {
        return;
      }

      const normalized =
        ((index % slideCount) + slideCount) % slideCount;
      setActiveIndex(normalized);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaRef.current = 0;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartXRef.current === null) {
      return;
    }

    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    touchDeltaRef.current = currentX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaRef.current) >= SWIPE_THRESHOLD_PX) {
      if (touchDeltaRef.current < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartXRef.current = null;
    touchDeltaRef.current = 0;
  };

  useEffect(() => {
    if (!fullscreenOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenOpen(false);
      }

      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "ArrowLeft") {
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenOpen, goNext, goPrev]);

  if (slideCount === 0) {
    return null;
  }

  const trackStyle = {
    transform: `translateX(-${activeIndex * 100}%)`,
  };

  const renderSlideImage = (image: ProductGalleryImage, priority = false) => {
    if (failedImageIds.has(image.id)) {
      return (
        <div className={styles.fallback} aria-label={image.alt}>
          <BrandLogo variant="panel" className={styles.fallbackLogo} />
        </div>
      );
    }

    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className={styles.slideImage}
        sizes="(max-width: 768px) 100vw, 560px"
        priority={priority}
        unoptimized={shouldUseUnoptimizedImage(image.src)}
        onError={() => onImageError(image.id)}
      />
    );
  };

  return (
    <>
      <div className={styles.gallery}>
        <div
          className={styles.viewport}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.track} style={trackStyle}>
            {images.map((image, index) => (
              <div className={styles.slide} key={image.id}>
                <button
                  type="button"
                  className={styles.slideButton}
                  aria-label={`Открыть фото ${productTitle}`}
                  onClick={() => setFullscreenOpen(true)}
                >
                  {renderSlideImage(image, index === 0)}
                </button>
              </div>
            ))}
          </div>
        </div>

        {hasMultipleImages ? (
          <div className={styles.thumbnailRail} aria-label="Миниатюры">
            {images.map((image, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`thumb-${image.id}`}
                  type="button"
                  className={`${styles.thumbnail} ${isActive ? styles.thumbnailActive : ""}`}
                  aria-label={`Фото ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => goToSlide(index)}
                >
                  {!failedImageIds.has(image.id) ? (
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      className={styles.thumbnailImage}
                      sizes="72px"
                      unoptimized={shouldUseUnoptimizedImage(image.src)}
                      onError={() => onImageError(image.id)}
                    />
                  ) : (
                    <span className={styles.thumbnailFallback} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.dots} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dotActive}`} />
          </div>
        )}
      </div>

      {fullscreenOpen ? (
        <div
          className={styles.fullscreen}
          role="dialog"
          aria-modal="true"
          aria-label={`Галерея ${productTitle}`}
        >
          <div className={styles.fullscreenTop}>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Закрыть галерею"
              onClick={() => setFullscreenOpen(false)}
            >
              ×
            </button>
          </div>

          <div
            className={styles.fullscreenViewport}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.fullscreenTrack} style={trackStyle}>
              {images.map((image) => (
                <div className={styles.fullscreenSlide} key={`full-${image.id}`}>
                  {!failedImageIds.has(image.id) ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      className={styles.fullscreenImage}
                      unoptimized={shouldUseUnoptimizedImage(image.src)}
                      onError={() => onImageError(image.id)}
                    />
                  ) : (
                    <div className={styles.fallback}>
                      <BrandLogo variant="panel" className={styles.fallbackLogo} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {hasMultipleImages ? (
            <div className={styles.fullscreenDots}>
              {images.map((image, index) => (
                <button
                  key={`full-dot-${image.id}`}
                  type="button"
                  className={`${styles.dot} ${
                    index === activeIndex ? styles.dotActive : ""
                  }`}
                  aria-label={`Фото ${index + 1}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
