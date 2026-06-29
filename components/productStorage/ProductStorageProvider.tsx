// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: React context (local store, no DB)
// ==================================================
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PhotoUploadItem } from "@/components/photoManager/photoManagerTypes";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import { LocalProductRepository } from "@/components/productStorage/productRepository";
import { ProductService } from "@/components/productStorage/productService";
import { PRODUCT_STORAGE_SEED_PRODUCTS } from "@/components/productStorage/productStorageMockData";
import {
  createBlankStoredProduct,
  editorDraftToStoredProduct,
  filterAndSortProducts,
  photoUploadToStoredImage,
  storedProductToEditorDraft,
} from "@/components/productStorage/productStorageBridge";
import type {
  ProductListFilters,
  StoredProduct,
} from "@/components/productStorage/productStorageTypes";

type ProductStorageContextValue = {
  products: StoredProduct[];
  filteredProducts: StoredProduct[];
  filters: ProductListFilters;
  activeProductId: string | null;
  activeProduct: StoredProduct | null;
  setFilters: (patch: Partial<ProductListFilters>) => void;
  selectProduct: (id: string) => void;
  createProduct: () => Promise<void>;
  saveActiveProduct: (draft: ProductEditorDraft, photos: PhotoUploadItem[]) => Promise<void>;
  duplicateProduct: (id: string) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getEditorDraft: (product: StoredProduct) => ProductEditorDraft;
};

const DEFAULT_FILTERS: ProductListFilters = {
  searchQuery: "",
  status: "all",
  category: "all",
  sort: "updated_desc",
};

const ProductStorageContext = createContext<ProductStorageContextValue | null>(null);

export function ProductStorageProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(
    () => new LocalProductRepository(PRODUCT_STORAGE_SEED_PRODUCTS),
  );
  const [service] = useState(() => new ProductService(repository));
  const [products, setProducts] = useState<StoredProduct[]>(PRODUCT_STORAGE_SEED_PRODUCTS);
  const [filters, setFiltersState] = useState<ProductListFilters>(DEFAULT_FILTERS);
  const [activeProductId, setActiveProductId] = useState<string | null>(
    PRODUCT_STORAGE_SEED_PRODUCTS[0]?.id ?? null,
  );

  const refreshProducts = useCallback(async () => {
    const next = await service.listProducts();
    setProducts(next);
    return next;
  }, [service]);

  const activeProduct = useMemo(
    () => products.find((product) => product.id === activeProductId) ?? null,
    [products, activeProductId],
  );

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters],
  );

  const setFilters = useCallback((patch: Partial<ProductListFilters>) => {
    setFiltersState((current) => ({ ...current, ...patch }));
  }, []);

  const selectProduct = useCallback((id: string) => {
    setActiveProductId(id);
  }, []);

  const createProduct = useCallback(async () => {
    const blank = createBlankStoredProduct();
    await service.createProduct(blank);
    await refreshProducts();
    setActiveProductId(blank.id);
  }, [service, refreshProducts]);

  const saveActiveProduct = useCallback(
    async (draft: ProductEditorDraft, photos: PhotoUploadItem[]) => {
      if (!activeProduct) {
        return;
      }

      const updated = editorDraftToStoredProduct(activeProduct, draft);
      updated.images = photos.map(photoUploadToStoredImage);

      await service.updateProduct(updated);
      await refreshProducts();
    },
    [activeProduct, service, refreshProducts],
  );

  const duplicateProduct = useCallback(
    async (id: string) => {
      const source = products.find((product) => product.id === id);
      if (!source) {
        return;
      }

      const duplicate = await service.duplicateProduct(source);
      await refreshProducts();
      setActiveProductId(duplicate.id);
    },
    [products, service, refreshProducts],
  );

  const archiveProduct = useCallback(
    async (id: string) => {
      const source = products.find((product) => product.id === id);
      if (!source) {
        return;
      }

      await service.archiveProduct(source);
      const next = await refreshProducts();

      if (activeProductId === id) {
        setActiveProductId(next[0]?.id ?? null);
      }
    },
    [products, service, refreshProducts, activeProductId],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await service.deleteProduct(id);
      const next = await refreshProducts();

      if (activeProductId === id) {
        setActiveProductId(next[0]?.id ?? null);
      }
    },
    [service, refreshProducts, activeProductId],
  );

  const getEditorDraft = useCallback(
    (product: StoredProduct) => storedProductToEditorDraft(product),
    [],
  );

  const value = useMemo(
    () => ({
      products,
      filteredProducts,
      filters,
      activeProductId,
      activeProduct,
      setFilters,
      selectProduct,
      createProduct,
      saveActiveProduct,
      duplicateProduct,
      archiveProduct,
      deleteProduct,
      getEditorDraft,
    }),
    [
      products,
      filteredProducts,
      filters,
      activeProductId,
      activeProduct,
      setFilters,
      selectProduct,
      createProduct,
      saveActiveProduct,
      duplicateProduct,
      archiveProduct,
      deleteProduct,
      getEditorDraft,
    ],
  );

  return (
    <ProductStorageContext.Provider value={value}>{children}</ProductStorageContext.Provider>
  );
}

export function useProductStorage(): ProductStorageContextValue {
  const context = useContext(ProductStorageContext);

  if (!context) {
    throw new Error("useProductStorage must be used within ProductStorageProvider");
  }

  return context;
}
