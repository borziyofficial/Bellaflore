// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Admin Store
//
// Purpose (EN): Optional localStorage overrides for admin CRUD without code changes.
//
// Назначение (RU): localStorage-override для CRUD админки без изменения кода.
// ==================================================
import type {
  CatalogAdminPatch,
  CatalogEngineSnapshot,
  CatalogProductRecord,
} from "@/components/catalogEngine/catalogTypes";

export const CATALOG_ADMIN_STORAGE_KEY = "bellaflore_catalog_engine_v1";

function isCatalogEngineSnapshot(value: unknown): value is CatalogEngineSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CatalogEngineSnapshot>;
  return (
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.categories) &&
    typeof candidate.version === "string"
  );
}

export function mergeCatalogSnapshots(
  base: CatalogEngineSnapshot,
  patch: CatalogAdminPatch | null,
): CatalogEngineSnapshot {
  if (!patch) {
    return base;
  }

  return {
    products: patch.products ?? base.products,
    categories: patch.categories ?? base.categories,
    version: patch.version ?? base.version,
    updatedAt: patch.updatedAt ?? base.updatedAt,
  };
}

export function readCatalogAdminOverride(): CatalogEngineSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CATALOG_ADMIN_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return isCatalogEngineSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCatalogAdminOverride(snapshot: CatalogEngineSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_ADMIN_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Admin override storage is optional.
  }
}

export function upsertCatalogProduct(
  snapshot: CatalogEngineSnapshot,
  product: CatalogProductRecord,
): CatalogEngineSnapshot {
  const existingIndex = snapshot.products.findIndex(
    (item) => item.id === product.id,
  );
  const products =
    existingIndex === -1
      ? [...snapshot.products, product]
      : snapshot.products.map((item, index) =>
          index === existingIndex ? product : item,
        );

  return {
    ...snapshot,
    products,
    updatedAt: new Date().toISOString(),
  };
}

export function removeCatalogProduct(
  snapshot: CatalogEngineSnapshot,
  productId: string,
): CatalogEngineSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.filter((item) => item.id !== productId),
    updatedAt: new Date().toISOString(),
  };
}

export function setCatalogProductPublished(
  snapshot: CatalogEngineSnapshot,
  productId: string,
  isPublished: boolean,
): CatalogEngineSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            isPublished,
            status: isPublished ? "ACTIVE" : "DRAFT",
            metadata: {
              ...product.metadata,
              updatedAt: new Date().toISOString(),
            },
          }
        : product,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function archiveCatalogProduct(
  snapshot: CatalogEngineSnapshot,
  productId: string,
): CatalogEngineSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            isPublished: false,
            status: "ARCHIVED",
            metadata: {
              ...product.metadata,
              updatedAt: new Date().toISOString(),
            },
          }
        : product,
    ),
    updatedAt: new Date().toISOString(),
  };
}
