import { normalizeBouquetImages } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  cloneBouquetDisplayFlags,
  normalizeBouquetBadge,
  normalizeBouquetDisplayFlags,
  normalizeBouquetDisplayPriority,
  normalizeBouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetManageUtils";
import { normalizeBouquetSizes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type {
  BouquetImage,
  BouquetRecord,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import type {
  StoredBouquetCategoryStorage,
  StoredBouquetImage,
  StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeStoredImage(
  value: unknown,
  index: number,
): StoredBouquetImage | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }

  const id = readString(raw.id);
  const url = readString(raw.url || raw.optimizedUrl);
  if (!id || !url) {
    return null;
  }

  const variants = asRecord(raw.variants);
  const order =
    typeof raw.order === "number"
      ? raw.order
      : typeof raw.sortOrder === "number"
        ? raw.sortOrder
        : index;

  return {
    id,
    url,
    name: readString(raw.name, "Фото"),
    isCover: Boolean(raw.isCover),
    order,
    originalUrl:
      readString(raw.originalUrl) ||
      (variants ? readString(variants.original) : undefined) ||
      undefined,
    optimizedUrl:
      readString(raw.optimizedUrl) ||
      (variants ? readString(variants.optimized) : undefined) ||
      undefined,
    aiProcessedUrl:
      readString(raw.aiProcessedUrl) ||
      (variants ? readString(variants.aiProcessed) : undefined) ||
      undefined,
    backgroundReplacedUrl:
      readString(raw.backgroundReplacedUrl) ||
      (variants ? readString(variants.backgroundReplaced) : undefined) ||
      undefined,
    width: typeof raw.width === "number" ? raw.width : undefined,
    height: typeof raw.height === "number" ? raw.height : undefined,
    sizeBytes: typeof raw.sizeBytes === "number" ? raw.sizeBytes : undefined,
    createdAt: readString(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeStoredImages(value: unknown): StoredBouquetImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const images = value
    .map((item, index) => normalizeStoredImage(item, index))
    .filter((item): item is StoredBouquetImage => Boolean(item))
    .sort((left, right) => left.order - right.order);

  if (images.length === 0) {
    return [];
  }

  const coverIndex = images.findIndex((image) => image.isCover);
  if (coverIndex === -1) {
    return images.map((image, index) => ({
      ...image,
      isCover: index === 0,
      order: index,
    }));
  }

  return images.map((image, index) => ({
    ...image,
    isCover: index === coverIndex,
    order: index,
  }));
}

export function normalizeStoredBouquetRecord(value: unknown): StoredBouquetRecord | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }

  const id = readString(raw.id);
  const name = readString(raw.name).trim();
  if (!id || !name) {
    return null;
  }

  const categoryId = readString(raw.categoryId || raw.category);
  const now = new Date().toISOString();
  const seoRaw = asRecord(raw.seo);

  return {
    id,
    name,
    slug: readString(raw.slug, id),
    categoryId,
    description: readString(raw.description),
    basePrice: readNumber(raw.basePrice),
    status: normalizeBouquetStatus(raw.status),
    displayFlags: normalizeBouquetDisplayFlags(raw.displayFlags),
    displayPriority: normalizeBouquetDisplayPriority(raw.displayPriority),
    badge: normalizeBouquetBadge(raw.badge),
    images: normalizeStoredImages(raw.images),
    sizes: normalizeBouquetSizes(raw.sizes),
    seo: {
      title: seoRaw ? readString(seoRaw.title) || undefined : undefined,
      description: seoRaw ? readString(seoRaw.description) || undefined : undefined,
      slug: seoRaw ? readString(seoRaw.slug) || undefined : undefined,
    },
    createdAt: readString(raw.createdAt, now),
    updatedAt: readString(raw.updatedAt, now),
  };
}

export function normalizeStoredBouquetRecords(value: unknown): StoredBouquetRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeStoredBouquetRecord(item))
    .filter((item): item is StoredBouquetRecord => Boolean(item))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function normalizeStoredCategoryStorage(
  value: unknown,
): StoredBouquetCategoryStorage {
  const raw = asRecord(value);
  if (!raw) {
    return { custom: [], overrides: {} };
  }

  const custom = Array.isArray(raw.custom)
    ? raw.custom
        .map((item) => {
          const record = asRecord(item);
          if (!record) {
            return null;
          }
          const id = readString(record.id);
          const name = readString(record.name).trim();
          if (!id || !name) {
            return null;
          }
          const now = new Date().toISOString();
          return {
            id,
            name,
            slug: readString(record.slug, id),
            createdAt: readString(record.createdAt, now),
            updatedAt: readString(record.updatedAt, now),
          };
        })
        .filter((item): item is StoredBouquetCategoryStorage["custom"][number] =>
          Boolean(item),
        )
    : [];

  const overridesRaw = asRecord(raw.overrides) ?? {};
  const overrides: StoredBouquetCategoryStorage["overrides"] = {};

  for (const [key, item] of Object.entries(overridesRaw)) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }
    const name = readString(record.name).trim();
    if (!name) {
      continue;
    }
    overrides[key] = {
      name,
      slug: readString(record.slug, key),
      updatedAt: readString(record.updatedAt, new Date().toISOString()),
    };
  }

  return { custom, overrides };
}

/** Migrate legacy BouquetRecord[] from localStorage to stored shape. */
export function migrateLegacyBouquetRecords(
  records: BouquetRecord[],
): StoredBouquetRecord[] {
  return normalizeStoredBouquetRecords(
    records.map((record) => ({
      ...record,
      categoryId: record.category,
      images: normalizeBouquetImages(record.images).map((image, index) =>
        bouquetImageToStored(image, index),
      ),
      displayFlags: cloneBouquetDisplayFlags(record.displayFlags),
    })),
  );
}

export function bouquetImageToStored(
  image: BouquetImage,
  index?: number,
): StoredBouquetImage {
  return {
    id: image.id,
    url: image.url,
    name: image.name,
    isCover: image.isCover,
    order: typeof image.sortOrder === "number" ? image.sortOrder : (index ?? 0),
    originalUrl: image.variants?.original,
    optimizedUrl: image.variants?.optimized,
    aiProcessedUrl: image.variants?.aiProcessed,
    backgroundReplacedUrl: image.variants?.backgroundReplaced,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
    createdAt: image.createdAt,
  };
}

export function storedImageToBouquet(image: StoredBouquetImage): BouquetImage {
  const variants = {
    original: image.originalUrl,
    optimized: image.optimizedUrl,
    aiProcessed: image.aiProcessedUrl,
    backgroundReplaced: image.backgroundReplacedUrl,
  };

  const hasVariants = Object.values(variants).some(Boolean);

  return {
    id: image.id,
    url: image.url,
    name: image.name,
    isCover: image.isCover,
    sortOrder: image.order,
    createdAt: image.createdAt,
    variants: hasVariants ? variants : undefined,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
  };
}
