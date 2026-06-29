// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Product service (CRUD foundation)
// ==================================================
import type { StoredProduct } from "@/components/productStorage/productStorageTypes";
import type { ProductRepository } from "@/components/productStorage/productRepository";
import { duplicateStoredProduct } from "@/components/productStorage/productStorageBridge";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async listProducts(): Promise<StoredProduct[]> {
    return this.repository.list();
  }

  async getProduct(id: string): Promise<StoredProduct | null> {
    return this.repository.getById(id);
  }

  async createProduct(product: StoredProduct): Promise<StoredProduct> {
    return this.repository.create(product);
  }

  async updateProduct(product: StoredProduct): Promise<StoredProduct> {
    return this.repository.update(product.id, product);
  }

  async duplicateProduct(product: StoredProduct): Promise<StoredProduct> {
    const duplicate = duplicateStoredProduct(product);
    return this.repository.create(duplicate);
  }

  async archiveProduct(product: StoredProduct): Promise<StoredProduct> {
    return this.repository.update(product.id, {
      ...product,
      status: "archive",
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
