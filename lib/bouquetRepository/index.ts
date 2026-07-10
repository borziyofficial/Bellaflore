// ==================================================
// SECTION: Bouquet repository — hybrid service layer (Stage 2.7)
// ==================================================
import type {
  AdminBouquetCategory,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import type {
  BouquetDraft,
  BouquetRecord,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { bouquetRecordToStored } from "@/lib/bouquetDb/mappers";
import type { StoredBouquetCategoryStorage } from "@/lib/bouquetDb/types";
import {
  apiListBouquets,
  apiReadCategoryStorage,
  apiSyncBouquets,
  apiWriteCategoryStorage,
  probeBouquetApi,
} from "@/lib/bouquetRepository/apiAdapter";
import {
  localBouquetAdapter,
  type BouquetPersistenceMode,
} from "@/lib/bouquetRepository/localAdapter";

let persistenceMode: BouquetPersistenceMode = "local";
let initializePromise: Promise<BouquetRecord[]> | null = null;
let lastSyncError: string | null = null;

export const BOUQUET_SYNC_STATUS_EVENT = "admin-bouquet-sync-status-change";

export function getBouquetPersistenceMode(): BouquetPersistenceMode {
  return persistenceMode;
}

export function getBouquetSyncError(): string | null {
  return lastSyncError;
}

function setSyncError(message: string | null): void {
  if (lastSyncError === message) {
    return;
  }

  lastSyncError = message;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BOUQUET_SYNC_STATUS_EVENT));
  }
}

async function migrateLocalBouquetsToApi(local: BouquetRecord[]): Promise<BouquetRecord[]> {
  if (local.length === 0) {
    return [];
  }

  await apiSyncBouquets(local);
  localBouquetAdapter.writeBouquets(local);
  return local;
}

async function migrateLocalCategoriesToApi(): Promise<void> {
  const localStorage = localBouquetAdapter.readCategoryStorage();
  const hasData =
    localStorage.custom.length > 0 || Object.keys(localStorage.overrides).length > 0;
  if (!hasData) {
    return;
  }

  const serverStorage = await apiReadCategoryStorage();
  const serverHasData =
    serverStorage.custom.length > 0 ||
    Object.keys(serverStorage.overrides).length > 0;

  if (!serverHasData) {
    await apiWriteCategoryStorage(localStorage);
  }
}

export async function initializeBouquetRepository(): Promise<BouquetRecord[]> {
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    const local = localBouquetAdapter.listBouquets();
    const probe = await probeBouquetApi();

    if (!probe.available) {
      persistenceMode = "local";
      setSyncError(probe.message);
      return local;
    }

    try {
      const { bouquets: serverBouquets } = await apiListBouquets();

      if (serverBouquets.length === 0 && local.length > 0) {
        persistenceMode = "api";
        setSyncError(null);
        return migrateLocalBouquetsToApi(local);
      }

      if (serverBouquets.length > 0) {
        localBouquetAdapter.writeBouquets(serverBouquets);
        persistenceMode = "api";
        setSyncError(null);
        await migrateLocalCategoriesToApi();
        return serverBouquets;
      }

      persistenceMode = "api";
      setSyncError(null);
      await migrateLocalCategoriesToApi();
      return serverBouquets;
    } catch {
      persistenceMode = "local";
      setSyncError(
        "Не удалось загрузить букеты с сервера. Показаны локальные данные.",
      );
      return local;
    }
  })();

  return initializePromise;
}

function persistBouquets(next: BouquetRecord[]): BouquetRecord[] {
  localBouquetAdapter.writeBouquets(next);

  if (persistenceMode === "api") {
    void apiSyncBouquets(next)
      .then(() => setSyncError(null))
      .catch(() => {
        // Keep local cache if API sync fails temporarily.
        setSyncError(
          "Не удалось синхронизировать букеты с сервером. Изменения сохранены локально.",
        );
      });
  }

  return next;
}

export function listBouquets(): BouquetRecord[] {
  return localBouquetAdapter.listBouquets();
}

export function writeBouquets(next: BouquetRecord[]): BouquetRecord[] {
  return persistBouquets(next);
}

export function upsertBouquet(
  bouquets: BouquetRecord[],
  draft: BouquetDraft,
  id?: string,
): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.upsertBouquet(bouquets, draft, id));
}

export function duplicateBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.duplicateBouquet(bouquets, id));
}

export function hideBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.hideBouquet(bouquets, id));
}

export function setBouquetStatus(
  bouquets: BouquetRecord[],
  id: string,
  status: BouquetStatus,
): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.setBouquetStatus(bouquets, id, status));
}

export function bulkSetBouquetStatus(
  bouquets: BouquetRecord[],
  ids: string[],
  status: BouquetStatus,
): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.bulkSetStatus(bouquets, ids, status));
}

export function deleteBouquet(bouquets: BouquetRecord[], id: string): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.deleteBouquet(bouquets, id));
}

export function bulkDeleteBouquets(bouquets: BouquetRecord[], ids: string[]): BouquetRecord[] {
  return persistBouquets(localBouquetAdapter.bulkDelete(bouquets, ids));
}

export function getBouquetDraftById(
  bouquets: BouquetRecord[],
  id: string,
): BouquetDraft | null {
  return localBouquetAdapter.getDraftById(bouquets, id);
}

export function listCategories(): AdminBouquetCategory[] {
  return localBouquetAdapter.listCategories();
}

function persistCategoryStorage(storage: StoredBouquetCategoryStorage): void {
  localBouquetAdapter.writeCategoryStorage(storage);

  if (persistenceMode === "api") {
    void apiWriteCategoryStorage(storage)
      .then(() => setSyncError(null))
      .catch(() => {
        // Keep local cache if API sync fails temporarily.
        setSyncError(
          "Не удалось синхронизировать категории с сервером. Изменения сохранены локально.",
        );
      });
  }
}

export async function initializeCategoryRepository(): Promise<AdminBouquetCategory[]> {
  await initializeBouquetRepository();

  if (persistenceMode !== "api") {
    return localBouquetAdapter.listCategories();
  }

  try {
    const serverStorage = await apiReadCategoryStorage();
    const localStorage = localBouquetAdapter.readCategoryStorage();
    const serverHasData =
      serverStorage.custom.length > 0 ||
      Object.keys(serverStorage.overrides).length > 0;
    const localHasData =
      localStorage.custom.length > 0 ||
      Object.keys(localStorage.overrides).length > 0;

    if (!serverHasData && localHasData) {
      persistCategoryStorage(localStorage);
    } else if (serverHasData) {
      localBouquetAdapter.writeCategoryStorage(serverStorage);
    }
  } catch {
    // Fall back to local categories.
  }

  return localBouquetAdapter.listCategories();
}

export function addCategory(name: string): AdminBouquetCategory | null {
  try {
    const category = localBouquetAdapter.addCategory(name);
    persistCategoryStorage(localBouquetAdapter.readCategoryStorage());
    return category;
  } catch {
    return null;
  }
}

export function renameCategory(
  categoryId: string,
  name: string,
): AdminBouquetCategory | null {
  const category = localBouquetAdapter.renameCategory(categoryId, name);
  if (category) {
    persistCategoryStorage(localBouquetAdapter.readCategoryStorage());
  }
  return category;
}

export function resolveCategoryName(categoryId: string): string {
  return localBouquetAdapter.resolveCategoryName(categoryId);
}

/** Export stored shape for diagnostics. */
export function toStoredBouquets(records: BouquetRecord[]) {
  return records.map(bouquetRecordToStored);
}
