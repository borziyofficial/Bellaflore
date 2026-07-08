import {
  allowFileBouquetFallback,
  isBouquetDatabaseConfigured,
} from "@/lib/bouquetDb/config";
import {
  fileBulkDeleteBouquets,
  fileBulkSetBouquetStatus,
  fileDeleteBouquet,
  fileGetBouquetById,
  fileListBouquets,
  fileReadCategoryStorage,
  fileReplaceBouquets,
  fileUpsertBouquet,
  fileWriteCategoryStorage,
} from "@/lib/bouquetDb/fileAdapter";
import {
  postgresBulkDeleteBouquets,
  postgresBulkSetBouquetStatus,
  postgresDeleteBouquet,
  postgresGetBouquetById,
  postgresListBouquets,
  postgresReadCategoryStorage,
  postgresReplaceBouquets,
  postgresUpsertBouquet,
  postgresWriteCategoryStorage,
} from "@/lib/bouquetDb/postgresAdapter";
import {
  BouquetDatabaseNotConfiguredError,
  type StoredBouquetCategoryStorage,
  type StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

export {
  BouquetDatabaseNotConfiguredError,
  type StoredBouquetCategoryStorage,
  type StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

function assertBouquetDatabaseAvailable(): void {
  if (isBouquetDatabaseConfigured() || allowFileBouquetFallback()) {
    return;
  }

  throw new BouquetDatabaseNotConfiguredError();
}

export function getBouquetDatabaseMode(): "postgres" | "file" | "unconfigured" {
  if (isBouquetDatabaseConfigured()) {
    return "postgres";
  }

  if (allowFileBouquetFallback()) {
    return "file";
  }

  return "unconfigured";
}

export async function listBouquets(): Promise<StoredBouquetRecord[]> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresListBouquets();
  }

  return fileListBouquets();
}

export async function getBouquetById(id: string): Promise<StoredBouquetRecord | null> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresGetBouquetById(id);
  }

  return fileGetBouquetById(id);
}

export async function upsertBouquet(
  record: StoredBouquetRecord,
): Promise<StoredBouquetRecord> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresUpsertBouquet(record);
  }

  return fileUpsertBouquet(record);
}

export async function replaceBouquets(
  records: StoredBouquetRecord[],
): Promise<StoredBouquetRecord[]> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresReplaceBouquets(records);
  }

  return fileReplaceBouquets(records);
}

export async function deleteBouquet(id: string): Promise<boolean> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresDeleteBouquet(id);
  }

  return fileDeleteBouquet(id);
}

export async function bulkSetBouquetStatus(
  ids: string[],
  status: StoredBouquetRecord["status"],
): Promise<StoredBouquetRecord[]> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresBulkSetBouquetStatus(ids, status);
  }

  return fileBulkSetBouquetStatus(ids, status);
}

export async function bulkDeleteBouquets(
  ids: string[],
): Promise<StoredBouquetRecord[]> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresBulkDeleteBouquets(ids);
  }

  return fileBulkDeleteBouquets(ids);
}

export async function readCategoryStorage(): Promise<StoredBouquetCategoryStorage> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresReadCategoryStorage();
  }

  return fileReadCategoryStorage();
}

export async function writeCategoryStorage(
  storage: StoredBouquetCategoryStorage,
): Promise<StoredBouquetCategoryStorage> {
  assertBouquetDatabaseAvailable();

  if (isBouquetDatabaseConfigured()) {
    return postgresWriteCategoryStorage(storage);
  }

  return fileWriteCategoryStorage(storage);
}
