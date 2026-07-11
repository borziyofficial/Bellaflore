// ==================================================
// SECTION: ADMIN APP — Bouquet image helpers (Stage 2.6)
// ==================================================
import {
  BOUQUET_ACCEPTED_IMAGE_TYPES,
  BOUQUET_MAX_IMAGE_BYTES,
  type BouquetImage,
  type BouquetImageVariants,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { createBouquetId } from "@/components/adminApp/modules/bouquets/bouquetUtils";

export type BouquetImageUploadResult = {
  images: BouquetImage[];
  errors: string[];
};

function isAcceptedImageType(type: string): boolean {
  return (BOUQUET_ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

function assignSortOrders(images: BouquetImage[]): BouquetImage[] {
  return images.map((image, index) => ({
    ...image,
    sortOrder: index,
  }));
}

function ensureSingleCover(images: BouquetImage[]): BouquetImage[] {
  if (images.length === 0) {
    return [];
  }

  const sorted = [...images].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
  );

  const coverIndex = sorted.findIndex((image) => image.isCover);

  if (coverIndex === -1) {
    return assignSortOrders(
      sorted.map((image, index) => ({
        ...image,
        isCover: index === 0,
      })),
    );
  }

  return assignSortOrders(
    sorted.map((image, index) => ({
      ...image,
      isCover: index === coverIndex,
    })),
  );
}

function normalizeVariants(value: unknown): BouquetImageVariants | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const variants = value as BouquetImageVariants;
  const normalized: BouquetImageVariants = {};

  if (typeof variants.original === "string") {
    normalized.original = variants.original;
  }
  if (typeof variants.optimized === "string") {
    normalized.optimized = variants.optimized;
  }
  if (typeof variants.aiProcessed === "string") {
    normalized.aiProcessed = variants.aiProcessed;
  }
  if (typeof variants.backgroundReplaced === "string") {
    normalized.backgroundReplaced = variants.backgroundReplaced;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
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
      .map((item, index) => ({
        id: item.id,
        url: item.url,
        name: item.name ?? "Фото",
        isCover: Boolean(item.isCover),
        sortOrder:
          typeof item.sortOrder === "number" ? item.sortOrder : index,
        createdAt: item.createdAt ?? new Date().toISOString(),
        variants: normalizeVariants(item.variants),
        width: typeof item.width === "number" ? item.width : undefined,
        height: typeof item.height === "number" ? item.height : undefined,
        sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : undefined,
      }));

    return ensureSingleCover(normalized);
  }

  return [];
}

export function getBouquetCoverImage(images: BouquetImage[]): BouquetImage | null {
  const normalized = ensureSingleCover(images);
  return normalized.find((image) => image.isCover) ?? normalized[0] ?? null;
}

export function validateBouquetImageFile(file: File): string | null {
  if (!file || file.size === 0) {
    return `«${file?.name ?? "Файл"}» пустой.`;
  }

  if (file.size > BOUQUET_MAX_IMAGE_BYTES) {
    return `«${file.name}» слишком большой (макс. 20 МБ).`;
  }

  if (!isAcceptedImageType(file.type)) {
    return `«${file.name}» — неподдерживаемый формат. Используйте JPG, PNG или WebP.`;
  }

  return null;
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("corrupted"));
    image.src = dataUrl;
  });
}

async function processBouquetImageFile(file: File): Promise<BouquetImage> {
  const previewUrl = URL.createObjectURL(file);

  try {
    const preview = await loadImageElement(previewUrl);
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/bouquets/upload-image", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const body = (await response.json().catch(() => null)) as {
      imageUrl?: string;
      message?: string;
    } | null;

    if (!response.ok || !body?.imageUrl) {
      throw new Error(body?.message || `Не удалось сохранить «${file.name}».`);
    }

    const now = new Date().toISOString();

    return {
      id: createBouquetId(),
      url: body.imageUrl,
      name: file.name,
      isCover: false,
      sortOrder: 0,
      createdAt: now,
      variants: {
        original: body.imageUrl,
        optimized: body.imageUrl,
      },
      width: preview.naturalWidth,
      height: preview.naturalHeight,
      sizeBytes: file.size,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Не удалось обработать «${file.name}».`);
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}

export async function createBouquetImagesFromFiles(
  files: File[],
  existing: BouquetImage[],
): Promise<BouquetImageUploadResult> {
  const normalizedExisting = ensureSingleCover([...existing]);
  const errors: string[] = [];
  const next = [...normalizedExisting];
  const hadImages = normalizedExisting.length > 0;
  let addedCount = 0;

  for (const file of files) {
    const validationError = validateBouquetImageFile(file);
    if (validationError) {
      errors.push(validationError);
      continue;
    }

    try {
      const image = await processBouquetImageFile(file);
      image.isCover = !hadImages && addedCount === 0;
      image.sortOrder = next.length;
      next.push(image);
      addedCount += 1;
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `Не удалось обработать «${file.name}».`,
      );
    }
  }

  return {
    images: ensureSingleCover(next),
    errors,
  };
}

export function setBouquetCoverImage(
  images: BouquetImage[],
  imageId: string,
): BouquetImage[] {
  return ensureSingleCover(
    images.map((image) => ({
      ...image,
      isCover: image.id === imageId,
    })),
  );
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
    return ensureSingleCover(
      remaining.map((image, index) => ({
        ...image,
        isCover: index === 0,
      })),
    );
  }

  return ensureSingleCover(remaining);
}

export function reorderBouquetImages(
  images: BouquetImage[],
  fromIndex: number,
  toIndex: number,
): BouquetImage[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= images.length ||
    toIndex >= images.length
  ) {
    return images;
  }

  const sorted = [...images].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);

  return ensureSingleCover(assignSortOrders(sorted));
}

export function moveBouquetImage(
  images: BouquetImage[],
  imageId: string,
  direction: "left" | "right",
): BouquetImage[] {
  const sorted = [...images].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const index = sorted.findIndex((image) => image.id === imageId);
  if (index === -1) {
    return images;
  }

  const targetIndex = direction === "left" ? index - 1 : index + 1;
  return reorderBouquetImages(sorted, index, targetIndex);
}

export function cloneBouquetImages(images: BouquetImage[]): BouquetImage[] {
  return images.map((image) => ({
    ...image,
    variants: image.variants ? { ...image.variants } : undefined,
  }));
}

/** @deprecated Use createBouquetImagesFromFiles result.images */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("read-failed"));
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}
