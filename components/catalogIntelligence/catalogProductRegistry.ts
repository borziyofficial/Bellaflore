// ==================================================
// SECTION: CATALOG INTELLIGENCE
// РАЗДЕЛ: Product registry
// ==================================================
import { buildCatalogExampleRegistryState } from "@/components/catalogIntelligence/catalogExamples";
import type {
  CatalogAvailabilityEntry,
  CatalogAvailabilityStatus,
  CatalogFeaturedEntry,
  CatalogListFilters,
  CatalogProductGroup,
  CatalogProductRecord,
  CatalogSeason,
  CatalogSmartCollection,
} from "@/components/catalogIntelligence/catalogTypes";

export const CATALOG_PRODUCT_STORAGE_KEY =
  "bellaflore_catalog_intelligence_products_v1";

export const CATALOG_COLLECTION_STORAGE_KEY =
  "bellaflore_catalog_intelligence_collections_v1";

export const CATALOG_GROUP_STORAGE_KEY =
  "bellaflore_catalog_intelligence_groups_v1";

export const CATALOG_FEATURED_STORAGE_KEY =
  "bellaflore_catalog_intelligence_featured_v1";

export const CATALOG_AVAILABILITY_STORAGE_KEY =
  "bellaflore_catalog_intelligence_availability_v1";

let inMemoryProducts: CatalogProductRecord[] | null = null;
let inMemoryCollections: CatalogSmartCollection[] | null = null;
let inMemoryGroups: CatalogProductGroup[] | null = null;
let inMemoryFeatured: CatalogFeaturedEntry[] | null = null;
let inMemoryAvailability: CatalogAvailabilityEntry[] | null = null;

function readProductsFromStorage(): CatalogProductRecord[] {
  if (typeof window === "undefined") {
    return inMemoryProducts ?? buildCatalogExampleRegistryState().products;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_PRODUCT_STORAGE_KEY);
    if (!raw) {
      return inMemoryProducts ?? buildCatalogExampleRegistryState().products;
    }

    const parsed = JSON.parse(raw) as CatalogProductRecord[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCatalogExampleRegistryState().products;
  } catch {
    return inMemoryProducts ?? buildCatalogExampleRegistryState().products;
  }
}

function writeProductsToStorage(products: CatalogProductRecord[]): void {
  inMemoryProducts = products;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CATALOG_PRODUCT_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // In-memory fallback remains active.
  }
}

function readCollectionsFromStorage(): CatalogSmartCollection[] {
  if (typeof window === "undefined") {
    return inMemoryCollections ?? buildCatalogExampleRegistryState().collections;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_COLLECTION_STORAGE_KEY);
    if (!raw) {
      return inMemoryCollections ?? buildCatalogExampleRegistryState().collections;
    }

    const parsed = JSON.parse(raw) as CatalogSmartCollection[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCatalogExampleRegistryState().collections;
  } catch {
    return inMemoryCollections ?? buildCatalogExampleRegistryState().collections;
  }
}

function writeCollectionsToStorage(collections: CatalogSmartCollection[]): void {
  inMemoryCollections = collections;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_COLLECTION_STORAGE_KEY,
      JSON.stringify(collections),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readGroupsFromStorage(): CatalogProductGroup[] {
  if (typeof window === "undefined") {
    return inMemoryGroups ?? buildCatalogExampleRegistryState().productGroups;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_GROUP_STORAGE_KEY);
    if (!raw) {
      return inMemoryGroups ?? buildCatalogExampleRegistryState().productGroups;
    }

    const parsed = JSON.parse(raw) as CatalogProductGroup[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCatalogExampleRegistryState().productGroups;
  } catch {
    return inMemoryGroups ?? buildCatalogExampleRegistryState().productGroups;
  }
}

function writeGroupsToStorage(groups: CatalogProductGroup[]): void {
  inMemoryGroups = groups;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CATALOG_GROUP_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // In-memory fallback remains active.
  }
}

