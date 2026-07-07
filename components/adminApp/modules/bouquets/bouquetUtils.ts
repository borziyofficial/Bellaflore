// ==================================================
// SECTION: ADMIN APP — Bouquet helpers
// ==================================================
import { normalizeBouquetImages } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  cloneBouquetDisplayFlags,
  normalizeBouquetBadge,
  normalizeBouquetDisplayFlags,
  normalizeBouquetDisplayPriority,
  normalizeBouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetManageUtils";
import { normalizeBouquetSizes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type { BouquetDraft, BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";

export function slugifyBouquetName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "bouquet";
}

export function createUniqueBouquetSlug(
  name: string,
  existing: BouquetRecord[],
  excludeId?: string,
): string {
  const base = slugifyBouquetName(name);
  const taken = new Set(
    existing.filter((item) => item.id !== excludeId).map((item) => item.slug),
  );

  if (!taken.has(base)) {
    return base;
  }

  let index = 2;
  while (taken.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

export function createBouquetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `bouquet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function buildBouquetRecord(
  draft: BouquetDraft,
  existing: BouquetRecord[],
  existingId?: string,
): BouquetRecord {
  const now = new Date().toISOString();
  const id = existingId ?? createBouquetId();
  const previous = existing.find((item) => item.id === id);

  return {
    id,
    name: draft.name.trim(),
    slug: createUniqueBouquetSlug(draft.name, existing, id),
    category: draft.category,
    description: draft.description.trim(),
    basePrice: draft.basePrice,
    status: normalizeBouquetStatus(draft.status),
    displayFlags: normalizeBouquetDisplayFlags(draft.displayFlags ?? previous?.displayFlags),
    displayPriority: normalizeBouquetDisplayPriority(
      draft.displayPriority ?? previous?.displayPriority,
    ),
    badge: normalizeBouquetBadge(draft.badge ?? previous?.badge),
    images: normalizeBouquetImages(draft.images ?? previous?.images),
    sizes: normalizeBouquetSizes(draft.sizes ?? previous?.sizes),
    seo: previous?.seo ?? {},
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

export function bouquetToDraft(bouquet: BouquetRecord): BouquetDraft {
  return {
    name: bouquet.name,
    category: bouquet.category,
    description: bouquet.description,
    basePrice: bouquet.basePrice,
    status: normalizeBouquetStatus(bouquet.status),
    displayFlags: cloneBouquetDisplayFlags(normalizeBouquetDisplayFlags(bouquet.displayFlags)),
    displayPriority: normalizeBouquetDisplayPriority(bouquet.displayPriority),
    badge: normalizeBouquetBadge(bouquet.badge),
    images: normalizeBouquetImages(bouquet.images),
    sizes: normalizeBouquetSizes(bouquet.sizes),
  };
}

export function formatBouquetPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}
