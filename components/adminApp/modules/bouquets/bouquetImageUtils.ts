// ==================================================
// SECTION: ADMIN APP — Bouquet image helpers (Stage 2.2)
// ==================================================
import {
  BOUQUET_ACCEPTED_IMAGE_TYPES,
  type BouquetImage,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { createBouquetId } from "@/components/adminApp/modules/bouquets/bouquetUtils";

function isAcceptedImageType(type: string): boolean {
  return (BOUQUET_ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

function ensureSingleCover(images: BouquetImage[]): BouquetImage[] {
  if (images.length === 0) {
    return [];
  }

  const coverIndex = images.findIndex((image) => image.isCover);

  if (coverIndex === -1) {
    return images.map((image, index) => ({
      ...image,
      isCover: index === 0,
    }));
  }

  return images.map((image, index) => ({
    ...image,
    isCover: index === coverIndex,
  }));
}

export function normalizeBouquetImages(value: unknown): BouquetImage[] {
  if (Array.isArray(value)) {
    const normalized = value
      .filter(
        (item): item is BouquetImage =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as BouquetImage).id === "string" &&
          typeof (item as BouquetImage).url === "string",
      )
      .map((item) => ({
        id: item.id,
        url: item.url,
        name: item.name ?? "Фото",
        isCover: Boolean(item.isCover),
        createdAt: item.createdAt ?? new Date().toISOString(),
      }));

    return ensureSingleCover(normalized);
  }

  return [];
}

export function getBouquetCoverImage(images: BouquetImage[]): BouquetImage | null {
  const normalized = ensureSingleCover(images);
  return normalized.find((image) => image.isCover) ?? normalized[0] ?? null;
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать файл"));
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export async function createBouquetImagesFromFiles(
  files: File[],
  existing: BouquetImage[],
): Promise<BouquetImage[]> {
  const accepted = files.filter((file) => isAcceptedImageType(file.type));
  if (accepted.length === 0) {
    return existing;
  }

  const normalizedExisting = ensureSingleCover([...existing]);
  const next = [...normalizedExisting];
  const now = new Date().toISOString();
  const hadImages = normalizedExisting.length > 0;

  for (const [index, file] of accepted.entries()) {
    const url = await readImageFileAsDataUrl(file);
    next.push({
      id: createBouquetId(),
      url,
      name: file.name,
      isCover: !hadImages && index === 0,
      createdAt: now,
    });
  }

  return ensureSingleCover(next);
}

export function setBouquetCoverImage(
  images: BouquetImage[],
  imageId: string,
): BouquetImage[] {
  return images.map((image) => ({
    ...image,
    isCover: image.id === imageId,
  }));
}

export function removeBouquetImage(
  images: BouquetImage[],
  imageId: string,
): BouquetImage[] {
  const removed = images.find((image) => image.id === imageId);
  const remaining = images.filter((image) => image.id !== imageId);

  if (remaining.length === 0) {
    return [];
  }

  if (removed?.isCover) {
    return remaining.map((image, index) => ({
      ...image,
      isCover: index === 0,
    }));
  }

  return ensureSingleCover(remaining);
}

export function cloneBouquetImages(images: BouquetImage[]): BouquetImage[] {
  return images.map((image) => ({ ...image }));
}
