"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { ADMIN_LOGIN_PATH, hasAdminSession } from "../auth";

type ProductStatus = "ACTIVE" | "DRAFT";
type ProductFormMode = "create" | "edit";
type ProductSize = "S" | "M" | "L" | "XL";
type StatusFilter = "ALL" | ProductStatus;

type SizePrices = Record<ProductSize, number | null>;
type SizePriceForm = Record<ProductSize, string>;

type AdminProduct = {
  id: string;
  slug: string;
  imageUrl: string;
  alt: string;
  title: string;
  category: string;
  priceRub: number;
  shortDescription: string;
  fullDescription: string;
  status: ProductStatus;
  sizes: ProductSize[];
  sizePrices: SizePrices;
};

type ProductFormState = {
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  status: ProductStatus;
  sizePrices: SizePriceForm;
};

type StoredProduct = Omit<
  Partial<AdminProduct>,
  "status" | "sizes" | "sizePrices"
> & {
  description?: string;
  priceRub?: number;
  status?: ProductStatus | "Active" | "Draft";
  sizes?: string[];
  sizePrices?: Partial<Record<ProductSize, number | null>>;
};

const PRODUCT_STORAGE_KEY = "bellaflore.admin.products";
const CATEGORY_STORAGE_KEY = "bellaflore.admin.product-categories";
const UPLOAD_ENDPOINT = "/api/admin/products/upload-image";

const sizeOptions = ["S", "M", "L", "XL"] as const;
const defaultCategories = [
  "Розы",
  "Пионы",
  "Гортензии",
  "Авторские букеты",
  "Премиальные букеты",
  "Пионы и гортензии",
];

const emptySizePrices: SizePrices = {
  S: null,
  M: null,
  L: null,
  XL: null,
};

const emptySizePriceForm: SizePriceForm = {
  S: "",
  M: "",
  L: "",
  XL: "",
};

const defaultProducts: AdminProduct[] = [
  {
    id: "red-luxury",
    slug: "red-luxury",
    imageUrl: "/roza rouze royal.PNG",
    alt: "Букет Red Luxury из красных роз",
    title: "Red Luxury",
    category: "Розы",
    priceRub: 14900,
    shortDescription: "51 красная роза",
    fullDescription:
      "Премиальный букет из 51 красной розы для выразительного подарка.",
    status: "ACTIVE",
    sizes: ["S", "M", "L", "XL"],
    sizePrices: { S: 14900, M: 18900, L: 24900, XL: 32900 },
  },
  {
    id: "pink-elegance",
    slug: "pink-elegance",
    imageUrl: "/0002.jpg",
    alt: "Авторский букет Pink Elegance в розовой гамме",
    title: "Pink Elegance",
    category: "Авторские букеты",
    priceRub: 11900,
    shortDescription: "Премиальный авторский букет",
    fullDescription:
      "Нежная авторская композиция в розовой гамме с премиальной упаковкой.",
    status: "ACTIVE",
    sizes: ["S", "M", "L"],
    sizePrices: { S: 11900, M: 15900, L: 20900, XL: null },
  },
  {
    id: "white-pearl",
    slug: "white-pearl",
    imageUrl: "/white rose 101.PNG",
    alt: "Букет White Pearl из белых роз",
    title: "White Pearl",
    category: "Розы",
    priceRub: 24900,
    shortDescription: "101 белая роза",
    fullDescription: "Статусный букет из 101 белой розы для торжественного события.",
    status: "ACTIVE",
    sizes: ["M", "L", "XL"],
    sizePrices: { S: null, M: 24900, L: 31900, XL: 39900 },
  },
  {
    id: "golden-romance",
    slug: "golden-romance",
    imageUrl: "",
    alt: "Авторский букет Golden Romance",
    title: "Golden Romance",
    category: "Премиальные букеты",
    priceRub: 15900,
    shortDescription: "Авторский премиальный букет",
    fullDescription: "Теплая авторская композиция Bellaflore для особого поздравления.",
    status: "DRAFT",
    sizes: ["S", "M", "L"],
    sizePrices: { S: 15900, M: 19900, L: 25900, XL: null },
  },
  {
    id: "luxury-box",
    slug: "luxury-box",
    imageUrl: "/mix piony siren.PNG",
    alt: "Композиция Luxury Box с пионами",
    title: "Luxury Box",
    category: "Пионы",
    priceRub: 13900,
    shortDescription: "Пионы в премиальной коробке",
    fullDescription: "Композиция с пионами в фирменной коробке Bellaflore.",
    status: "ACTIVE",
    sizes: ["S", "M", "L"],
    sizePrices: { S: 13900, M: 17900, L: 22900, XL: null },
  },
  {
    id: "royal-collection",
    slug: "royal-collection",
    imageUrl: "/piony 11.PNG",
    alt: "Цветочная композиция Royal Collection",
    title: "Royal Collection",
    category: "Пионы и гортензии",
    priceRub: 18900,
    shortDescription: "Эксклюзивная цветочная композиция",
    fullDescription:
      "Объемная композиция с пионами и гортензиями в премиальной эстетике.",
    status: "ACTIVE",
    sizes: ["M", "L", "XL"],
    sizePrices: { S: null, M: 18900, L: 24900, XL: 32900 },
  },
];

