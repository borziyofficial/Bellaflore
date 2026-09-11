// ==================================================
// SECTION: PRODUCT IMAGE PROTECTION
// РАЗДЕЛ: Защита изображений товара
//
// Purpose (EN):
// Product image wrapper that blocks casual browser save/copy gestures.
//
// Назначение (RU):
// Обертка изображения товара, блокирующая обычное сохранение/копирование.
// ==================================================
"use client";

import Image, { type ImageProps } from "next/image";
import type { DragEvent, MouseEvent } from "react";
import styles from "@/components/images/ProtectedProductImage.module.css";

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function preventProtectedImageContextMenu(
  event: MouseEvent<HTMLImageElement>,
): void {
  event.preventDefault();
}

function preventProtectedImageDrag(event: DragEvent<HTMLImageElement>): void {
  event.preventDefault();
  event.dataTransfer.effectAllowed = "none";
  event.dataTransfer.dropEffect = "none";
}

export function ProtectedProductImage({
  className,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  ...props
}: ImageProps) {
  return (
    <Image
      {...props}
      className={joinClassNames(styles.protectedImage, className)}
      data-protected-product-image="true"
      draggable={false}
      onContextMenu={(event) => {
        onContextMenu?.(event);
        preventProtectedImageContextMenu(event);
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        preventProtectedImageDrag(event);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        preventProtectedImageDrag(event);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        preventProtectedImageDrag(event);
      }}
    />
  );
}