function readFeaturedFromStorage(): CatalogFeaturedEntry[] {
  if (typeof window === "undefined") {
    return inMemoryFeatured ?? buildCatalogExampleRegistryState().featured;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_FEATURED_STORAGE_KEY);
    if (!raw) {
      return inMemoryFeatured ?? buildCatalogExampleRegistryState().featured;
    }

    const parsed = JSON.parse(raw) as CatalogFeaturedEntry[];
    return Array.isArray(parsed) ? parsed : buildCatalogExampleRegistryState().featured;
  } catch {
    return inMemoryFeatured ?? buildCatalogExampleRegistryState().featured;
  }
}

function writeFeaturedToStorage(featured: CatalogFeaturedEntry[]): void {
  inMemoryFeatured = featured;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CATALOG_FEATURED_STORAGE_KEY, JSON.stringify(featured));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAvailabilityFromStorage(): CatalogAvailabilityEntry[] {
  if (typeof window === "undefined") {
    return inMemoryAvailability ?? buildCatalogExampleRegistryState().availability;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_AVAILABILITY_STORAGE_KEY);
    if (!raw) {
      return inMemoryAvailability ?? buildCatalogExampleRegistryState().availability;
    }

    const parsed = JSON.parse(raw) as CatalogAvailabilityEntry[];
    return Array.isArray(parsed)
      ? parsed
      : buildCatalogExampleRegistryState().availability;
  } catch {
    return inMemoryAvailability ?? buildCatalogExampleRegistryState().availability;
  }
}

