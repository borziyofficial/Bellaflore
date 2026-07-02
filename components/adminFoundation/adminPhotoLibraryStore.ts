"use client";

import { useSyncExternalStore } from "react";

import type { AdminPhotoItem } from "@/components/adminFoundation/adminPhotoTypes";

type PhotoListener = () => void;

const photoListeners = new Set<PhotoListener>();
let photoLibrary: AdminPhotoItem[] = [];

function emitPhotoLibraryChange(): void {
  photoListeners.forEach((listener) => listener());
}

function ensureMainPhoto(photos: AdminPhotoItem[]): AdminPhotoItem[] {
  if (photos.length === 0 || photos.some((photo) => photo.isMain)) {
    return photos;
  }

  return photos.map((photo, index) => ({
    ...photo,
    isMain: index === 0,
  }));
}

export function subscribeAdminPhotoLibrary(listener: PhotoListener): () => void {
  photoListeners.add(listener);
  return () => {
    photoListeners.delete(listener);
  };
}

export function getAdminPhotoLibrarySnapshot(): AdminPhotoItem[] {
  return photoLibrary;
}

export function useAdminPhotoLibraryPhotos(): AdminPhotoItem[] {
  return useSyncExternalStore(
    subscribeAdminPhotoLibrary,
    getAdminPhotoLibrarySnapshot,
    () => [],
  );
}

export function createAdminPhotoItem(file: File, isMain: boolean): AdminPhotoItem {
  return {
    id: `admin-photo-${crypto.randomUUID()}`,
    fileName: file.name,
    previewUrl: URL.createObjectURL(file),
    mimeType: file.type || `image/${file.name.split(".").pop() || "unknown"}`,
    sizeBytes: file.size,
    isMain,
    createdAt: new Date().toISOString(),
  };
}

export function replaceAdminPhotoLibrary(nextPhotos: AdminPhotoItem[]): void {
  photoLibrary = ensureMainPhoto(nextPhotos.map((photo) => ({ ...photo })));
  emitPhotoLibraryChange();
}

export function appendAdminPhotoLibraryItems(items: AdminPhotoItem[]): void {
  if (items.length === 0) {
    return;
  }

  photoLibrary = ensureMainPhoto([...photoLibrary, ...items.map((photo) => ({ ...photo }))]);
  emitPhotoLibraryChange();
}

export function removeAdminPhotoItem(photoId: string): AdminPhotoItem | null {
  const target = photoLibrary.find((photo) => photo.id === photoId) ?? null;
  if (!target) {
    return null;
  }

  photoLibrary = ensureMainPhoto(photoLibrary.filter((photo) => photo.id !== photoId));
  emitPhotoLibraryChange();
  return target;
}

export function moveAdminPhotoItem(photoId: string, direction: -1 | 1): void {
  const index = photoLibrary.findIndex((photo) => photo.id === photoId);
  if (index < 0) {
    return;
  }

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= photoLibrary.length) {
    return;
  }

  const next = [...photoLibrary];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  photoLibrary = next;
  emitPhotoLibraryChange();
}

export function setAdminMainPhoto(photoId: string): void {
  photoLibrary = photoLibrary.map((photo) => ({
    ...photo,
    isMain: photo.id === photoId,
  }));
  emitPhotoLibraryChange();
}

export function getAdminPhotoItemById(photoId: string): AdminPhotoItem | null {
  return photoLibrary.find((photo) => photo.id === photoId) ?? null;
}

export function getAdminPhotosByIds(photoIds: string[]): AdminPhotoItem[] {
  if (photoIds.length === 0) {
    return [];
  }

  const order = new Map(photoIds.map((photoId, index) => [photoId, index]));

  return photoLibrary
    .filter((photo) => order.has(photo.id))
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}

export function getAdminPhotoLibraryIdSet(): ReadonlySet<string> {
  return new Set(photoLibrary.map((photo) => photo.id));
}

export function sanitizeAdminPhotoAttachmentSelection(
  photoIds: string[],
  mainPhotoId: string | null,
  availablePhotoIds: ReadonlySet<string>,
): { photoIds: string[]; mainPhotoId: string | null } {
  const nextPhotoIds = photoIds.filter((photoId) => availablePhotoIds.has(photoId));

  if (nextPhotoIds.length === 0) {
    return { photoIds: [], mainPhotoId: null };
  }

  const nextMainPhotoId =
    mainPhotoId && nextPhotoIds.includes(mainPhotoId) ? mainPhotoId : nextPhotoIds[0];

  return {
    photoIds: nextPhotoIds,
    mainPhotoId: nextMainPhotoId,
  };
}

export function normalizeAdminPhotoLibrarySelection(): AdminPhotoItem[] {
  photoLibrary = ensureMainPhoto(photoLibrary);
  emitPhotoLibraryChange();
  return photoLibrary;
}
