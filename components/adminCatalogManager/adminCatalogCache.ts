// ==================================================
// SECTION: Admin Catalog Manager — session-lived product cache
// РАЗДЕЛ: Кэш товаров каталога на время сессии администратора
//
// Purpose (EN): Keep the admin product list warm across client-side route
// navigation (Букеты ↔ Добавить ↔ Профиль ↔ ...). Without this, every page
// remount re-fetched the entire catalog from scratch, blocking the UI each
// time. Data is still real (Postgres/Neon) — this only avoids re-fetching
// it more often than needed within one admin session.
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { fetchAdminCatalogProducts } from "@/components/adminCatalogManager/catalogApiClient";

const STALE_AFTER_MS = 30_000;

type CacheState = {
  products: CatalogProductRecord[];
  imageStorageWarning: string | null;
  loadError: string | null;
  hasFetchedOnce: boolean;
  lastFetchedAt: number;
};

const state: CacheState = {
  products: [],
  imageStorageWarning: null,
  loadError: null,
  hasFetchedOnce: false,
  lastFetchedAt: 0,
};

let inFlight: Promise<void> | null = null;

export const ADMIN_CATALOG_CACHE_EVENT = "admin-catalog-cache-change";

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_CATALOG_CACHE_EVENT));
  }
}

export function getCachedProducts(): CatalogProductRecord[] {
  return state.products;
}

export function getCachedImageStorageWarning(): string | null {
  return state.imageStorageWarning;
}

export function getCachedLoadError(): string | null {
  return state.loadError;
}

export function hasCatalogFetchedOnce(): boolean {
  return state.hasFetchedOnce;
}

async function performFetch(): Promise<void> {
  try {
    const response = await fetchAdminCatalogProducts();
    state.products = response.products;
    state.imageStorageWarning = response.imageStorageWarning ?? null;
    state.loadError = null;
  } catch (error) {
    state.loadError =
      error instanceof Error ? error.message : "База данных каталога не настроена.";
    state.products = [];
  } finally {
    state.hasFetchedOnce = true;
    state.lastFetchedAt = Date.now();
    notifyChange();
  }
}

/**
 * Ensures the catalog has been loaded at least once. Returns immediately
 * (no network) if a fresh-enough copy is already cached — this is what
 * prevents duplicate identical requests when switching between admin
 * sections. Pass `force: true` to bypass the staleness check (used after
 * mutations, and for pull-to-refresh style manual reloads).
 */
export function ensureCatalogLoaded(options?: { force?: boolean }): Promise<void> {
  const isStale = Date.now() - state.lastFetchedAt > STALE_AFTER_MS;

  if (state.hasFetchedOnce && !options?.force && !isStale) {
    return Promise.resolve();
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = performFetch().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function refreshCatalog(): Promise<void> {
  return ensureCatalogLoaded({ force: true });
}

/** Fire-and-forget warm-up, safe to call from anywhere (e.g. shell mount). */
export function prefetchAdminCatalog(): void {
  void ensureCatalogLoaded();
}
