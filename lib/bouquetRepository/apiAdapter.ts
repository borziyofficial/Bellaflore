// ==================================================
// SECTION: Bouquet repository — API adapter (Stage 2.7)
// ==================================================
import type { BouquetDraft, BouquetRecord } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  bouquetDraftToStored,
  bouquetRecordToStored,
  storedBouquetsToRecords,
} from "@/lib/bouquetDb/mappers";
import type { StoredBouquetCategoryStorage } from "@/lib/bouquetDb/types";
import type { BouquetPersistenceMode } from "@/lib/bouquetRepository/localAdapter";

type ApiListResponse = {
  bouquets: unknown[];
  mode?: string;
};

type ApiCategoryResponse = {
  storage: StoredBouquetCategoryStorage;
  mode?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function probeBouquetApi(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/bouquets", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiListBouquets(): Promise<{
  bouquets: BouquetRecord[];
  mode: BouquetPersistenceMode | "unconfigured";
}> {
  const response = await fetch("/api/admin/bouquets", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("bouquet-api-list-failed");
  }

  const payload = await parseJson<ApiListResponse>(response);
  return {
    bouquets: storedBouquetsToRecords((payload?.bouquets ?? []) as never[]),
    mode: payload?.mode === "postgres" || payload?.mode === "file" ? "api" : "api",
  };
}

export async function apiSyncBouquets(bouquets: BouquetRecord[]): Promise<BouquetRecord[]> {
  const response = await fetch("/api/admin/bouquets", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bouquets: bouquets.map(bouquetRecordToStored),
    }),
  });

  if (!response.ok) {
    throw new Error("bouquet-api-sync-failed");
  }

  const payload = await parseJson<ApiListResponse>(response);
  return storedBouquetsToRecords((payload?.bouquets ?? []) as never[]);
}

export async function apiUpsertBouquet(
  draft: BouquetDraft,
  existing: BouquetRecord[],
  id?: string,
): Promise<BouquetRecord> {
  const response = await fetch("/api/admin/bouquets", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft,
      id,
    }),
  });

  if (!response.ok) {
    throw new Error("bouquet-api-upsert-failed");
  }

  const payload = await parseJson<{ bouquet: unknown }>(response);
  const records = storedBouquetsToRecords(
    payload?.bouquet ? [payload.bouquet as never] : [],
  );
  if (!records[0]) {
    const fallback = bouquetDraftToStored(draft, existing, id);
    return storedBouquetsToRecords([fallback])[0];
  }
  return records[0];
}

export async function apiReadCategoryStorage(): Promise<StoredBouquetCategoryStorage> {
  const response = await fetch("/api/admin/bouquet-categories", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("bouquet-category-api-read-failed");
  }

  const payload = await parseJson<ApiCategoryResponse>(response);
  return payload?.storage ?? { custom: [], overrides: {} };
}

export async function apiWriteCategoryStorage(
  storage: StoredBouquetCategoryStorage,
): Promise<StoredBouquetCategoryStorage> {
  const response = await fetch("/api/admin/bouquet-categories", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storage }),
  });

  if (!response.ok) {
    throw new Error("bouquet-category-api-write-failed");
  }

  const payload = await parseJson<ApiCategoryResponse>(response);
  return payload?.storage ?? storage;
}