function createEmptyForm(categories: string[]): ProductFormState {
  return {
    title: "",
    slug: "",
    category: categories[0] ?? "",
    shortDescription: "",
    fullDescription: "",
    imageUrl: "",
    status: "DRAFT",
    sizePrices: { ...emptySizePriceForm },
  };
}

function createFormFromProduct(product: AdminProduct): ProductFormState {
  return {
    title: product.title,
    slug: product.slug,
    category: product.category,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    imageUrl: product.imageUrl,
    status: product.status,
    sizePrices: sizeOptions.reduce<SizePriceForm>((prices, size) => {
      const price = product.sizePrices[size];
      return { ...prices, [size]: price ? String(price) : "" };
    }, { ...emptySizePriceForm }),
  };
}

function formatPrice(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

function formatStatus(status: ProductStatus): string {
  return status === "ACTIVE" ? "Active" : "Draft";
}

function makeProductId(slug: string): string {
  return `${slug.trim().toLowerCase()}-${Date.now()}`;
}

function normalizeStatus(status: StoredProduct["status"]): ProductStatus {
  return status === "ACTIVE" || status === "Active" ? "ACTIVE" : "DRAFT";
}

function parsePrice(value: string): number {
  return Number(value.replace(/\s/g, ""));
}

function getActiveSizes(sizePrices: SizePrices): ProductSize[] {
  return sizeOptions.filter((size) => {
    const price = sizePrices[size];
    return typeof price === "number" && Number.isFinite(price) && price > 0;
  });
}

function getProductMinPrice(product: AdminProduct): number {
  const activePrices = getActiveSizes(product.sizePrices)
    .map((size) => product.sizePrices[size])
    .filter((price): price is number => typeof price === "number");

  return activePrices.length > 0
    ? Math.min(...activePrices)
    : product.priceRub;
}

function normalizeSizePrices(product: StoredProduct): SizePrices {
  if (product.sizePrices) {
    return sizeOptions.reduce<SizePrices>((prices, size) => {
      const price = product.sizePrices?.[size];
      return {
        ...prices,
        [size]: typeof price === "number" && Number.isFinite(price) && price > 0
          ? price
          : null,
      };
    }, { ...emptySizePrices });
  }

  const basePrice =
    typeof product.priceRub === "number" && Number.isFinite(product.priceRub)
      ? product.priceRub
      : 0;
  const storedSizes = Array.isArray(product.sizes)
    ? product.sizes.filter((size): size is ProductSize =>
        sizeOptions.includes(size as ProductSize),
      )
    : [];
  const fallbackSizes = storedSizes.length > 0 ? storedSizes : ["S"];

  return sizeOptions.reduce<SizePrices>((prices, size, index) => {
    if (!fallbackSizes.includes(size)) {
      return { ...prices, [size]: null };
    }

    return {
      ...prices,
      [size]: basePrice > 0 ? basePrice + index * 3000 : null,
    };
  }, { ...emptySizePrices });
}

function normalizeProduct(product: StoredProduct): AdminProduct {
  const sizePrices = normalizeSizePrices(product);
  const sizes = getActiveSizes(sizePrices);
  const title = product.title?.trim() || "Untitled bouquet";
  const priceRub = sizes.length > 0
    ? Math.min(...sizes.map((size) => sizePrices[size] ?? 0))
    : typeof product.priceRub === "number"
      ? product.priceRub
      : 0;

  return {
    id: product.id || makeProductId(product.slug || title),
    slug: product.slug?.trim() || title.toLowerCase().replace(/\s+/g, "-"),
    imageUrl: product.imageUrl ?? "",
    alt: product.alt || `Букет ${title}`,
    title,
    category: product.category?.trim() || defaultCategories[0],
    priceRub,
    shortDescription:
      product.shortDescription ?? product.description ?? "Описание не указано",
    fullDescription:
      product.fullDescription ??
      product.shortDescription ??
      product.description ??
      "",
    status: normalizeStatus(product.status),
    sizes,
    sizePrices,
  };
}

function readStoredProducts(): AdminProduct[] {
  if (typeof window === "undefined") {
    return defaultProducts;
  }

  const rawProducts = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!rawProducts) {
    return defaultProducts;
  }

  try {
    const parsedProducts = JSON.parse(rawProducts) as StoredProduct[];
    if (!Array.isArray(parsedProducts)) {
      return defaultProducts;
    }

    return parsedProducts.map(normalizeProduct);
  } catch {
    return defaultProducts;
  }
}

