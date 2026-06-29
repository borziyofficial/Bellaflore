// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Repository interface + local mock
// ==================================================
import type { StoredProduct } from "@/components/productStorage/productStorageTypes";

export interface ProductRepository {
  list(): Promise<StoredProduct[]>;
  getById(id: string): Promise<StoredProduct | null>;
  create(product: StoredProduct): Promise<StoredProduct>;
  update(id: string, product: StoredProduct): Promise<StoredProduct>;
  delete(id: string): Promise<void>;
}

export class LocalProductRepository implements ProductRepository {
  private products: StoredProduct[];

  constructor(initialProducts: StoredProduct[]) {
    this.products = [...initialProducts];
  }

  async list(): Promise<StoredProduct[]> {
    return [...this.products];
  }

  async getById(id: string): Promise<StoredProduct | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async create(product: StoredProduct): Promise<StoredProduct> {
    this.products = [...this.products, product];
    return product;
  }

  async update(id: string, product: StoredProduct): Promise<StoredProduct> {
    this.products = this.products.map((item) => (item.id === id ? product : item));
    return product;
  }

  async delete(id: string): Promise<void> {
    this.products = this.products.filter((product) => product.id !== id);
  }

  replaceAll(products: StoredProduct[]): void {
    this.products = [...products];
  }

  snapshot(): StoredProduct[] {
    return [...this.products];
  }
}
