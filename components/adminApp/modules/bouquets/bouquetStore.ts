// ==================================================
// SECTION: ADMIN APP — Bouquet local store (Stage 2.1)
// ==================================================
import { cloneBouquetImages, normalizeBouquetImages } from "@/components/adminApp/modules/bouquets/bouquetImageUtils";
import {
  cloneBouquetDisplayFlags,
  normalizeBouquetBadge,
  normalizeBouquetDisplayFlags,
  normalizeBouquetDisplayPriority,
  normalizeBouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetManageUtils";
import { cloneBouquetSizes, normalizeBouquetSizes } from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type { BouquetDraft, BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  buildBouquetRecord,
  bouquetToDraft,
  createBouquetId,
  createUniqueBouquetSlug,
} from "@/components/adminApp/modules/bouquets/bouquetUtils";

export const ADMIN_BOUQUETS_STORAGE_KEY = "bellaflore_admin_bouquets_v1";

export function readAdminBouquets(): BouquetRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_BOUQUETS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as BouquetRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,
      status: normalizeBouquetStatus(item.status),
      displayFlags: normalizeBouquetDisplayFlags(item.displayFlags),
      displayPriority: normalizeBouquetDisplayPriority(item.displayPriority),
      badge: normalizeBouquetBadge(item.badge),
      images: normalizeBouquetImages(item.images),
      sizes: normalizeBouquetSizes(item.sizes),
      seo: item.seo ?? {},
    }));
  } catch {
    return [];
  }
}

export function writeAdminBouquets(bouquets: BouquetRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ADMIN_BOUQUETS_STORAGE_KEY, JSON.stringify(bouquets));
  } catch {
    // Optional admin storage.
  }
}

export function upsertAdminBouquet(
  bouquets: BouquetRecord[],
  draft: BouquetDraft,
  id?: string,
): BouquetRecord[] {
  const record = buildBouquetRecord(draft, bouquets, id);
  const without = bouquets.filter((item) => item.id !== record.id);
  return [record, ...without].sort(
    (left, right) => right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function duplicateAdminBouquet(
  bouquets: BouquetRecord[],
  id: string,
): BouquetRecord[] {
  const source = bouquets.find((item) => item.id === id);
  if (!source) {
    return bouquets;
  }

  const copyName = `${source.name} (копия)`;
  const now = new Date().toISOString();
  const copy: BouquetRecord = {
    ...source,
    id: createBouquetId(),
    name: copyName,
    slug: createUniqueBouquetSlug(copyName, bouquets),
    status: "draft",
    displayFlags: cloneBouquetDisplayFlags(normalizeBouquetDisplayFlags(source.displayFlags)),
    displayPriority: normalizeBouquetDisplayPriority(source.displayPriority),
    badge: normalizeBouquetBadge(source.badge),
    images: cloneBouquetImages(normalizeBouquetImages(source.images)),
    sizes: cloneBouquetSizes(normalizeBouquetSizes(source.sizes)),
    createdAt: now,
    updatedAt: now,
  };

  return [copy, ...bouquets];
}

export function hideAdminBouquet(
  bouquets: BouquetRecord[],
  id: string,
): BouquetRecord[] {
  return setAdminBouquetStatus(bouquets, id, "hidden");
}

export function setAdminBouquetStatus(
  bouquets: BouquetRecord[],
  id: string,
  status: BouquetRecord["status"],
): BouquetRecord[] {
  const now = new Date().toISOString();
  return bouquets.map((item) =>
    item.id === id ? { ...item, status, updatedAt: now } : item,
  );
}

export function bulkSetAdminBouquetStatus(
  bouquets: BouquetRecord[],
  ids: string[],
  status: BouquetRecord["status"],
): BouquetRecord[] {
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  return bouquets.map((item) =>
    idSet.has(item.id) ? { ...item, status, updatedAt: now } : item,
  );
}

export function bulkDeleteAdminBouquets(
  bouquets: BouquetRecord[],
  ids: string[],
): BouquetRecord[] {
  const idSet = new Set(ids);
  return bouquets.filter((item) => !idSet.has(item.id));
}

export function deleteAdminBouquet(
  bouquets: BouquetRecord[],
  id: string,
): BouquetRecord[] {
  return bouquets.filter((item) => item.id !== id);
}

export function getAdminBouquetDraftById(
  bouquets: BouquetRecord[],
  id: string,
): BouquetDraft | null {
  const bouquet = bouquets.find((item) => item.id === id);
  return bouquet ? bouquetToDraft(bouquet) : null;
}
