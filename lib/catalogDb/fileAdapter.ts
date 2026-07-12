import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoredCatalogProduct } from "@/lib/catalogDb/types";

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "catalog-products.json");

async function ensureDataFile(): Promise<StoredCatalogProduct[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as StoredCatalogProduct[]).map(normalizeProduct)
      : [];
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

function normalizeProduct(product: StoredCatalogProduct): StoredCatalogProduct {
  return {
    ...product,
    oldPriceRub: product.oldPriceRub ?? null,
    flowerCount: product.flowerCount ?? null,
    heightCm: product.heightCm ?? null,
    widthCm: product.widthCm ?? null,
    colorPalette: product.colorPalette ?? [],
    occasion: product.occasion ?? "",
    galleryImages: product.galleryImages ?? [],
    images: product.images ?? [],
    isPromotion: product.isPromotion ?? false,
  };
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
  const normalizedProduct = normalizeProduct(product);
  const existingIndex = products.findIndex((item) => item.id === product.id);
  const next =
    existingIndex === -1
      ? [...products, normalizedProduct]
      : products.map((item, index) => (index === existingIndex ? normalizedProduct : item));

  await writeAll(next);
  return normalizedProduct;
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

export async function fileDeleteCatalogProduct(
  id: string,
): Promise<StoredCatalogProduct | null> {
  const products = await ensureDataFile();
  const existing = products.find((product) => product.id === id);
  if (!existing) {
    return null;
  }

  await writeAll(products.filter((product) => product.id !== id));
  return existing;
}