function writeAvailabilityToStorage(entries: CatalogAvailabilityEntry[]): void {
  inMemoryAvailability = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_AVAILABILITY_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesFilters(
  product: CatalogProductRecord,
  filters: CatalogListFilters,
): boolean {
  if (filters.categoryId && !product.categoryIds.includes(filters.categoryId)) {
    return false;
  }

  if (filters.season && !product.seasons.includes(filters.season)) {
    return false;
  }

  if (filters.availability && product.availability !== filters.availability) {
    return false;
  }

  if (filters.isFeatured !== undefined && product.isFeatured !== filters.isFeatured) {
    return false;
  }

  if (filters.isSeasonal !== undefined && product.isSeasonal !== filters.isSeasonal) {
    return false;
  }

  if (filters.query?.trim()) {
    const normalized = filters.query.trim().toLowerCase();
    const haystack = [
      product.title,
      product.shortDescription,
      ...product.tags,
      ...product.searchTerms,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(normalized)) {
      return false;
    }
  }

  return true;
}

export function listCatalogProducts(
  filters: CatalogListFilters = {},
): CatalogProductRecord[] {
  return readProductsFromStorage()
    .filter((product) => product.status === "published")
    .filter((product) => matchesFilters(product, filters))
    .sort((left, right) => right.popularityScore - left.popularityScore);
}

export function getCatalogProductById(productId: string): CatalogProductRecord | null {
  return readProductsFromStorage().find((product) => product.id === productId) ?? null;
}

export function getCatalogProductBySlug(slug: string): CatalogProductRecord | null {
  return readProductsFromStorage().find((product) => product.slug === slug) ?? null;
}

export function listPopularProducts(limit = 10): CatalogProductRecord[] {
  return listCatalogProducts().slice(0, limit);
}

export function listSeasonalProducts(season?: CatalogSeason): CatalogProductRecord[] {
  return listCatalogProducts({
    isSeasonal: true,
    season,
  });
}

export function listFeaturedCatalogProducts(
  at: Date = new Date(),
): CatalogProductRecord[] {
  const timestamp = at.getTime();
  const featuredIds = new Set(
    readFeaturedFromStorage()
      .filter((entry) => {
        if (!entry.highlightUntil) {
          return true;
        }

        return new Date(entry.highlightUntil).getTime() >= timestamp;
      })
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((entry) => entry.productId),
  );

  return listCatalogProducts().filter((product) => featuredIds.has(product.id));
}

export function listSmartCollections(): CatalogSmartCollection[] {
  return readCollectionsFromStorage()
    .filter((collection) => collection.isPublished)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getSmartCollectionById(collectionId: string): CatalogSmartCollection | null {
  return readCollectionsFromStorage().find((collection) => collection.id === collectionId) ?? null;
}

export function listProductsByCollection(collectionId: string): CatalogProductRecord[] {
  const collection = getSmartCollectionById(collectionId);
  if (!collection) {
    return [];
  }

  const productMap = new Map(readProductsFromStorage().map((product) => [product.id, product]));

  return collection.productIds
    .map((productId) => productMap.get(productId))
    .filter(Boolean) as CatalogProductRecord[];
}

export function listProductGroups(): CatalogProductGroup[] {
  return readGroupsFromStorage();
}

export function getProductGroupById(groupId: string): CatalogProductGroup | null {
  return readGroupsFromStorage().find((group) => group.id === groupId) ?? null;
}

export function listProductsByGroup(groupId: string): CatalogProductRecord[] {
  const group = getProductGroupById(groupId);
  if (!group) {
    return [];
  }

  const productMap = new Map(readProductsFromStorage().map((product) => [product.id, product]));

  return group.productIds
    .map((productId) => productMap.get(productId))
    .filter(Boolean) as CatalogProductRecord[];
}

export function getRelatedProducts(productId: string): CatalogProductRecord[] {
  const product = getCatalogProductById(productId);
  if (!product) {
    return [];
  }

  const productMap = new Map(readProductsFromStorage().map((entry) => [entry.id, entry]));

  return product.relatedProductIds
    .map((id) => productMap.get(id))
    .filter(Boolean) as CatalogProductRecord[];
}

export function getSimilarBouquets(productId: string): CatalogProductRecord[] {
  const product = getCatalogProductById(productId);
  if (!product) {
    return [];
  }

  const productMap = new Map(readProductsFromStorage().map((entry) => [entry.id, entry]));

  const explicit = product.similarProductIds
    .map((id) => productMap.get(id))
    .filter(Boolean) as CatalogProductRecord[];

  if (explicit.length > 0) {
    return explicit;
  }

  return listCatalogProducts()
    .filter((entry) => entry.id !== productId)
    .filter(
      (entry) =>
        entry.flowerTypes.some((flower) => product.flowerTypes.includes(flower)) ||
        entry.colors.some((color) => product.colors.includes(color)),
    )
    .slice(0, 4);
}

export function listAvailabilityRegistry(): CatalogAvailabilityEntry[] {
  return readAvailabilityFromStorage();
}

export function getProductAvailability(
  productId: string,
): CatalogAvailabilityEntry | null {
  return readAvailabilityFromStorage().find((entry) => entry.productId === productId) ?? null;
}

export function listProductsByAvailability(
  status: CatalogAvailabilityStatus,
): CatalogProductRecord[] {
  const ids = new Set(
    readAvailabilityFromStorage()
      .filter((entry) => entry.status === status)
      .map((entry) => entry.productId),
  );

  return listCatalogProducts().filter((product) => ids.has(product.id));
}

export function listFeaturedEntries(): CatalogFeaturedEntry[] {
  return readFeaturedFromStorage().sort((left, right) => left.sortOrder - right.sortOrder);
}

export function registerCatalogProduct(product: CatalogProductRecord): CatalogProductRecord {
  const products = readProductsFromStorage();
  const index = products.findIndex((entry) => entry.id === product.id);
  const next =
    index === -1
      ? [...products, product]
      : products.map((entry, entryIndex) => (entryIndex === index ? product : entry));

  writeProductsToStorage(next);
  return product;
}

export function seedCatalogProductRegistry(): CatalogProductRecord[] {
  const seed = buildCatalogExampleRegistryState();
  writeProductsToStorage(seed.products);
  writeCollectionsToStorage(seed.collections);
  writeGroupsToStorage(seed.productGroups);
  writeFeaturedToStorage(seed.featured);
  writeAvailabilityToStorage(seed.availability);
  return listCatalogProducts();
}

export function clearCatalogProductRegistry(): void {
  writeProductsToStorage([]);
  writeCollectionsToStorage([]);
  writeGroupsToStorage([]);
  writeFeaturedToStorage([]);
  writeAvailabilityToStorage([]);
}