function readStoredCategories(products: AdminProduct[]): string[] {
  if (typeof window === "undefined") {
    return defaultCategories;
  }

  try {
    const rawCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    const parsedCategories = rawCategories
      ? (JSON.parse(rawCategories) as unknown)
      : [];
    const storedCategories = Array.isArray(parsedCategories)
      ? parsedCategories.filter(
          (category): category is string =>
            typeof category === "string" && category.trim().length > 0,
        )
      : [];

    return Array.from(
      new Set([
        ...defaultCategories,
        ...products.map((product) => product.category),
        ...storedCategories.map((category) => category.trim()),
      ]),
    );
  } catch {
    return Array.from(
      new Set([...defaultCategories, ...products.map((product) => product.category)]),
    );
  }
}

function writeStoredProducts(products: AdminProduct[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}

function writeStoredCategories(categories: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

function validateProductForm(
  form: ProductFormState,
  products: AdminProduct[],
  editedProductId?: string,
): string[] {
  const errors: string[] = [];
  const sizeValues = sizeOptions
    .map((size) => ({ size, value: form.sizePrices[size].trim() }))
    .filter(({ value }) => value.length > 0);

  if (!form.title.trim()) {
    errors.push("Название обязательно.");
  }

  if (!form.slug.trim()) {
    errors.push("Slug обязателен.");
  }

  if (!form.category.trim()) {
    errors.push("Категория обязательна.");
  }

  if (sizeValues.length === 0) {
    errors.push("Укажите цену хотя бы для одного размера.");
  }

  sizeValues.forEach(({ size, value }) => {
    const priceNumber = parsePrice(value);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      errors.push(`Цена размера ${size} должна быть положительным числом.`);
    }
  });

  const slugAlreadyExists = products.some(
    (product) =>
      product.slug === form.slug.trim() && product.id !== editedProductId,
  );
  if (slugAlreadyExists) {
    errors.push("Slug уже используется.");
  }

  return errors;
}

function buildSizePricesFromForm(form: ProductFormState): SizePrices {
  return sizeOptions.reduce<SizePrices>((prices, size) => {
    const rawPrice = form.sizePrices[size].trim();
    if (!rawPrice) {
      return { ...prices, [size]: null };
    }

    return { ...prices, [size]: parsePrice(rawPrice) };
  }, { ...emptySizePrices });
}

function buildProductFromForm(
  form: ProductFormState,
  existingProduct?: AdminProduct,
): AdminProduct {
  const slug = form.slug.trim();
  const title = form.title.trim();
  const sizePrices = buildSizePricesFromForm(form);
  const sizes = getActiveSizes(sizePrices);
  const priceRub = sizes.length > 0
    ? Math.min(...sizes.map((size) => sizePrices[size] ?? 0))
    : 0;

  return {
    id: existingProduct?.id ?? makeProductId(slug),
    slug,
    title,
    category: form.category.trim(),
    priceRub,
    shortDescription: form.shortDescription.trim(),
    fullDescription: form.fullDescription.trim(),
    imageUrl: form.imageUrl.trim(),
    alt: `Букет ${title}`,
    status: form.status,
    sizes,
    sizePrices,
  };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [productsRestored, setProductsRestored] = useState(false);
  const [productItems, setProductItems] = useState(defaultProducts);
  const [categoryItems, setCategoryItems] = useState(defaultCategories);
  const [selectedProductId, setSelectedProductId] = useState(
    defaultProducts[0].id,
  );
  const [failedImageProductIds, setFailedImageProductIds] = useState<string[]>(
    [],
  );
  const [formMode, setFormMode] = useState<ProductFormMode>("create");
  const [productForm, setProductForm] = useState<ProductFormState>(() =>
    createEmptyForm(defaultCategories),
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formMessage, setFormMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const selectedProduct = useMemo(
    () =>
      productItems.find((product) => product.id === selectedProductId) ??
      productItems[0] ??
      null,
    [productItems, selectedProductId],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return productItems.filter((product) => {
      const matchesSearch = !normalizedQuery
        ? true
        : [
            product.title,
            product.slug,
            product.category,
            product.shortDescription,
            product.fullDescription,
            product.sizes.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "ALL" || product.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, productItems, searchQuery, statusFilter]);

  const activeCount = productItems.filter(
    (product) => product.status === "ACTIVE",
  ).length;
  const draftCount = productItems.length - activeCount;
  const selectedProductImageFailed = selectedProduct
    ? failedImageProductIds.includes(selectedProduct.id)
    : false;

  const clearFormFeedback = () => {
    setFormErrors([]);
    setFormMessage("");
    setUploadMessage("");
  };

  const openCreateForm = () => {
    setFormMode("create");
    setProductForm(createEmptyForm(categoryItems));
    setIsFormOpen(true);
    setDeleteConfirmProductId("");
    clearFormFeedback();
  };

  const openEditForm = () => {
    if (!selectedProduct) {
      return;
    }

    setFormMode("edit");
    setProductForm(createFormFromProduct(selectedProduct));
    setIsFormOpen(true);
    setDeleteConfirmProductId("");
    clearFormFeedback();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    clearFormFeedback();
  };

  const updateFormField = (
    field: keyof Omit<ProductFormState, "sizePrices">,
    value: ProductFormState[keyof Omit<ProductFormState, "sizePrices">],
  ) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateSizePrice = (size: ProductSize, value: string) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      sizePrices: {
        ...currentForm.sizePrices,
        [size]: value,
      },
    }));
  };

  const addCategory = () => {
    const nextCategory = categoryDraft.trim();
    if (!nextCategory) {
      return;
    }

    const nextCategories = Array.from(new Set([...categoryItems, nextCategory]));
    setCategoryItems(nextCategories);
    writeStoredCategories(nextCategories);
    setCategoryDraft("");
    setFormMessage("Категория добавлена.");
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setUploadMessage("");
    setFormErrors([]);

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: uploadData,
      });
      const result = (await response.json()) as {
        imageUrl?: string;
        message?: string;
      };

      if (!response.ok || !result.imageUrl) {
        throw new Error(result.message || "Image upload failed.");
      }

      updateFormField("imageUrl", result.imageUrl);
      setUploadMessage("Изображение загружено.");
    } catch {
      setFormErrors(["Не удалось загрузить изображение."]);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleProductSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const editedProductId = formMode === "edit" ? selectedProduct?.id : "";
    const errors = validateProductForm(
      productForm,
      productItems,
      editedProductId,
    );

    if (errors.length > 0) {
      setFormErrors(errors);
      setFormMessage("");
      return;
    }

    if (!categoryItems.includes(productForm.category)) {
      const nextCategories = [...categoryItems, productForm.category];
      setCategoryItems(nextCategories);
      writeStoredCategories(nextCategories);
    }

    if (formMode === "edit" && selectedProduct) {
      const updatedProduct = buildProductFromForm(productForm, selectedProduct);
      const nextProducts = productItems.map((product) =>
        product.id === selectedProduct.id ? updatedProduct : product,
      );
      setProductItems(nextProducts);
      writeStoredProducts(nextProducts);
      setFailedImageProductIds((currentIds) =>
        currentIds.filter((productId) => productId !== selectedProduct.id),
      );
      setFormErrors([]);
      setUploadMessage("");
      setFormMessage("Товар обновлён.");
      setIsFormOpen(false);
      return;
    }

    const createdProduct = buildProductFromForm(productForm);
    const nextProducts = [createdProduct, ...productItems];
    setProductItems(nextProducts);
    writeStoredProducts(nextProducts);
    setSelectedProductId(createdProduct.id);
    setFailedImageProductIds((currentIds) =>
      currentIds.filter((productId) => productId !== createdProduct.id),
    );
    setProductForm(createEmptyForm(categoryItems));
    setFormErrors([]);
    setUploadMessage("");
    setFormMessage("Товар создан.");
    setIsFormOpen(false);
  };

  const requestDeleteConfirmation = () => {
    if (!selectedProduct) {
      return;
    }

    setDeleteConfirmProductId(selectedProduct.id);
    setIsFormOpen(false);
    clearFormFeedback();
  };

  const deleteSelectedProduct = () => {
    if (!selectedProduct) {
      return;
    }

    const productIdToDelete = selectedProduct.id;
    const nextProducts = productItems.filter(
      (product) => product.id !== productIdToDelete,
    );
    setProductItems(nextProducts);
    writeStoredProducts(nextProducts);
    setSelectedProductId(nextProducts[0]?.id ?? "");
    setFailedImageProductIds((currentIds) =>
      currentIds.filter((productId) => productId !== productIdToDelete),
    );
    setDeleteConfirmProductId("");
    setFormMessage("Товар удалён.");
  };

  useEffect(() => {
    const authTimer = window.setTimeout(() => {
      if (hasAdminSession()) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }

      setAuthChecked(true);
      router.replace(ADMIN_LOGIN_PATH);
    }, 0);

    return () => window.clearTimeout(authTimer);
  }, [router]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const restoredProducts = readStoredProducts();
      setProductItems(restoredProducts);
      setCategoryItems(readStoredCategories(restoredProducts));
      setProductForm(createEmptyForm(readStoredCategories(restoredProducts)));
      setSelectedProductId(restoredProducts[0]?.id ?? "");
      setProductsRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!productsRestored) {
      return;
    }

    writeStoredProducts(productItems);
    writeStoredCategories(categoryItems);
  }, [categoryItems, productItems, productsRestored]);

  if (!authChecked || !isAuthenticated) {
    return (
      <main style={styles.page}>
        <section style={styles.authPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.authTitle}>Проверка доступа</h1>
          <p style={styles.authText}>Открываем товары.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>BellaFlore Admin</p>
          <h1 style={styles.title}>Товары</h1>
        </div>
        <div style={styles.headerActions}>
          <Link href="/admin" style={styles.backLink}>
            Панель
          </Link>
          <Link href="/admin/orders" style={styles.backLink}>
            Заказы
          </Link>
          <Link href="/admin/crm" style={styles.backLink}>
            CRM
          </Link>
        </div>
      </section>

      <section style={styles.actionPanel} aria-label="Управление товарами">
        <div>
          <p style={styles.eyebrow}>Product tools</p>
          <h2 style={styles.panelTitle}>Управление каталогом</h2>
          <p style={styles.panelText}>
            {productItems.length} товаров · {activeCount} Active · {draftCount} Draft
          </p>
        </div>
        <div style={styles.actionGrid}>
          <button type="button" style={styles.primaryButton} onClick={openCreateForm}>
            Add product
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={openEditForm}
            disabled={!selectedProduct}
          >
            Edit product
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={openEditForm}
            disabled={!selectedProduct}
          >
            Upload image
          </button>
          <button
            type="button"
            style={styles.dangerButton}
            onClick={requestDeleteConfirmation}
            disabled={!selectedProduct}
          >
            Delete product
          </button>
        </div>
      </section>

      <section style={styles.toolsPanel} aria-label="Поиск и фильтры товаров">
        <label style={styles.formLabel}>
          <span>Search</span>
          <input
            style={styles.formInput}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Название, slug, категория"
          />
        </label>
        <label style={styles.formLabel}>
          <span>Category filter</span>
          <select
            style={styles.formInput}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="ALL">All categories</option>
            {categoryItems.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.formLabel}>
          <span>Status filter</span>
          <select
            style={styles.formInput}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
        <div style={styles.categoryManager}>
          <label style={styles.formLabel}>
            <span>Add category</span>
            <input
              style={styles.formInput}
              value={categoryDraft}
              onChange={(event) => setCategoryDraft(event.target.value)}
              placeholder="Новая категория"
            />
          </label>
          <button type="button" style={styles.secondaryButton} onClick={addCategory}>
            Add category
          </button>
        </div>
      </section>

      {formMessage ? (
        <section style={styles.noticePanel} aria-live="polite">
          {formMessage}
        </section>
      ) : null}

      {isFormOpen ? (
        <section style={styles.formPanel} aria-label="Форма товара">
          <div style={styles.panelHeader}>
            <p style={styles.eyebrow}>
              {formMode === "create" ? "Create product" : "Edit product"}
            </p>
            <h2 style={styles.panelTitle}>
              {formMode === "create" ? "Новый букет" : "Редактирование букета"}
            </h2>
          </div>

          {formErrors.length > 0 ? (
            <div style={styles.errorPanel} aria-live="polite">
              {formErrors.map((error) => (
                <p style={styles.errorText} key={error}>
                  {error}
                </p>
              ))}
            </div>
          ) : null}

          {uploadMessage ? (
            <p style={styles.uploadMessage} aria-live="polite">
              {uploadMessage}
            </p>
          ) : null}

          <form style={styles.formGrid} onSubmit={handleProductSubmit}>
            <label style={styles.formLabel}>
              <span>Title</span>
              <input
                style={styles.formInput}
                value={productForm.title}
                onChange={(event) => updateFormField("title", event.target.value)}
                required
              />
            </label>

            <label style={styles.formLabel}>
              <span>Slug</span>
              <input
                style={styles.formInput}
                value={productForm.slug}
                onChange={(event) => updateFormField("slug", event.target.value)}
                required
              />
            </label>

            <label style={styles.formLabel}>
              <span>Category</span>
              <select
                style={styles.formInput}
                value={productForm.category}
                onChange={(event) =>
                  updateFormField("category", event.target.value)
                }
                required
              >
                {categoryItems.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.formLabel}>
              <span>Status</span>
              <select
                style={styles.formInput}
                value={productForm.status}
                onChange={(event) =>
                  updateFormField("status", event.target.value as ProductStatus)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>

            <label style={{ ...styles.formLabel, ...styles.formWide }}>
              <span>Product image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={styles.fileInput}
                onChange={(event) => void handleImageUpload(event)}
                disabled={isUploadingImage}
              />
              <input
                style={styles.formInput}
                value={productForm.imageUrl}
                onChange={(event) =>
                  updateFormField("imageUrl", event.target.value)
                }
                placeholder="/uploads/products/image.webp"
              />
            </label>

            <fieldset style={{ ...styles.sizeFieldset, ...styles.formWide }}>
              <legend style={styles.legend}>Bouquet sizes</legend>
              <div style={styles.sizePriceGrid}>
                {sizeOptions.map((size) => (
                  <label style={styles.sizePriceLabel} key={size}>
                    <span style={styles.sizeCode}>{size}</span>
                    <input
                      style={styles.formInput}
                      value={productForm.sizePrices[size]}
                      inputMode="decimal"
                      onChange={(event) => updateSizePrice(size, event.target.value)}
                      placeholder="Цена"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <label style={{ ...styles.formLabel, ...styles.formWide }}>
              <span>Short description</span>
              <textarea
                style={styles.formTextarea}
                value={productForm.shortDescription}
                onChange={(event) =>
                  updateFormField("shortDescription", event.target.value)
                }
                rows={3}
              />
            </label>

            <label style={{ ...styles.formLabel, ...styles.formWide }}>
              <span>Full description</span>
              <textarea
                style={styles.formTextarea}
                value={productForm.fullDescription}
                onChange={(event) =>
                  updateFormField("fullDescription", event.target.value)
                }
                rows={4}
              />
            </label>

            <div style={{ ...styles.formActions, ...styles.formWide }}>
              <button
                type="submit"
                style={styles.primaryButton}
                disabled={isUploadingImage}
              >
                {formMode === "create" ? "Create product" : "Save changes"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section style={styles.productShell} aria-label="Список товаров">
        <div style={styles.productListPanel}>
          <div style={styles.panelHeader}>
            <p style={styles.eyebrow}>Catalog</p>
            <h2 style={styles.panelTitle}>Текущие букеты</h2>
            <p style={styles.panelText}>{filteredProducts.length} показано</p>
          </div>

          <div style={styles.productList}>
            {filteredProducts.length === 0 ? (
              <p style={styles.emptyText}>Товары не найдены.</p>
            ) : null}

            {filteredProducts.map((product) => {
              const isSelected = product.id === selectedProduct?.id;
              const productImageFailed = failedImageProductIds.includes(product.id);
              const showImage = product.imageUrl && !productImageFailed;

              return (
                <button
                  type="button"
                  style={{
                    ...styles.productButton,
                    ...(isSelected ? styles.productButtonActive : null),
                  }}
                  key={product.id}
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setDeleteConfirmProductId("");
                  }}
                  aria-pressed={isSelected}
                >
                  <span style={styles.productThumb}>
                    {showImage ? (
                      <span
                        role="img"
                        aria-label={product.alt}
                        style={{
                          ...styles.imageFill,
                          backgroundImage: `url("${product.imageUrl}")`,
                        }}
                      />
                    ) : (
                      <span style={styles.imageFallback}>BellaFlore</span>
                    )}
                  </span>
                  <span style={styles.productButtonText}>
                    <strong>{product.title}</strong>
                    <span>{product.category}</span>
                    <span>от {formatPrice(getProductMinPrice(product))}</span>
                    <span>{product.sizes.join(" / ") || "Размеры не заданы"}</span>
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(product.status === "DRAFT" ? styles.draftBadge : null),
                    }}
                  >
                    {formatStatus(product.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside style={styles.detailPanel} aria-label="Детали товара">
          {selectedProduct ? (
            <>
              <div style={styles.detailHero}>
                <div style={styles.detailImageFrame}>
                  {selectedProduct.imageUrl && !selectedProductImageFailed ? (
                    <span
                      role="img"
                      aria-label={selectedProduct.alt}
                      style={{
                        ...styles.imageFill,
                        backgroundImage: `url("${selectedProduct.imageUrl}")`,
                      }}
                    />
                  ) : (
                    <span style={styles.detailImageFallback}>BellaFlore</span>
                  )}
                </div>
                <div style={styles.detailHeader}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(selectedProduct.status === "DRAFT"
                        ? styles.draftBadge
                        : null),
                    }}
                  >
                    {formatStatus(selectedProduct.status)}
                  </span>
                  <p style={styles.eyebrow}>{selectedProduct.category}</p>
                  <h2 style={styles.detailTitle}>{selectedProduct.title}</h2>
                  <p style={styles.detailDescription}>
                    {selectedProduct.shortDescription || "Описание не указано"}
                  </p>
                  <strong style={styles.detailPrice}>
                    от {formatPrice(getProductMinPrice(selectedProduct))}
                  </strong>
                  <dl style={styles.metaGrid}>
                    <div>
                      <dt>Slug</dt>
                      <dd>{selectedProduct.slug}</dd>
                    </div>
                    <div>
                      <dt>Image URL</dt>
                      <dd>{selectedProduct.imageUrl || "Fallback card"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <section style={styles.placeholderCard}>
                <p style={styles.eyebrow}>Product details</p>
                <h3 style={styles.placeholderTitle}>Описание и размеры</h3>
                <p style={styles.fullDescription}>
                  {selectedProduct.fullDescription || "Полное описание не указано."}
                </p>
                <div style={styles.sizeGrid} aria-label="Размеры S M L XL">
                  {sizeOptions.map((size) => {
                    const price = selectedProduct.sizePrices[size];
                    const isActive = typeof price === "number" && price > 0;

                    return (
                      <span
                        style={{
                          ...styles.sizePill,
                          ...(isActive ? styles.sizePillActive : null),
                        }}
                        key={size}
                      >
                        {size}
                        {isActive ? ` · ${formatPrice(price)}` : " · Draft"}
                      </span>
                    );
                  })}
                </div>
                <div style={styles.placeholderActions}>
                  <button type="button" style={styles.secondaryButton} onClick={openEditForm}>
                    Edit product
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={openEditForm}>
                    Upload image
                  </button>
                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={requestDeleteConfirmation}
                  >
                    Delete product
                  </button>
                </div>
              </section>

              {deleteConfirmProductId === selectedProduct.id ? (
                <section style={styles.confirmPanel} aria-live="polite">
                  <div>
                    <p style={styles.eyebrow}>Confirm delete</p>
                    <h3 style={styles.confirmTitle}>Удалить {selectedProduct.title}?</h3>
                    <p style={styles.confirmText}>
                      Товар исчезнет из списка администратора после подтверждения.
                    </p>
                  </div>
                  <div style={styles.confirmActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setDeleteConfirmProductId("")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={styles.dangerButton}
                      onClick={deleteSelectedProduct}
                    >
                      Confirm delete
                    </button>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <section style={styles.placeholderCard}>
              <p style={styles.emptyText}>Выберите или создайте товар.</p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    overflowX: "hidden",
    background: "#f7f2ea",
    color: "#2f2a24",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    width: "min(1180px, 100%)",
    margin: "0 auto 22px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  authPanel: {
    width: "min(520px, 100%)",
    margin: "0 auto",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "22px",
    background: "#ffffff",
    boxShadow: "0 14px 38px rgba(47, 42, 36, 0.08)",
  },
  authTitle: {
    margin: "4px 0 0",
    color: "#2f2a24",
    fontSize: "clamp(28px, 6vw, 40px)",
    lineHeight: 1,
  },
  authText: {
    margin: "12px 0 0",
    color: "#75695c",
    fontSize: "16px",
    lineHeight: 1.45,
  },
  eyebrow: {
    margin: 0,
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: "clamp(34px, 7vw, 58px)",
    lineHeight: 1,
  },
  backLink: {
    minHeight: "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.26)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fffaf2",
    color: "#6f5128",
    fontSize: "14px",
    fontWeight: 850,
    textDecoration: "none",
  },
  actionPanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  toolsPanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
    gap: "14px",
    alignItems: "end",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  panelTitle: {
    margin: "4px 0 0",
    color: "#2f2a24",
    fontSize: "24px",
    lineHeight: 1.1,
  },
  panelText: {
    margin: "8px 0 0",
    color: "#75695c",
    fontSize: "14px",
    lineHeight: 1.45,
  },
  actionGrid: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  categoryManager: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "end",
  },
  primaryButton: {
    minHeight: "40px",
    border: "1px solid #2f2a24",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#2f2a24",
    color: "#ffffff",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "40px",
    border: "1px solid rgba(138, 107, 61, 0.26)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fffaf2",
    color: "#6f5128",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  dangerButton: {
    minHeight: "40px",
    border: "1px solid rgba(128, 42, 42, 0.28)",
    borderRadius: "8px",
    padding: "0 13px",
    background: "#fff1f1",
    color: "#8e2020",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 850,
    cursor: "pointer",
  },
  noticePanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto 18px",
    border: "1px solid rgba(35, 106, 50, 0.2)",
    borderRadius: "8px",
    padding: "13px 16px",
    background: "#e9f7ea",
    color: "#236a32",
    fontSize: "14px",
    fontWeight: 850,
  },
  formPanel: {
    width: "min(1180px, 100%)",
    margin: "0 auto 18px",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  errorPanel: {
    margin: "14px 0",
    border: "1px solid rgba(128, 42, 42, 0.22)",
    borderRadius: "8px",
    padding: "12px",
    background: "#fff1f1",
  },
  errorText: {
    margin: "0 0 4px",
    color: "#8e2020",
    fontSize: "14px",
    fontWeight: 750,
  },
  uploadMessage: {
    margin: "12px 0 0",
    color: "#236a32",
    fontSize: "14px",
    fontWeight: 850,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
    gap: "14px",
    marginTop: "14px",
  },
  formLabel: {
    minWidth: 0,
    display: "grid",
    gap: "7px",
    color: "#6f5128",
    fontSize: "13px",
    fontWeight: 850,
  },
  formWide: {
    gridColumn: "1 / -1",
  },
  formInput: {
    width: "100%",
    minWidth: 0,
    minHeight: "44px",
    border: "1px solid rgba(138, 107, 61, 0.24)",
    borderRadius: "8px",
    padding: "0 12px",
    background: "#fffaf2",
    color: "#2f2a24",
    font: "inherit",
    fontSize: "15px",
    outlineColor: "#8a6b3d",
  },
  fileInput: {
    width: "100%",
    minWidth: 0,
    border: "1px dashed rgba(138, 107, 61, 0.34)",
    borderRadius: "8px",
    padding: "12px",
    background: "#fffaf2",
    color: "#75695c",
    font: "inherit",
    fontSize: "14px",
  },
  formTextarea: {
    width: "100%",
    minWidth: 0,
    resize: "vertical",
    border: "1px solid rgba(138, 107, 61, 0.24)",
    borderRadius: "8px",
    padding: "11px 12px",
    background: "#fffaf2",
    color: "#2f2a24",
    font: "inherit",
    fontSize: "15px",
    outlineColor: "#8a6b3d",
  },
  formActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  sizeFieldset: {
    minWidth: 0,
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "14px",
    margin: 0,
    background: "#fffaf2",
  },
  legend: {
    padding: "0 8px",
    color: "#6f5128",
    fontSize: "13px",
    fontWeight: 900,
  },
  sizePriceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
    gap: "10px",
  },
  sizePriceLabel: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr)",
    gap: "8px",
    alignItems: "center",
  },
  sizeCode: {
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.2)",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#2f2a24",
    fontSize: "13px",
    fontWeight: 900,
  },
  productShell: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
    gap: "18px",
    alignItems: "start",
  },
  productListPanel: {
    minWidth: 0,
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  panelHeader: {
    marginBottom: "14px",
  },
  productList: {
    display: "grid",
    gap: "10px",
  },
  productButton: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "12px",
    border: "1px solid rgba(138, 107, 61, 0.16)",
    borderRadius: "8px",
    padding: "10px",
    background: "#fffaf2",
    color: "#2f2a24",
    textAlign: "left",
    cursor: "pointer",
  },
  productButtonActive: {
    border: "1px solid rgba(138, 107, 61, 0.42)",
    background: "#2f2a24",
    color: "#ffffff",
  },
  productThumb: {
    width: "72px",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    borderRadius: "8px",
    background: "#f7f2ea",
  },
  imageFill: {
    width: "100%",
    height: "100%",
    display: "block",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    padding: "8px",
    color: "#6f5128",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: 0,
    textTransform: "uppercase",
    textAlign: "center",
  },
  productButtonText: {
    minWidth: 0,
    display: "grid",
    gap: "3px",
    fontSize: "14px",
    lineHeight: 1.25,
    overflowWrap: "anywhere",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "30px",
    border: "1px solid rgba(35, 106, 50, 0.28)",
    borderRadius: "999px",
    padding: "0 10px",
    background: "#e9f7ea",
    color: "#236a32",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  draftBadge: {
    border: "1px solid rgba(138, 107, 61, 0.28)",
    background: "#fffaf2",
    color: "#6f5128",
  },
  detailPanel: {
    minWidth: 0,
    display: "grid",
    gap: "16px",
  },
  detailHero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
    gap: "18px",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  detailImageFrame: {
    minWidth: 0,
    aspectRatio: "4 / 5",
    overflow: "hidden",
    borderRadius: "8px",
    background: "#f7f2ea",
  },
  detailImageFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    padding: "18px",
    color: "#6f5128",
    fontSize: "18px",
    fontWeight: 900,
    letterSpacing: 0,
    textTransform: "uppercase",
    textAlign: "center",
  },
  detailHeader: {
    minWidth: 0,
    display: "grid",
    alignContent: "start",
    gap: "10px",
  },
  detailTitle: {
    margin: 0,
    color: "#2f2a24",
    fontSize: "clamp(28px, 5vw, 42px)",
    lineHeight: 1,
    overflowWrap: "anywhere",
  },
  detailDescription: {
    margin: 0,
    color: "#75695c",
    fontSize: "16px",
    lineHeight: 1.5,
  },
  detailPrice: {
    color: "#6f5128",
    fontSize: "20px",
  },
  metaGrid: {
    display: "grid",
    gap: "9px",
    margin: 0,
    color: "#75695c",
    fontSize: "13px",
    lineHeight: 1.35,
  },
  placeholderCard: {
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(47, 42, 36, 0.08)",
  },
  placeholderTitle: {
    margin: "4px 0 12px",
    color: "#2f2a24",
    fontSize: "20px",
    lineHeight: 1.2,
  },
  fullDescription: {
    margin: "0 0 14px",
    color: "#75695c",
    fontSize: "15px",
    lineHeight: 1.55,
  },
  sizeGrid: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  sizePill: {
    minHeight: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(138, 107, 61, 0.22)",
    borderRadius: "999px",
    padding: "0 12px",
    background: "#fffaf2",
    color: "#75695c",
    fontSize: "13px",
    fontWeight: 900,
  },
  sizePillActive: {
    background: "#2f2a24",
    color: "#ffffff",
    border: "1px solid #2f2a24",
  },
  placeholderActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  confirmPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    border: "1px solid rgba(128, 42, 42, 0.22)",
    borderRadius: "8px",
    padding: "18px",
    background: "#fff1f1",
  },
  confirmTitle: {
    margin: "4px 0",
    color: "#8e2020",
    fontSize: "20px",
    lineHeight: 1.15,
  },
  confirmText: {
    margin: 0,
    color: "#7a5555",
    fontSize: "14px",
    lineHeight: 1.45,
  },
  confirmActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  emptyText: {
    margin: 0,
    color: "#75695c",
    fontSize: "15px",
    lineHeight: 1.45,
  },
};
