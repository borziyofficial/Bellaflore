// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Storage adapter interface + local mock
// ==================================================
import type { StoredProduct } from "@/components/productStorage/productStorageTypes";

export interface ProductStorageAdapter {
  loadProducts(): Promise<StoredProduct[]>;
  saveProduct(product: StoredProduct): Promise<StoredProduct>;
  removeProduct(id: string): Promise<void>;
}

export class LocalProductStorageAdapter implements ProductStorageAdapter {
  constructor(private readonly getSnapshot: () => StoredProduct[]) {}

  async loadProducts(): Promise<StoredProduct[]> {
    return this.getSnapshot();
  }

  async saveProduct(product: StoredProduct): Promise<StoredProduct> {
    return product;
  }

  async removeProduct(id: string): Promise<void> {
    void id;
    return;
  }
}

export const PRODUCT_STORAGE_FUTURE_LAYERS = [
  "PostgreSQL",
  "Prisma",
  "Image Storage",
  "CDN",
  "Search Index",
  "Product Version History",
  "Bulk Import",
  "Bulk Export",
] as const;
