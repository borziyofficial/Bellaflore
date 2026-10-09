import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADMIN_CATALOG_CACHE_STALE_MS,
  shouldReuseAdminCatalogCache,
  type AdminCatalogCacheState,
} from "../../components/adminCatalogManager/adminCatalogCacheState.ts";

function cache(patch: Partial<AdminCatalogCacheState> = {}): AdminCatalogCacheState {
  return {
    products: [],
    imageStorageWarning: null,
    loadError: null,
    hasFetchedOnce: true,
    lastFetchedAt: 1_000,
    ...patch,
  };
}

test("a failed catalog load is not reused as an empty catalog", () => {
  const failed = cache({
    loadError: "Запрос занял слишком много времени. Проверьте соединение и повторите.",
  });

  assert.equal(shouldReuseAdminCatalogCache(failed, 1_000 + 1_000), false);
});

test("a fresh successful catalog load is reused", () => {
  assert.equal(
    shouldReuseAdminCatalogCache(cache(), 1_000 + ADMIN_CATALOG_CACHE_STALE_MS),
    true,
  );
});

test("a stale catalog load is fetched again", () => {
  assert.equal(
    shouldReuseAdminCatalogCache(cache(), 1_000 + ADMIN_CATALOG_CACHE_STALE_MS + 1),
    false,
  );
});
