// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Product Manager
// ==================================================
"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "@/components/adminFoundation/AdminProductManager.module.css";
import { AdminProductPhotoAttachment } from "@/components/adminFoundation/AdminProductPhotoAttachment";
import { AdminProductSeoManager } from "@/components/adminFoundation/AdminProductSeoManager";
import {
  EMPTY_ADMIN_PRODUCT_SEO,
  getAdminProductSeoScore,
  getAdminProductSeoStatusLabel,
  isAdminProductSeoReady,
  normalizeAdminProductSeoFields,
} from "@/components/adminFoundation/adminProductSeoUtils";
import type {
  AdminProduct,
  AdminProductSize,
  AdminProductStatus,
} from "@/components/adminFoundation/adminProductTypes";
import {
  getAdminPhotoItemById,
  getAdminPhotoLibraryIdSet,
  sanitizeAdminPhotoAttachmentSelection,
  subscribeAdminPhotoLibrary,
  useAdminPhotoLibraryPhotos,
} from "@/components/adminFoundation/adminPhotoLibraryStore";

type ProductDraft = {
  name: string;
  category: string;
  price: string;
  oldPrice: string;
  description: string;
  size: AdminProductSize | "";
  status: AdminProductStatus;
  photoIds: string[];
  mainPhotoId: string | null;
  bestseller: boolean;
  isNew: boolean;
  recommended: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoSlug: string;
  imageAltText: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
};

type ProductValidationErrors = Partial<
  Record<"name" | "category" | "price" | "size", string>
>;

const LOCAL_STORAGE_KEY = "bellaflore.admin.products.foundation.v2";

const PUBLISH_STATUS_OPTIONS: Array<{
  value: AdminProductStatus;
  label: string;
}> = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликован" },
  { value: "hidden", label: "Скрыт" },
];

