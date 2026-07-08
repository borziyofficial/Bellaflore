// ==================================================
// SECTION: Bouquet repository — local adapter (Stage 2.7)
// ==================================================
import {
  bulkDeleteAdminBouquets,
  bulkSetAdminBouquetStatus,
  deleteAdminBouquet,
  duplicateAdminBouquet,
  getAdminBouquetDraftById,
  hideAdminBouquet,
  readAdminBouquets,
  setAdminBouquetStatus,
  upsertAdminBouquet,
  writeAdminBouquets,
} from "@/components/adminApp/modules/bouquets/bouquetStore";
import type {
  AdminBouquetCategory,
  AdminBouquetCategoryOverride,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import {
  addAdminBouquetCategory,
  ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY,
  readAdminBouquetCategories,
  renameAdminBouquetCategory,
  resolveAdminBouquetCategoryName,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryStore";
import type {
  BouquetDraft,
  BouquetRecord,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import type { StoredBouquetCategoryStorage } from "@/lib/bouquetDb/types";

export type BouquetPersistenceMode = "api" | "local";

function readCategoryStorageRaw(): StoredBouquetCategoryStorage {
  if (typeof window === "undefined") {
    return { custom: [], overrides: {} };
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY);
    if (!raw) {
      return { custom: [], overrides: {} };
    }
    const parsed = JSON.parse(raw) as Partial<StoredBouquetCategoryStorage>;
    return {
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
    };
  } catch {
    return { custom: [], overrides: {} };
  }
}

function writeCategoryStorageRaw(storage: StoredBouquetCategoryStorage): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY,
      JSON.stringify(storage),
    );
    window.dispatchEvent(new Event("admin-bouquet-categories-change"));
  } catch {
    // Optional admin storage.
  }
}

export const localBouquetAdapter = {
  listBouquets(): BouquetRecord[] {
    return readAdminBouquets();
  },

  writeBouquets(bouquets: BouquetRecord[]): void {
    writeAdminBouquets(bouquets);
  },

  upsertBouquet(
    bouquets: BouquetRecord[],
    draft: BouquetDraft,
    id?: string,
  ): BouquetRecord[] {
    return upsertAdminBouquet(bouquets, draft, id);
  },

  duplicateBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
    return duplicateAdminBouquet(bouquets, id);
  },

  hideBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
    return hideAdminBouquet(bouquets, id);
  },

  setBouquetStatus(
    bouquets: BouquetRecord[],
    id: string,
    status: BouquetStatus,
  ): BouquetRecord[] {
    return setAdminBouquetStatus(bouquets, id, status);
  },

  bulkSetStatus(
    bouquets: BouquetRecord[],
    ids: string[],
    status: BouquetStatus,
  ): BouquetRecord[] {
    return bulkSetAdminBouquetStatus(bouquets, ids, status);
  },

  deleteBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
    return deleteAdminBouquet(bouquets, id);
  },

  bulkDelete(bouquets: BouquetRecord[], ids: string[]): BouquetRecord[] {
    return bulkDeleteAdminBouquets(bouquets, ids);
  },

  getDraftById(bouquets: BouquetRecord[], id: string): BouquetDraft | null {
    return getAdminBouquetDraftById(bouquets, id);
  },

  listCategories(): AdminBouquetCategory[] {
    return readAdminBouquetCategories();
  },

  readCategoryStorage(): StoredBouquetCategoryStorage {
    return readCategoryStorageRaw();
  },

  writeCategoryStorage(storage: StoredBouquetCategoryStorage): void {
    writeCategoryStorageRaw(storage);
  },

  addCategory(name: string): AdminBouquetCategory {
    return addAdminBouquetCategory(name);
  },

  renameCategory(categoryId: string, name: string): AdminBouquetCategory | null {
    return renameAdminBouquetCategory(categoryId, name);
  },

  resolveCategoryName(categoryId: string): string {
    return resolveAdminBouquetCategoryName(categoryId);
  },
};

export type { AdminBouquetCategoryOverride };
