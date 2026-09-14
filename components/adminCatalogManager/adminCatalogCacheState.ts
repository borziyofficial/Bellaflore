import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

export type AdminCatalogCacheState = {
  products: CatalogProductRecord[];
  imageStorageWarning: string | null;
  loadError: string | null;
  hasFetchedOnce: boolean;
  lastFetchedAt: number;
};

type AdminCatalogFetchResponse = {
  products: CatalogProductRecord[];
  imageStorageWarning?: string | null;
};

export async function fetchAdminCatalogCacheState(
  current: AdminCatalogCacheState,
  fetchCatalog: () => Promise<AdminCatalogFetchResponse>,
  now = Date.now(),
): Promise<AdminCatalogCacheState> {
  try {
    const response = await fetchCatalog();
    return {
      products: response.products,
      imageStorageWarning: response.imageStorageWarning ?? null,
      loadError: null,
      hasFetchedOnce: true,
      lastFetchedAt: now,
    };
  } catch (error) {
    return {
      ...current,
      loadError:
        error instanceof Error ? error.message : "База данных каталога не настроена.",
      hasFetchedOnce: true,
      lastFetchedAt: now,
    };
  }
}
