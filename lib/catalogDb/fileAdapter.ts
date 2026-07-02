import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoredCatalogProduct } from "@/lib/catalogDb/types";

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "catalog-products.json");

async function ensureDataFile(): Promise<StoredCatalogProduct[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredCatalogProduct[]) : [];
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function writeAll(products: StoredCatalogProduct[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
}

function sortProducts(products: StoredCatalogProduct[]): StoredCatalogProduct[] {
  return [...products].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export async function fileListCatalogProducts(): Promise<StoredCatalogProduct[]> {
  return sortProducts(await ensureDataFile());
}

export async function fileGetCatalogProductById(
  id: string,
): Promise<StoredCatalogProduct | null> {
  const products = await ensureDataFile();
  return products.find((product) => product.id === id) ?? null;
}

export async function fileGetCatalogProductBySlug(
  slug: string,
): Promise<StoredCatalogProduct | null> {
  const products = await ensureDataFile();
  return (
    products.find(
      (product) =>
        product.slug === slug ||
        product.seoSlug === slug ||
        product.id === slug,
    ) ?? null
  );
}

export async function fileUpsertCatalogProduct(
  product: StoredCatalogProduct,
): Promise<StoredCatalogProduct> {
  const products = await ensureDataFile();
  const existingIndex = products.findIndex((item) => item.id === product.id);
  const next =
    existingIndex === -1
      ? [...products, product]
      : products.map((item, index) => (index === existingIndex ? product : item));

  await writeAll(next);
  return product;
}

export async function fileSetCatalogProductStatus(
  id: string,
  status: StoredCatalogProduct["status"],
): Promise<StoredCatalogProduct | null> {
  const products = await ensureDataFile();
  const existing = products.find((product) => product.id === id);
  if (!existing) {
    return null;
  }

  const updated: StoredCatalogProduct = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeAll(
    products.map((product) => (product.id === id ? updated : product)),
  );
  return updated;
}
