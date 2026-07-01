// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Изображение товара
//
// Purpose (EN): Safe product image with premium BellaFlore placeholder on failure.
//
// Назначение (RU): Безопасное изображение товара с премиальным плейсхолдером.
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import Image from "next/image";
import styles from "@/components/product/ProductImageWithFallback.module.css";
import { useState } from "react";

type ProductImageWithFallbackProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function ProductImageWithFallback({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  imageClassName,
  fallbackClassName,
}: ProductImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const hasSource = Boolean(src?.trim());

  if (!hasSource || failed) {
    return (
      <div
        className={fallbackClassName ?? styles.fallback}
        aria-label={alt}
        role="img"
      >
        <BrandLogo variant="panel" className={styles.logo} />
      </div>
    );
  }

  return (
    <Image
      className={imageClassName}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