const DEMO_PRODUCTS: AdminProduct[] = [
  {
    id: "demo-product-1",
    name: "Red Luxury",
    category: "Розы",
    price: 14900,
    oldPrice: 16900,
    description: "51 красная роза в премиальной упаковке.",
    size: "M",
    status: "published",
    photoLabel: "Фото товара",
    mainPhotoId: null,
    photoIds: [],
    flags: { bestseller: true, isNew: false, recommended: true },
    ...EMPTY_ADMIN_PRODUCT_SEO,
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "demo-product-2",
    name: "Pink Elegance",
    category: "Авторские",
    price: 11900,
    oldPrice: null,
    description: "Премиальный авторский букет в розовой гамме.",
    size: "L",
    status: "draft",
    photoLabel: "Фото товара",
    mainPhotoId: null,
    photoIds: [],
    flags: { bestseller: false, isNew: true, recommended: true },
    ...EMPTY_ADMIN_PRODUCT_SEO,
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "demo-product-3",
    name: "White Pearl",
    category: "Розы",
    price: 24900,
    oldPrice: 27900,
    description: "101 белая роза для торжественного повода.",
    size: "XL",
    status: "hidden",
    photoLabel: "Фото товара",
    mainPhotoId: null,
    photoIds: [],
    flags: { bestseller: true, isNew: false, recommended: false },
    ...EMPTY_ADMIN_PRODUCT_SEO,
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T10:00:00.000Z",
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function createEmptyDraft(): ProductDraft {
  return {
    name: "",
    category: "",
    price: "",
    oldPrice: "",
    description: "",
    size: "",
    status: "draft",
    photoIds: [],
    mainPhotoId: null,
    bestseller: false,
    isNew: false,
    recommended: false,
    ...EMPTY_ADMIN_PRODUCT_SEO,
  };
}

function createProductSkeleton(): AdminProduct {
  const time = nowIso();

  return {
    id: `admin-product-${crypto.randomUUID()}`,
    name: "",
    category: "",
    price: 0,
    oldPrice: null,
    description: "",
    size: "M",
    status: "draft",
    photoIds: [],
    mainPhotoId: null,
    photoLabel: "Фото товара",
    flags: {
      bestseller: false,
      isNew: false,
      recommended: false,
    },
    ...EMPTY_ADMIN_PRODUCT_SEO,
    createdAt: time,
    updatedAt: time,
  };
}

function normalizeProduct(product: AdminProduct): AdminProduct {
  const rawStatus = product.status as string;
  const legacyStatus =
    rawStatus === "active"
      ? "published"
      : rawStatus === "draft" || rawStatus === "published" || rawStatus === "hidden"
        ? (rawStatus as AdminProductStatus)
        : "draft";

  return {
    ...product,
    status: legacyStatus,
    mainPhotoId: product.mainPhotoId ?? null,
    photoIds: Array.isArray(product.photoIds) ? product.photoIds : [],
    ...normalizeAdminProductSeoFields(product),
  };
}

function getStatusLabel(status: AdminProductStatus): string {
  return PUBLISH_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function getStatusToneClass(
  status: AdminProductStatus,
  stylesMap: {
    statusDraft: string;
    statusPublished: string;
    statusHidden: string;
  },
): string {
  if (status === "published") {
    return stylesMap.statusPublished;
  }

  if (status === "hidden") {
    return stylesMap.statusHidden;
  }

  return stylesMap.statusDraft;
}

function readStoredProducts(): AdminProduct[] {
  if (typeof window === "undefined") {
    return DEMO_PRODUCTS.map(normalizeProduct);
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return DEMO_PRODUCTS.map(normalizeProduct);
    }

    const parsed = JSON.parse(raw) as AdminProduct[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEMO_PRODUCTS.map(normalizeProduct);
    }

    return parsed.map(normalizeProduct);
  } catch {
    return DEMO_PRODUCTS.map(normalizeProduct);
  }
}

function persistProducts(products: AdminProduct[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Local-only foundation may run without storage.
  }
}

function moneyLabel(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function toDraft(product: AdminProduct): ProductDraft {
  const sanitized = sanitizeProductPhotos(normalizeProduct(product));

  return {
    name: sanitized.name,
    category: sanitized.category,
    price: String(sanitized.price),
    oldPrice: sanitized.oldPrice === null ? "" : String(sanitized.oldPrice),
    description: sanitized.description,
    size: sanitized.size,
    status: sanitized.status,
    photoIds: sanitized.photoIds,
    mainPhotoId: sanitized.mainPhotoId,
    bestseller: sanitized.flags.bestseller,
    isNew: sanitized.flags.isNew,
    recommended: sanitized.flags.recommended,
    seoTitle: sanitized.seoTitle,
    seoDescription: sanitized.seoDescription,
    seoKeywords: sanitized.seoKeywords,
    seoSlug: sanitized.seoSlug,
    imageAltText: sanitized.imageAltText,
    canonicalUrl: sanitized.canonicalUrl,
    ogTitle: sanitized.ogTitle,
    ogDescription: sanitized.ogDescription,
  };
}

function buildProductFromDraft(
  draft: ProductDraft,
  existingProduct: AdminProduct | null,
  mode: "create" | "edit",
): AdminProduct {
  const id =
    mode === "create"
      ? `admin-product-${crypto.randomUUID()}`
      : existingProduct?.id ?? `admin-product-${crypto.randomUUID()}`;
  const time = nowIso();

  return {
    id,
    name: draft.name.trim(),
    category: draft.category.trim(),
    price: Number.parseInt(draft.price, 10),
    oldPrice: draft.oldPrice.trim() ? Number.parseInt(draft.oldPrice, 10) || null : null,
    description: draft.description.trim(),
    size: (draft.size || "M") as AdminProductSize,
    status: draft.status,
    photoLabel: "Фото товара",
    mainPhotoId: draft.mainPhotoId,
    photoIds: draft.photoIds,
    flags: {
      bestseller: draft.bestseller,
      isNew: draft.isNew,
      recommended: draft.recommended,
    },
    seoTitle: draft.seoTitle.trim(),
    seoDescription: draft.seoDescription.trim(),
    seoKeywords: draft.seoKeywords.trim(),
    seoSlug: draft.seoSlug.trim(),
    imageAltText: draft.imageAltText.trim(),
    canonicalUrl: draft.canonicalUrl.trim(),
    ogTitle: draft.ogTitle.trim(),
    ogDescription: draft.ogDescription.trim(),
    createdAt: mode === "create" ? time : existingProduct?.createdAt ?? time,
    updatedAt: time,
  };
}

function sanitizeDraftPhotos(draft: ProductDraft): ProductDraft {
  const availablePhotoIds = getAdminPhotoLibraryIdSet();
  const sanitized = sanitizeAdminPhotoAttachmentSelection(
    draft.photoIds,
    draft.mainPhotoId,
    availablePhotoIds,
  );

  return {
    ...draft,
    photoIds: sanitized.photoIds,
    mainPhotoId: sanitized.mainPhotoId,
  };
}

function sanitizeProductPhotos(product: AdminProduct): AdminProduct {
  const availablePhotoIds = getAdminPhotoLibraryIdSet();
  const sanitized = sanitizeAdminPhotoAttachmentSelection(
    product.photoIds,
    product.mainPhotoId,
    availablePhotoIds,
  );

  return {
    ...product,
    photoIds: sanitized.photoIds,
    mainPhotoId: sanitized.mainPhotoId,
  };
}

function resolveProductMainPhotoPreview(product: AdminProduct): string | null {
  const mainPhoto =
    (product.mainPhotoId ? getAdminPhotoItemById(product.mainPhotoId) : null) ??
    (product.photoIds[0] ? getAdminPhotoItemById(product.photoIds[0]) : null);

  return mainPhoto?.previewUrl ?? null;
}

function validateDraft(draft: ProductDraft): ProductValidationErrors {
  const errors: ProductValidationErrors = {};

  if (!draft.name.trim()) {
    errors.name = "Product name is required.";
  }

  if (!draft.category.trim()) {
    errors.category = "Category is required.";
  }

  const trimmedPrice = draft.price.trim();
  const parsedPrice = Number(trimmedPrice);

  if (!trimmedPrice) {
    errors.price = "Price is required.";
  } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Price must be greater than 0.";
  }

  if (!draft.size) {
    errors.size = "Size is required.";
  }

  return errors;
}

export function AdminProductManager() {
  useAdminPhotoLibraryPhotos();
  const [products, setProducts] = useState<AdminProduct[]>(() =>
    readStoredProducts().map((product) => sanitizeProductPhotos(normalizeProduct(product))),
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    products[0]?.id ?? null,
  );
  const [statusFilter, setStatusFilter] = useState<"all" | AdminProductStatus>("all");
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [draft, setDraft] = useState<ProductDraft>(() =>
    toDraft(products[0] ?? createProductSkeleton()),
  );
  const [formVisible, setFormVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ProductValidationErrors>({});
  const [editorBaselineId, setEditorBaselineId] = useState<string | null>(
    products[0]?.id ?? null,
  );

  useEffect(() => {
    const reconcileProductsWithPhotoLibrary = () => {
      setProducts((currentProducts) => {
        let changed = false;

        const nextProducts = currentProducts.map((product) => {
          const sanitized = sanitizeProductPhotos(product);

          if (
            sanitized.photoIds.length !== product.photoIds.length ||
            sanitized.mainPhotoId !== product.mainPhotoId
          ) {
            changed = true;
            return {
              ...sanitized,
              updatedAt: nowIso(),
            };
          }

          return product;
        });

        if (!changed) {
          return currentProducts;
        }

        persistProducts(nextProducts);
        return nextProducts;
      });

      setDraft((currentDraft) => sanitizeDraftPhotos(currentDraft));
    };

    return subscribeAdminPhotoLibrary(reconcileProductsWithPhotoLibrary);
  }, []);

  const updateProductList = (nextProducts: AdminProduct[], nextSelectedId?: string | null) => {
    const normalized = nextProducts.map((product) => sanitizeProductPhotos(normalizeProduct(product)));
    setProducts(normalized);
    persistProducts(normalized);
    if (nextSelectedId !== undefined) {
      setSelectedProductId(nextSelectedId);
    }
  };

  const openCreate = () => {
    setMode("create");
    setEditorBaselineId(selectedProductId);
    setSelectedProductId(null);
    setDraft(createEmptyDraft());
    setValidationErrors({});
    setFormVisible(true);
  };

  const openEdit = (product: AdminProduct) => {
    setMode("edit");
    setEditorBaselineId(product.id);
    setSelectedProductId(product.id);
    setDraft(toDraft(product));
    setValidationErrors({});
    setFormVisible(true);
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    const sanitizedDraft = sanitizeDraftPhotos(draft);
    const existingProduct =
      mode === "edit"
        ? products.find((product) => product.id === selectedProductId) ?? null
        : null;
    const nextProduct = buildProductFromDraft(sanitizedDraft, existingProduct, mode);

    if (mode === "create") {
      const next = [nextProduct, ...products];
      updateProductList(next, nextProduct.id);
      setSelectedProductId(nextProduct.id);
      setMode("edit");
      setEditorBaselineId(nextProduct.id);
      setDraft(toDraft(nextProduct));
    } else {
      const next = products.map((product) =>
        product.id === nextProduct.id ? nextProduct : product,
      );
      updateProductList(next, nextProduct.id);
      setDraft(toDraft(nextProduct));
      setEditorBaselineId(nextProduct.id);
    }

    setValidationErrors({});
    setFormVisible(true);
  };

  const cancelEdit = () => {
    if (mode === "edit" && editorBaselineId) {
      const baseline = products.find((product) => product.id === editorBaselineId);
      if (baseline) {
        setSelectedProductId(baseline.id);
        setDraft(toDraft(baseline));
      }
    } else {
      const fallback = products[0];
      setSelectedProductId(fallback?.id ?? null);
      setDraft(fallback ? toDraft(fallback) : createEmptyDraft());
    }

    setValidationErrors({});
    setFormVisible(false);
  };

  const deleteProduct = (productId: string) => {
    const next = products.filter((product) => product.id !== productId);
    updateProductList(next, next[0]?.id ?? null);

    if (selectedProductId === productId) {
      const fallback = next[0];
      if (fallback) {
        setMode("edit");
        setEditorBaselineId(fallback.id);
        setSelectedProductId(fallback.id);
        setDraft(toDraft(fallback));
        setFormVisible(true);
      } else {
        openCreate();
      }
    }
  };

  const setProductStatus = (productId: string, status: AdminProductStatus) => {
    const next = products.map((product) =>
      product.id === productId
        ? {
            ...product,
            status,
            updatedAt: nowIso(),
          }
        : product,
    );

    updateProductList(next, productId);

    if (selectedProductId === productId && mode === "edit") {
      setDraft((current) => ({ ...current, status }));
    }
  };

  const visibleProducts =
    statusFilter === "all"
      ? products
      : products.filter((product) => product.status === statusFilter);

  const statusCounts = {
    draft: products.filter((product) => product.status === "draft").length,
    published: products.filter((product) => product.status === "published").length,
    hidden: products.filter((product) => product.status === "hidden").length,
  };

  const clearFieldError = (field: keyof ProductValidationErrors) => {
    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  return (
    <section className={styles.manager}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Product Manager</p>
          <h2 className={styles.title}>Товары</h2>
          <p className={styles.lead}>
            Локальная витрина для управления товарами без базы данных и без API.
          </p>
        </div>

        <button type="button" className={styles.newButton} onClick={openCreate}>
          + New Product
        </button>
      </div>

      <div className={styles.metaRow}>
        <p className={styles.metaPill}>Всего: {products.length}</p>
        <p className={styles.metaPill}>Черновиков: {statusCounts.draft}</p>
        <p className={styles.metaPill}>Опубликованных: {statusCounts.published}</p>
        <p className={styles.metaPill}>Скрытых: {statusCounts.hidden}</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.listColumn}>
          <div className={styles.listHeader}>
            <h3 className={styles.sectionTitle}>Products list</h3>
            <p className={styles.sectionNote}>Demo products доступны для тестирования.</p>
          </div>

          <div className={styles.filterRow} role="tablist" aria-label="Фильтр публикации">
            {[
              { value: "all", label: "Все" },
              { value: "draft", label: "Черновики" },
              { value: "published", label: "Опубликованные" },
              { value: "hidden", label: "Скрытые" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === filter.value}
                className={`${styles.filterButton} ${
                  statusFilter === filter.value ? styles.filterButtonActive : ""
                }`}
                onClick={() => setStatusFilter(filter.value as "all" | AdminProductStatus)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.productList}>
            {visibleProducts.map((product) => {
              const isSelected = product.id === selectedProductId;
              const mainPhotoPreviewUrl = resolveProductMainPhotoPreview(product);
              const seoReady = isAdminProductSeoReady(product);
              const seoStatusLabel = getAdminProductSeoStatusLabel(product);
              const seoScore = getAdminProductSeoScore(product);

              return (
                <article
                  key={product.id}
                  className={`${styles.card} ${isSelected ? styles.cardActive : ""}`}
                >
                  <div className={styles.cardTop}>
                    {mainPhotoPreviewUrl ? (
                      <div className={styles.photoPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainPhotoPreviewUrl}
                          alt={product.name}
                          className={styles.photoPreviewImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <span>{product.photoLabel}</span>
                      </div>
                    )}
                    <div className={styles.cardBody}>
                      <p className={styles.productName}>{product.name}</p>
                      <p className={styles.productPrice}>{moneyLabel(product.price)}</p>
                      <div className={styles.cardMeta}>
                        <span className={styles.metaTag}>{product.category || "Без категории"}</span>
                        <span
                          className={`${styles.metaTag} ${getStatusToneClass(product.status, {
                            statusDraft: styles.statusDraft,
                            statusPublished: styles.statusPublished,
                            statusHidden: styles.statusHidden,
                          })}`}
                        >
                          {getStatusLabel(product.status)}
                        </span>
                        <span className={styles.metaTag}>Size {product.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.flagRow}>
                    <span
                      className={`${styles.flag} ${seoReady ? styles.seoReady : styles.seoIncomplete}`}
                    >
                      {seoStatusLabel}
                    </span>
                    <span className={`${styles.flag} ${styles.seoScoreFlag}`}>
                      SEO {seoScore.value}/{seoScore.max}
                    </span>
                    {product.flags.bestseller ? <span className={styles.flag}>Bestseller</span> : null}
                    {product.flags.isNew ? <span className={styles.flag}>New</span> : null}
                    {product.flags.recommended ? <span className={styles.flag}>Recommended</span> : null}
                  </div>

                  <div className={styles.quickActionRow}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => setProductStatus(product.id, "published")}
                    >
                      Опубликовать
                    </button>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => setProductStatus(product.id, "hidden")}
                    >
                      Скрыть
                    </button>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => setProductStatus(product.id, "draft")}
                    >
                      Вернуть в черновик
                    </button>
                  </div>

                  <div className={styles.buttonRow}>
                    <button type="button" className={styles.actionButton} onClick={() => openEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className={styles.actionButton} onClick={() => deleteProduct(product.id)}>
                      Delete
                    </button>
                  </div>

                  <p className={styles.metaLine}>
                    Updated {formatDateLabel(product.updatedAt)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <aside className={styles.formColumn}>
          <div className={styles.formHeader}>
            <h3 className={styles.sectionTitle}>
              {formVisible ? (mode === "create" ? "Create product" : "Edit product") : "Product Editor"}
            </h3>
            <p className={styles.sectionNote}>
              {formVisible
                ? mode === "create"
                  ? "Создайте новый товар и сохраните его в локальном состоянии."
                  : "Изменения применяются только после Save product."
                : "Нажмите New Product или Edit на карточке, чтобы открыть редактор."}
            </p>
          </div>

          {formVisible ? (
            <form className={styles.form} onSubmit={saveProduct}>
              <label className={styles.field}>
                <span>Product name</span>
                <input
                  value={draft.name}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, name: event.target.value }));
                    clearFieldError("name");
                  }}
                  className={styles.input}
                  placeholder="Например, Bella Rose"
                  aria-invalid={Boolean(validationErrors.name)}
                />
                {validationErrors.name ? (
                  <span className={styles.fieldError}>{validationErrors.name}</span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>Category</span>
                <input
                  value={draft.category}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, category: event.target.value }));
                    clearFieldError("category");
                  }}
                  className={styles.input}
                  placeholder="Розы, Пионы, Авторские"
                  aria-invalid={Boolean(validationErrors.category)}
                />
                {validationErrors.category ? (
                  <span className={styles.fieldError}>{validationErrors.category}</span>
                ) : null}
              </label>

              <div className={styles.splitRow}>
                <label className={styles.field}>
                  <span>Price</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, price: event.target.value }));
                      clearFieldError("price");
                    }}
                    className={styles.input}
                    placeholder="0"
                    aria-invalid={Boolean(validationErrors.price)}
                  />
                  {validationErrors.price ? (
                    <span className={styles.fieldError}>{validationErrors.price}</span>
                  ) : null}
                </label>
                <label className={styles.field}>
                  <span>Old price (optional)</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.oldPrice}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, oldPrice: event.target.value }))
                    }
                    className={styles.input}
                    placeholder="0"
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  className={styles.textarea}
                  rows={4}
                  placeholder="Короткое описание товара"
                />
              </label>

              <div className={styles.choiceBlock}>
                <span className={styles.choiceLabel}>Size</span>
                <div className={styles.choiceRow}>
                  {(["S", "M", "L", "XL"] as AdminProductSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`${styles.choiceButton} ${draft.size === size ? styles.choiceButtonActive : ""}`}
                      onClick={() => {
                        setDraft((current) => ({ ...current, size }));
                        clearFieldError("size");
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {validationErrors.size ? (
                  <span className={styles.fieldError}>{validationErrors.size}</span>
                ) : null}
              </div>

              <div className={styles.choiceBlock}>
                <span className={styles.choiceLabel}>Статус публикации</span>
                <div className={styles.choiceRow}>
                  {PUBLISH_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.choiceButton} ${
                        draft.status === option.value ? styles.choiceButtonActive : ""
                      }`}
                      onClick={() => {
                        setDraft((current) => ({ ...current, status: option.value }));
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.toggleGrid}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={draft.bestseller}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, bestseller: event.target.checked }))
                    }
                  />
                  <span>Bestseller</span>
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={draft.isNew}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, isNew: event.target.checked }))
                    }
                  />
                  <span>New</span>
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={draft.recommended}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, recommended: event.target.checked }))
                    }
                  />
                  <span>Recommended</span>
                </label>
              </div>

              <AdminProductPhotoAttachment
                attachedPhotoIds={draft.photoIds}
                mainPhotoId={draft.mainPhotoId}
                onChange={({ photoIds, mainPhotoId }) => {
                  setDraft((current) => ({
                    ...current,
                    photoIds,
                    mainPhotoId,
                  }));
                }}
              />

              <AdminProductSeoManager
                productName={draft.name}
                category={draft.category}
                size={draft.size}
                description={draft.description}
                mainPhotoName={
                  draft.mainPhotoId
                    ? getAdminPhotoItemById(draft.mainPhotoId)?.fileName
                    : undefined
                }
                seo={{
                  seoTitle: draft.seoTitle,
                  seoDescription: draft.seoDescription,
                  seoKeywords: draft.seoKeywords,
                  seoSlug: draft.seoSlug,
                  imageAltText: draft.imageAltText,
                  canonicalUrl: draft.canonicalUrl,
                  ogTitle: draft.ogTitle,
                  ogDescription: draft.ogDescription,
                }}
                onChange={(patch) => {
                  setDraft((current) => ({ ...current, ...patch }));
                }}
              />

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  {mode === "create" ? "Create product" : "Save product"}
                </button>
                <button type="button" className={styles.secondaryActionButton} onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.formPlaceholder}>
              <p className={styles.placeholderTitle}>Product Editor</p>
              <p className={styles.placeholderText}>
                Нажмите New Product или Edit на карточке, чтобы открыть редактор.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
