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

export const ADMIN_CATALOG_CACHE_STALE_MS = 30_000;

export function shouldReuseAdminCatalogCache(
  cache: AdminCatalogCacheState,
  now: number,
  options?: { force?: boolean },
): boolean {
  if (options?.force || !cache.hasFetchedOnce || cache.loadError) {
    return false;
  }

  return now - cache.lastFetchedAt <= ADMIN_CATALOG_CACHE_STALE_MS;
}

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
