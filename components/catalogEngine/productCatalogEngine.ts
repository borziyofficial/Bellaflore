// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Product Catalog Engine
//
// Purpose (EN): Unified Product Engine — CRUD-ready catalog source of truth.
//
// Назначение (RU): Единый Product Engine — source of truth каталога.
// ==================================================
import {
  archiveCatalogProduct,
  mergeCatalogSnapshots,
  readCatalogAdminOverride,
  removeCatalogProduct,
  setCatalogProductPublished,
  upsertCatalogProduct,
  writeCatalogAdminOverride,
} from "@/components/catalogEngine/catalogAdminStore";
import {
  bootstrapCatalogFromLegacy,
  CATALOG_ENGINE_VERSION,
  getDefaultCatalogSnapshot,
} from "@/components/catalogEngine/catalogBootstrap";
import type {
  CatalogEngineSnapshot,
  CatalogProductRecord,
  CatalogProductUpsertInput,
} from "@/components/catalogEngine/catalogTypes";
import { applyCatalogFilters } from "@/components/catalogEngine/filtersEngine";
import type { CatalogFilterState } from "@/components/catalogEngine/catalogTypes";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import { productBelongsToCategory } from "@/components/catalogEngine/categoriesEngine";
import type { CatalogProduct } from "@/data/catalogProducts";
import { catalogProducts as legacyCatalogSeed } from "@/data/catalogProducts";

let cachedSnapshot: CatalogEngineSnapshot | null = null;

function buildSearchIndexText(product: CatalogProductRecord): string {
  if (product.searchIndexText) {
    return product.searchIndexText;
  }

  return [
    product.title,
    product.shortDescription,
    product.fullDescription,
    product.metadata.composition ?? "",
    product.tags.join(" "),
    product.colors.join(" "),
    product.flowerTypes.join(" "),
    product.searchTerms.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function persistCatalogSnapshot(snapshot: CatalogEngineSnapshot): void {
  writeCatalogAdminOverride(snapshot);
  cachedSnapshot = hydrateSnapshot(snapshot);
}

function normalizeUpsertInput(
  input: CatalogProductUpsertInput,
): CatalogProductRecord {
  const now = new Date().toISOString();

  return {
    ...input,
    searchIndexText: "",
    metadata: {
      catalogVersion: CATALOG_ENGINE_VERSION,
      createdAt: input.metadata?.createdAt ?? now,
      updatedAt: now,
      legacyCategory: input.metadata?.legacyCategory,
      stemCount: input.metadata?.stemCount,
    },
  };
}

function hydrateSnapshot(snapshot: CatalogEngineSnapshot): CatalogEngineSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.map((product) => ({
      ...product,
      searchIndexText:
        product.searchIndexText || buildSearchIndexText(product),
    })),
  };
}

export function getCatalogEngineSnapshot(
  legacySeed: CatalogProduct[] = legacyCatalogSeed,
): CatalogEngineSnapshot {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const base = hydrateSnapshot(getDefaultCatalogSnapshot(legacySeed));
  const override = readCatalogAdminOverride();
  cachedSnapshot = hydrateSnapshot(mergeCatalogSnapshots(base, override));
  return cachedSnapshot;
}

export function refreshCatalogEngineSnapshot(
  legacySeed: CatalogProduct[] = legacyCatalogSeed,
): CatalogEngineSnapshot {
  cachedSnapshot = null;
  return getCatalogEngineSnapshot(legacySeed);
}

export function getAllCatalogProducts(): CatalogProductRecord[] {
  return getCatalogEngineSnapshot().products;
}

export function getPublishedCatalogProducts(): CatalogProductRecord[] {
  return getAllCatalogProducts().filter((product) =>
    isProductVisibleInCatalog(product.availability, product.isPublished),
  );
}

export function getCatalogProductById(
  productId: string,
): CatalogProductRecord | null {
  return getAllCatalogProducts().find((product) => product.id === productId) ?? null;
}

export function getCatalogProductBySlug(
  slug: string,
): CatalogProductRecord | null {
  return (
    getAllCatalogProducts().find((product) => product.slug === slug) ?? null
  );
}

export function getCatalogProductsByCategory(
  categoryId: string,
): CatalogProductRecord[] {
  return getPublishedCatalogProducts().filter((product) =>
    productBelongsToCategory(product.categoryIds, categoryId),
  );
}

export function queryCatalogProducts(params?: {
  categoryId?: string;
  filters?: CatalogFilterState;
  featuredOnly?: boolean;
  newOnly?: boolean;
}): CatalogProductRecord[] {
  let products = getPublishedCatalogProducts();

  if (params?.categoryId) {
    products = products.filter((product) =>
      productBelongsToCategory(product.categoryIds, params.categoryId as string),
    );
  }

  if (params?.featuredOnly) {
    products = products.filter((product) => product.isFeatured);
  }

  if (params?.newOnly) {
    products = products.filter((product) => product.isNew);
  }

  if (params?.filters) {
    products = applyCatalogFilters(products, params.filters);
  }

  return products.sort(
    (left, right) => right.popularityScore - left.popularityScore,
  );
}

export function upsertCatalogEngineProduct(
  input: CatalogProductUpsertInput,
): CatalogProductRecord {
  const snapshot = getCatalogEngineSnapshot();
  const product = normalizeUpsertInput(input);
  product.searchIndexText = buildSearchIndexText(product);

  const nextSnapshot = upsertCatalogProduct(snapshot, product);
  persistCatalogSnapshot(nextSnapshot);
  return product;
}

export function deleteCatalogEngineProduct(productId: string): boolean {
  const snapshot = getCatalogEngineSnapshot();
  const exists = snapshot.products.some((product) => product.id === productId);
  if (!exists) {
    return false;
  }

  persistCatalogSnapshot(removeCatalogProduct(snapshot, productId));
  return true;
}

export function setCatalogEngineProductPublished(
  productId: string,
  isPublished: boolean,
): CatalogProductRecord | null {
  const snapshot = getCatalogEngineSnapshot();
  const existing = snapshot.products.find((product) => product.id === productId);
  if (!existing) {
    return null;
  }

  persistCatalogSnapshot(
    setCatalogProductPublished(snapshot, productId, isPublished),
  );

  return (
    cachedSnapshot?.products.find((product) => product.id === productId) ?? null
  );
}

export function archiveCatalogEngineProduct(
  productId: string,
): CatalogProductRecord | null {
  const snapshot = getCatalogEngineSnapshot();
  const existing = snapshot.products.find((product) => product.id === productId);
  if (!existing) {
    return null;
  }

  persistCatalogSnapshot(archiveCatalogProduct(snapshot, productId));

  return (
    cachedSnapshot?.products.find((product) => product.id === productId) ?? null
  );
}

export function rebuildCatalogEngineFromLegacy(
  legacyProducts: CatalogProduct[],
): CatalogEngineSnapshot {
  cachedSnapshot = hydrateSnapshot({
    ...getDefaultCatalogSnapshot(legacyProducts),
    products: bootstrapCatalogFromLegacy(legacyProducts),
  });
  return cachedSnapshot;
}

export function getCatalogEngineVersion(): string {
  return getCatalogEngineSnapshot().version;
}
