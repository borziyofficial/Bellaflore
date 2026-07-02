import {
  allowFileCatalogFallback,
  isCatalogDatabaseConfigured,
} from "@/lib/catalogDb/config";
import {
  fileGetCatalogProductById,
  fileGetCatalogProductBySlug,
  fileListCatalogProducts,
  fileSetCatalogProductStatus,
  fileUpsertCatalogProduct,
} from "@/lib/catalogDb/fileAdapter";
import {
  postgresGetCatalogProductById,
  postgresGetCatalogProductBySlug,
  postgresListCatalogProducts,
  postgresSetCatalogProductStatus,
  postgresUpsertCatalogProduct,
} from "@/lib/catalogDb/postgresAdapter";
import {
  CatalogDatabaseNotConfiguredError,
  type StoredCatalogProduct,
} from "@/lib/catalogDb/types";
export {
  CatalogDatabaseNotConfiguredError,
  type StoredCatalogProduct,
} from "@/lib/catalogDb/types";

function assertCatalogDatabaseAvailable(): void {
  if (isCatalogDatabaseConfigured() || allowFileCatalogFallback()) {
    return;
  }

  throw new CatalogDatabaseNotConfiguredError();
}

export function getCatalogDatabaseMode(): "postgres" | "file" | "unconfigured" {
  if (isCatalogDatabaseConfigured()) {
    return "postgres";
  }

  if (allowFileCatalogFallback()) {
    return "file";
  }

  return "unconfigured";
}

export async function listCatalogProducts(): Promise<StoredCatalogProduct[]> {
  assertCatalogDatabaseAvailable();

  if (isCatalogDatabaseConfigured()) {
    return postgresListCatalogProducts();
  }

  return fileListCatalogProducts();
}

export async function listPublishedCatalogProducts(): Promise<StoredCatalogProduct[]> {
  const products = await listCatalogProducts();
  return products.filter((product) => product.status === "published");
}

export async function getCatalogProductById(
  id: string,
): Promise<StoredCatalogProduct | null> {
  assertCatalogDatabaseAvailable();

  if (isCatalogDatabaseConfigured()) {
    return postgresGetCatalogProductById(id);
  }

  return fileGetCatalogProductById(id);
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<StoredCatalogProduct | null> {
  assertCatalogDatabaseAvailable();

  if (isCatalogDatabaseConfigured()) {
    return postgresGetCatalogProductBySlug(slug);
  }

  return fileGetCatalogProductBySlug(slug);
}

export async function upsertCatalogProduct(
  product: StoredCatalogProduct,
): Promise<StoredCatalogProduct> {
  assertCatalogDatabaseAvailable();

  if (isCatalogDatabaseConfigured()) {
    return postgresUpsertCatalogProduct(product);
  }

  return fileUpsertCatalogProduct(product);
}

export async function publishCatalogProduct(
  id: string,
): Promise<StoredCatalogProduct | null> {
  return setCatalogProductStatus(id, "published");
}

export async function archiveCatalogProduct(
  id: string,
): Promise<StoredCatalogProduct | null> {
  return setCatalogProductStatus(id, "archived");
}

export async function saveCatalogDraft(
  product: StoredCatalogProduct,
): Promise<StoredCatalogProduct> {
  return upsertCatalogProduct({ ...product, status: "draft" });
}

async function setCatalogProductStatus(
  id: string,
  status: StoredCatalogProduct["status"],
): Promise<StoredCatalogProduct | null> {
  assertCatalogDatabaseAvailable();

  if (isCatalogDatabaseConfigured()) {
    return postgresSetCatalogProductStatus(id, status);
  }

  return fileSetCatalogProductStatus(id, status);
}
