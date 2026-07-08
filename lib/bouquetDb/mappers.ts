import type {
  BouquetDraft,
  BouquetRecord,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  buildBouquetRecord,
  bouquetToDraft,
} from "@/components/adminApp/modules/bouquets/bouquetUtils";
import {
  bouquetImageToStored,
  normalizeStoredBouquetRecord,
  storedImageToBouquet,
} from "@/lib/bouquetDb/normalize";
import type { StoredBouquetRecord } from "@/lib/bouquetDb/types";

export function bouquetRecordToStored(record: BouquetRecord): StoredBouquetRecord {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    categoryId: record.category,
    description: record.description,
    basePrice: record.basePrice,
    status: record.status,
    displayFlags: record.displayFlags,
    displayPriority: record.displayPriority,
    badge: record.badge,
    images: record.images.map((image, index) => bouquetImageToStored(image, index)),
    sizes: record.sizes,
    seo: record.seo ?? {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function storedBouquetToRecord(stored: StoredBouquetRecord): BouquetRecord {
  return {
    id: stored.id,
    name: stored.name,
    slug: stored.slug,
    category: stored.categoryId,
    description: stored.description,
    basePrice: stored.basePrice,
    status: stored.status,
    displayFlags: stored.displayFlags,
    displayPriority: stored.displayPriority,
    badge: stored.badge,
    images: stored.images.map(storedImageToBouquet),
    sizes: stored.sizes,
    seo: stored.seo ?? {},
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

export function storedBouquetsToRecords(stored: StoredBouquetRecord[]): BouquetRecord[] {
  return stored.map(storedBouquetToRecord);
}

export function bouquetDraftToStored(
  draft: BouquetDraft,
  existing: BouquetRecord[],
  id?: string,
): StoredBouquetRecord {
  return bouquetRecordToStored(buildBouquetRecord(draft, existing, id));
}

export function normalizeIncomingStoredBouquet(value: unknown): StoredBouquetRecord | null {
  return normalizeStoredBouquetRecord(value);
}

export function storedBouquetToDraft(stored: StoredBouquetRecord): BouquetDraft {
  return bouquetToDraft(storedBouquetToRecord(stored));
}
