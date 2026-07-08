import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  normalizeStoredBouquetRecords,
  normalizeStoredCategoryStorage,
} from "@/lib/bouquetDb/normalize";
import type {
  StoredBouquetCategoryStorage,
  StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

const DATA_DIR = join(process.cwd(), ".data");
const BOUQUETS_FILE = join(DATA_DIR, "bouquet-records.json");
const CATEGORIES_FILE = join(DATA_DIR, "bouquet-categories.json");

async function ensureBouquetsFile(): Promise<StoredBouquetRecord[]> {
  try {
    const raw = await readFile(BOUQUETS_FILE, "utf8");
    return normalizeStoredBouquetRecords(JSON.parse(raw) as unknown);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(BOUQUETS_FILE, "[]", "utf8");
    return [];
  }
}

async function writeBouquets(records: StoredBouquetRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(BOUQUETS_FILE, JSON.stringify(records, null, 2), "utf8");
}

async function ensureCategoriesFile(): Promise<StoredBouquetCategoryStorage> {
  try {
    const raw = await readFile(CATEGORIES_FILE, "utf8");
    return normalizeStoredCategoryStorage(JSON.parse(raw) as unknown);
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    const empty: StoredBouquetCategoryStorage = { custom: [], overrides: {} };
    await writeFile(CATEGORIES_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

async function writeCategories(storage: StoredBouquetCategoryStorage): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CATEGORIES_FILE, JSON.stringify(storage, null, 2), "utf8");
}

function sortBouquets(records: StoredBouquetRecord[]): StoredBouquetRecord[] {
  return [...records].sort(
    (left, right) => right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function fileListBouquets(): Promise<StoredBouquetRecord[]> {
  return sortBouquets(await ensureBouquetsFile());
}

export async function fileGetBouquetById(
  id: string,
): Promise<StoredBouquetRecord | null> {
  const records = await ensureBouquetsFile();
  return records.find((record) => record.id === id) ?? null;
}

export async function fileUpsertBouquet(
  record: StoredBouquetRecord,
): Promise<StoredBouquetRecord> {
  const records = await ensureBouquetsFile();
  const index = records.findIndex((item) => item.id === record.id);
  const next =
    index === -1
      ? [...records, record]
      : records.map((item, itemIndex) => (itemIndex === index ? record : item));

  await writeBouquets(sortBouquets(next));
  return record;
}

export async function fileReplaceBouquets(
  records: StoredBouquetRecord[],
): Promise<StoredBouquetRecord[]> {
  const normalized = sortBouquets(normalizeStoredBouquetRecords(records));
  await writeBouquets(normalized);
  return normalized;
}

export async function fileDeleteBouquet(id: string): Promise<boolean> {
  const records = await ensureBouquetsFile();
  const next = records.filter((record) => record.id !== id);
  if (next.length === records.length) {
    return false;
  }
  await writeBouquets(next);
  return true;
}

export async function fileBulkSetBouquetStatus(
  ids: string[],
  status: StoredBouquetRecord["status"],
): Promise<StoredBouquetRecord[]> {
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  const records = await ensureBouquetsFile();
  const next = records.map((record) =>
    idSet.has(record.id) ? { ...record, status, updatedAt: now } : record,
  );
  await writeBouquets(next);
  return sortBouquets(next);
}

export async function fileBulkDeleteBouquets(ids: string[]): Promise<StoredBouquetRecord[]> {
  const idSet = new Set(ids);
  const records = await ensureBouquetsFile();
  const next = records.filter((record) => !idSet.has(record.id));
  await writeBouquets(next);
  return sortBouquets(next);
}

export async function fileReadCategoryStorage(): Promise<StoredBouquetCategoryStorage> {
  return ensureCategoriesFile();
}

export async function fileWriteCategoryStorage(
  storage: StoredBouquetCategoryStorage,
): Promise<StoredBouquetCategoryStorage> {
  const normalized = normalizeStoredCategoryStorage(storage);
  await writeCategories(normalized);
  return normalized;
}
