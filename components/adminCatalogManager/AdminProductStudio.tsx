"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type {
  AdminProductFormState,
  AdminProductImageDraft,
  AdminProductStatusFilter,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  catalogRecordToAdminForm,
  createEmptyAdminProductForm,
  slugifyProductTitle,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import {
  deleteAdminCatalogProduct,
  publishAdminCatalogProduct,
  saveAdminCatalogProduct,
  unpublishAdminCatalogProduct,
} from "@/components/adminCatalogManager/catalogApiClient";
import { resolveAdminCategoryTitle } from "@/components/adminCatalogManager/adminCustomCategories";
import { useAdminCategories } from "@/components/adminCatalogManager/useAdminCategories";
import { AdminCategoryManagerModal } from "@/components/adminCatalogManager/AdminCategoryManagerModal";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import styles from "@/components/adminCatalogManager/AdminProductStudio.module.css";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

type StudioMode = "list" | "create" | "edit";

type StudioNotice = {
  tone: "success" | "error" | "info";
  text: string;
};

type ImageUploadState = {
  fileKey: string;
  fileName: string;
  status: "uploading" | "failed";
  message: string;
  file?: File;
};

type AdminProductStudioProps = {
  products: CatalogProductRecord[];
  reload: () => Promise<void>;
  getProductById: (productId: string) => CatalogProductRecord | null;
  initialMode?: StudioMode;
  initialEditId?: string | null;
  imageStorageWarning?: string | null;
};

function formatPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU").format(priceRub);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function createImageId(file: File): string {
  return `image-${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Поддерживаются JPG, JPEG, PNG, WEBP и HEIC.";
  }

  if (file.size <= 0) {
    return "Файл пустой.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Файл больше 5 МБ.";
  }

  return null;
}

async function uploadImageFile(file: File): Promise<{ imageUrl: string; storage: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/admin/products/upload-image", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const body = (await response.json()) as {
    imageUrl?: string;
    storage?: string;
    message?: string;
  };

  if (!response.ok || !body.imageUrl) {
    throw new Error(body.message || "Не удалось загрузить изображение.");
  }

  return { imageUrl: body.imageUrl, storage: body.storage ?? "server" };
}

function formWithNormalizedImages(form: AdminProductFormState): AdminProductFormState {
  const sorted = [...form.images].sort((left, right) => left.sortOrder - right.sortOrder);
  const hasPrimary = sorted.some((image) => image.isPrimary);
  const images = sorted.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: hasPrimary ? image.isPrimary : index === 0,
  }));
  const primary = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  return {
    ...form,
    images,
    mainImageUrl: primary?.processedUrl || primary?.originalUrl || "",
    mainImageStorage: primary ? form.mainImageStorage : "none",
    mainImageTemporary: false,
    galleryUrls: images
      .filter((image) => !image.isPrimary)
      .map((image) => image.processedUrl || image.originalUrl),
  };
}

function duplicateForm(product: CatalogProductRecord): AdminProductFormState {
  const form = catalogRecordToAdminForm(product);
  const title = `${form.title} — копия`;
  return {
    ...form,
    id: null,
    title,
    slug: "",
    seoSlug: slugifyProductTitle(title),
    status: "draft",
  };
}

function getPrimaryImage(product: CatalogProductRecord) {
  return product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
}

export function AdminProductStudio({
  products,
  reload,
  getProductById,
  initialMode = "list",
  initialEditId = null,
  imageStorageWarning = null,
}: AdminProductStudioProps) {
  const initialProduct = initialEditId ? getProductById(initialEditId) : null;
  const [mode, setMode] = useState<StudioMode>(initialProduct ? "edit" : initialMode);
  const [form, setForm] = useState<AdminProductFormState>(
    initialProduct ? catalogRecordToAdminForm(initialProduct) : createEmptyAdminProductForm(),
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AdminProductStatusFilter>("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [notice, setNotice] = useState<StudioNotice | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceImageId, setReplaceImageId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const {
    categories,
    createCategory,
    renameCategory,
    deleteCategory,
  } = useAdminCategories();

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...products]
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesCategory =
          categoryFilter === "all" || product.categoryIds.includes(categoryFilter);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" &&
            product.isPublished &&
            product.status !== "ARCHIVED") ||
          (statusFilter === "draft" &&
            !product.isPublished &&
            product.status !== "ARCHIVED") ||
          (statusFilter === "archived" && product.status === "ARCHIVED");
        const matchesStock = stockFilter === "all" || product.availability === stockFilter;
        return matchesSearch && matchesCategory && matchesStatus && matchesStock;
      })
      .sort((left, right) => {
        if (sortBy === "name-asc") {
          return left.title.localeCompare(right.title, "ru");
        }
        if (sortBy === "price-asc") {
          return left.basePriceRub - right.basePriceRub;
        }
        if (sortBy === "price-desc") {
          return right.basePriceRub - left.basePriceRub;
        }
        return (
          new Date(right.metadata.updatedAt).getTime() -
          new Date(left.metadata.updatedAt).getTime()
        );
      });
  }, [categoryFilter, products, search, sortBy, statusFilter, stockFilter]);

  const updateForm = (patch: Partial<AdminProductFormState>) => {
    setNotice(null);
    setForm((current) => ({ ...current, ...patch }));
  };

  const openCreate = () => {
    setForm(createEmptyAdminProductForm());
    setUploadStates([]);
    setNotice(null);
    setMode("create");
  };

  const openEdit = (productId: string) => {
    const product = getProductById(productId);
    if (!product) {
      setNotice({ tone: "error", text: "Товар не найден." });
      return;
    }

    setForm(catalogRecordToAdminForm(product));
    setUploadStates([]);
    setNotice(null);
    setMode("edit");
  };

  const backToList = async () => {
    await reload();
    setMode("list");
    setNotice(null);
  };

  const validateForm = (nextForm: AdminProductFormState): string | null => {
    if (!nextForm.title.trim()) {
      return "Введите название товара.";
    }
    if (!nextForm.categoryId) {
      return "Выберите категорию.";
    }
    if (!SIZE_IDS.some((sizeId) => Number(nextForm.sizePrices[sizeId].replace(/\s/g, "")) > 0)) {
      return "Укажите цену хотя бы для одного размера.";
    }
    if (nextForm.images.length === 0) {
      return "Добавьте хотя бы одно изображение.";
    }
    return null;
  };

  const saveForm = async (status: "draft" | "published") => {
    if (saving) {
      return;
    }

    const nextForm = formWithNormalizedImages({ ...form, status });
    const error = validateForm(nextForm);
    if (error) {
      setNotice({ tone: "error", text: error });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const saved = await saveAdminCatalogProduct(nextForm);
      setForm(catalogRecordToAdminForm(saved));
      await reload();
      setMode("edit");
      setNotice({
        tone: "success",
        text: status === "published" ? "Товар опубликован." : "Черновик сохранён.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить товар.",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (product: CatalogProductRecord) => {
    if (savingStatusId) {
      return;
    }

    setSavingStatusId(product.id);
    setNotice(null);
    try {
      if (product.isPublished) {
        await unpublishAdminCatalogProduct(product.id);
        setNotice({ tone: "success", text: "Товар снят с публикации." });
      } else {
        await publishAdminCatalogProduct(product.id);
        setNotice({ tone: "success", text: "Товар опубликован." });
      }
      await reload();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось изменить публикацию.",
      });
    } finally {
      setSavingStatusId(null);
    }
  };

  const duplicateProduct = async (product: CatalogProductRecord) => {
    setSavingStatusId(product.id);
    setNotice(null);
    try {
      const saved = await saveAdminCatalogProduct(duplicateForm(product));
      await reload();
      setNotice({ tone: "success", text: `Создан черновик: ${saved.title}.` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось дублировать товар.",
      });
    } finally {
      setSavingStatusId(null);
    }
  };

  const deleteProduct = async () => {
    if (!deleteId) {
      return;
    }

    setSavingStatusId(deleteId);
    setNotice(null);
    try {
      await deleteAdminCatalogProduct(deleteId);
      await reload();
      setNotice({ tone: "success", text: "Товар удалён." });
      setDeleteId(null);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось удалить товар.",
      });
    } finally {
      setSavingStatusId(null);
    }
  };

  const appendFiles = async (files: File[]) => {
    const availableSlots = MAX_IMAGES - form.images.length;
    if (availableSlots <= 0) {
      setNotice({ tone: "error", text: "Можно загрузить до 10 изображений." });
      return;
    }

    const existingKeys = new Set(form.images.map((image) => image.filename));
    const uniqueFiles = files
      .slice(0, availableSlots)
      .filter((file) => !existingKeys.has(file.name));

    if (uniqueFiles.length === 0) {
      setNotice({ tone: "info", text: "Эти изображения уже добавлены." });
      return;
    }

    for (const file of uniqueFiles) {
      const fileKey = createFileKey(file);
      const validationError = validateImageFile(file);
      if (validationError) {
        setUploadStates((current) => [
          ...current,
          { fileKey, fileName: file.name, status: "failed", message: validationError, file },
        ]);
        continue;
      }

      setUploadStates((current) => [
        ...current.filter((state) => state.fileKey !== fileKey),
        { fileKey, fileName: file.name, status: "uploading", message: "Загрузка…", file },
      ]);

      try {
        const uploaded = await uploadImageFile(file);
        const now = new Date().toISOString();
        const image: AdminProductImageDraft = {
          id: createImageId(file),
          originalUrl: uploaded.imageUrl,
          processedUrl: uploaded.imageUrl,
          thumbnailUrl: uploaded.imageUrl,
          filename: file.name,
          mimeType: file.type,
          width: 1080,
          height: 1350,
          size: file.size,
          sortOrder: form.images.length,
          isPrimary: form.images.length === 0,
          processingStatus: "original",
          processingError: null,
          createdAt: now,
          updatedAt: now,
        };

        setForm((current) =>
          formWithNormalizedImages({
            ...current,
            mainImageStorage: uploaded.storage === "blob" ? "blob" : "server",
            images: [...current.images, image],
          }),
        );
        setUploadStates((current) => current.filter((state) => state.fileKey !== fileKey));
      } catch (error) {
        setUploadStates((current) =>
          current.map((state) =>
            state.fileKey === fileKey
              ? {
                  ...state,
                  status: "failed",
                  message:
                    error instanceof Error ? error.message : "Не удалось загрузить изображение.",
                  file,
                }
              : state,
          ),
        );
      }
    }
  };

  const replaceImage = async (file: File | null) => {
    if (!file || !replaceImageId) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setNotice({ tone: "error", text: validationError });
      return;
    }

    try {
      const uploaded = await uploadImageFile(file);
      const now = new Date().toISOString();
      setForm((current) =>
        formWithNormalizedImages({
          ...current,
          mainImageStorage: uploaded.storage === "blob" ? "blob" : "server",
          images: current.images.map((image) =>
            image.id === replaceImageId
              ? {
                  ...image,
                  originalUrl: uploaded.imageUrl,
                  processedUrl: uploaded.imageUrl,
                  thumbnailUrl: uploaded.imageUrl,
                  filename: file.name,
                  mimeType: file.type,
                  size: file.size,
                  updatedAt: now,
                }
              : image,
          ),
        }),
      );
      setNotice({ tone: "success", text: "Изображение заменено." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось заменить изображение.",
      });
    } finally {
      setReplaceImageId(null);
    }
  };

  const setPrimaryImage = (imageId: string) => {
    setForm((current) =>
      formWithNormalizedImages({
        ...current,
        images: current.images.map((image) => ({
          ...image,
          isPrimary: image.id === imageId,
        })),
      }),
    );
  };

  const moveImage = (imageId: string, direction: -1 | 1) => {
    setForm((current) => {
      const images = [...current.images].sort((left, right) => left.sortOrder - right.sortOrder);
      const index = images.findIndex((image) => image.id === imageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= images.length) {
        return current;
      }
      const [image] = images.splice(index, 1);
      images.splice(nextIndex, 0, image);
      return formWithNormalizedImages({
        ...current,
        images: images.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
      });
    });
  };

  const deleteImage = (imageId: string) => {
    setForm((current) =>
      formWithNormalizedImages({
        ...current,
        images: current.images.filter((image) => image.id !== imageId),
      }),
    );
  };

  if (mode !== "list") {
    const categoryTitle = resolveAdminCategoryTitle(form.categoryId);
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <button type="button" className={styles.secondaryButton} onClick={() => void backToList()}>
            Назад
          </button>
          <div>
            <p className={styles.eyebrow}>{mode === "create" ? "Новый товар" : "Редактирование"}</p>
            <h2 className={styles.title}>Студия товара</h2>
            <p className={styles.lead}>{categoryTitle} · сохранение через серверный каталог</p>
          </div>
        </header>

        {imageStorageWarning ? <p className={styles.warning}>{imageStorageWarning}</p> : null}
        {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

        <div className={styles.editorGrid}>
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Основное</h3>
            <label className={styles.field}>
              <span>Название *</span>
              <input
                value={form.title}
                onChange={(event) => {
                  const title = event.target.value;
                  updateForm({
                    title,
                    seoSlug: form.id ? form.seoSlug : slugifyProductTitle(title),
                  });
                }}
                placeholder="Например, Пионовидная роза"
              />
            </label>
            <label className={styles.field}>
              <span>Категория *</span>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={form.categoryId}
                  onChange={(event) => updateForm({ categoryId: event.target.value })}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setCategoryManagerOpen(true)}
                >
                  Категории
                </button>
              </div>
            </label>
            <label className={styles.field}>
              <span>Краткое описание</span>
              <textarea
                value={form.shortDescription}
                onChange={(event) => updateForm({ shortDescription: event.target.value })}
                rows={3}
              />
            </label>
            <label className={styles.field}>
              <span>Состав букета</span>
              <textarea
                value={form.composition}
                onChange={(event) => updateForm({ composition: event.target.value })}
                rows={3}
              />
            </label>

            <div className={styles.priceGrid}>
              {SIZE_IDS.map((sizeId) => (
                <label className={styles.field} key={sizeId}>
                  <span>Цена {sizeId}</span>
                  <input
                    inputMode="numeric"
                    value={form.sizePrices[sizeId]}
                    onChange={(event) =>
                      updateForm({
                        sizePrices: { ...form.sizePrices, [sizeId]: event.target.value },
                      })
                    }
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
            <label className={styles.field}>
              <span>Старая цена</span>
              <input
                inputMode="numeric"
                value={form.oldPriceRub}
                onChange={(event) => updateForm({ oldPriceRub: event.target.value })}
              />
            </label>
          </section>

          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Изображения *</h3>
            <div
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void appendFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <p>Перетащите фото сюда или выберите из устройства</p>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => fileInputRef.current?.click()}
              >
                Выбрать фото
              </button>
              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  void appendFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </div>

            {uploadStates.length > 0 ? (
              <div className={styles.uploadList}>
                {uploadStates.map((state) => (
                  <div key={state.fileKey} className={styles.uploadState}>
                    <span>{state.fileName}</span>
                    <span>{state.message}</span>
                    {state.status === "failed" && state.file ? (
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => void appendFiles([state.file as File])}
                      >
                        Повторить
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.imageGrid}>
              {form.images.map((image, index) => (
                <article key={image.id} className={styles.imageCard}>
                  <div className={styles.imageFrame}>
                    <Image
                      src={image.thumbnailUrl || image.processedUrl || image.originalUrl}
                      alt={form.title || image.filename}
                      fill
                      sizes="140px"
                      className={styles.image}
                      unoptimized
                    />
                    {image.isPrimary ? <span className={styles.primaryBadge}>Главное</span> : null}
                  </div>
                  <p className={styles.imageName}>{image.filename}</p>
                  <div className={styles.imageActions}>
                    <button type="button" onClick={() => setPrimaryImage(image.id)}>
                      Главное
                    </button>
                    <button type="button" onClick={() => moveImage(image.id, -1)} disabled={index === 0}>
                      Вверх
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(image.id, 1)}
                      disabled={index === form.images.length - 1}
                    >
                      Вниз
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceImageId(image.id);
                        replaceInputRef.current?.click();
                      }}
                    >
                      Заменить
                    </button>
                    <button type="button" onClick={() => deleteImage(image.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <input
              ref={replaceInputRef}
              className={styles.hiddenInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(event) => {
                void replaceImage(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </section>

          <details className={styles.panel}>
            <summary className={styles.panelTitle}>Расширенные поля</summary>
            <div className={styles.priceGrid}>
              <label className={styles.field}>
                <span>Количество цветов</span>
                <input value={form.flowerCount} onChange={(event) => updateForm({ flowerCount: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Высота, см</span>
                <input value={form.heightCm} onChange={(event) => updateForm({ heightCm: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Ширина, см</span>
                <input value={form.widthCm} onChange={(event) => updateForm({ widthCm: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Повод</span>
                <input value={form.occasion} onChange={(event) => updateForm({ occasion: event.target.value })} />
              </label>
            </div>
            <label className={styles.field}>
              <span>Цветовая палитра</span>
              <input value={form.colorPalette} onChange={(event) => updateForm({ colorPalette: event.target.value })} placeholder="розовый, белый" />
            </label>
            <label className={styles.field}>
              <span>Полное описание</span>
              <textarea value={form.fullDescription} onChange={(event) => updateForm({ fullDescription: event.target.value })} rows={4} />
            </label>
            <div className={styles.checkGrid}>
              {[
                ["isBestseller", "Бестселлер"],
                ["isNew", "Новинка"],
                ["isFeatured", "На главной"],
                ["isPromotion", "Акция"],
              ].map(([key, label]) => (
                <label key={key} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof AdminProductFormState])}
                    onChange={(event) => updateForm({ [key]: event.target.checked } as Partial<AdminProductFormState>)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </details>

          <details className={styles.panel}>
            <summary className={styles.panelTitle}>SEO</summary>
            <label className={styles.field}>
              <span>SEO-заголовок</span>
              <input value={form.seoTitle} onChange={(event) => updateForm({ seoTitle: event.target.value })} />
            </label>
            <label className={styles.field}>
              <span>SEO-описание</span>
              <textarea value={form.seoDescription} onChange={(event) => updateForm({ seoDescription: event.target.value })} rows={3} />
            </label>
            <label className={styles.field}>
              <span>Адрес страницы (slug)</span>
              <input value={form.seoSlug} onChange={(event) => updateForm({ seoSlug: event.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Alt главного фото</span>
              <input value={form.seoImageAlt} onChange={(event) => updateForm({ seoImageAlt: event.target.value, mainImageAlt: event.target.value })} />
            </label>
          </details>
        </div>

        <footer className={styles.stickyActions}>
          <div className={styles.stickyActionsSecondaryRow}>
            <button type="button" className={`${styles.secondaryButton} ${styles.cancelAction}`} onClick={() => void backToList()}>
              Отмена
            </button>
            <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => void saveForm("draft")}>
              {saving ? "Сохранение…" : "Сохранить черновик"}
            </button>
          </div>
          <button type="button" className={styles.primaryButton} disabled={saving} onClick={() => void saveForm("published")}>
            {saving ? "Публикация…" : "Опубликовать"}
          </button>
        </footer>

        <AdminCategoryManagerModal
          open={categoryManagerOpen}
          categories={categories}
          onClose={() => setCategoryManagerOpen(false)}
          onCreate={createCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>BellaFlore</p>
          <h2 className={styles.title}>Товары</h2>
          <p className={styles.lead}>Создание, публикация, изображения и управление витриной.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setCategoryManagerOpen(true)}
          >
            Категории
          </button>
          <button type="button" className={styles.primaryButton} onClick={openCreate}>
            Добавить товар
          </button>
        </div>
      </header>

      {imageStorageWarning ? <p className={styles.warning}>{imageStorageWarning}</p> : null}
      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

      <section className={styles.toolbar} aria-label="Фильтры товаров">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию"
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminProductStatusFilter)}>
          <option value="all">Все публикации</option>
          <option value="published">Опубликованы</option>
          <option value="draft">Черновики</option>
          <option value="archived">Архив</option>
        </select>
        <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
          <option value="all">Любой склад</option>
          <option value="in_stock">В наличии</option>
          <option value="out_of_stock">Нет в наличии</option>
          <option value="made_to_order">Под заказ</option>
          <option value="coming_soon">Скоро</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="updated-desc">Сначала обновлённые</option>
          <option value="name-asc">По названию</option>
          <option value="price-asc">Цена ↑</option>
          <option value="price-desc">Цена ↓</option>
        </select>
      </section>

      {filteredProducts.length === 0 ? (
        <p className={styles.empty}>Товары не найдены. Измените фильтры или добавьте товар.</p>
      ) : null}

      <div className={styles.productGrid}>
        {filteredProducts.map((product) => {
          const primary = getPrimaryImage(product);
          const isBusy = savingStatusId === product.id;
          return (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                {primary?.url ? (
                  <Image src={primary.url} alt={primary.alt || product.title} fill sizes="120px" className={styles.image} unoptimized />
                ) : (
                  <span>Нет фото</span>
                )}
              </div>
              <div className={styles.productBody}>
                <div className={styles.cardTitleRow}>
                  <h3>{product.title}</h3>
                  <label className={`${styles.switch} ${product.isPublished ? styles.switchOn : ""}`}>
                    <input
                      type="checkbox"
                      checked={product.isPublished}
                      disabled={isBusy || product.status === "ARCHIVED"}
                      onChange={() => void togglePublish(product)}
                    />
                    <span />
                  </label>
                </div>
                <p className={styles.productCategory}>{resolveAdminCategoryTitle(product.categoryIds[0] ?? "")}</p>
                <p className={styles.productPrice}>
                  {formatPrice(product.basePriceRub)} ₽
                  {product.metadata.oldPriceRub ? (
                    <span className={styles.oldPrice}> {formatPrice(product.metadata.oldPriceRub)} ₽</span>
                  ) : null}
                </p>
                <div className={styles.metaRow}>
                  <span className={styles.publishStatus}>{product.isPublished ? "Опубликован" : "Черновик"}</span>
                  <span className={styles.extendedCardMeta}>{product.availability === "in_stock" ? "В наличии" : "Нет/под заказ"}</span>
                  <span className={styles.extendedCardMeta}>{formatDate(product.metadata.updatedAt)}</span>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => openEdit(product.id)}>Редактировать</button>
                  <div className={styles.cardActionsRow}>
                    <button type="button" disabled={isBusy} onClick={() => void duplicateProduct(product)}>Дублировать</button>
                    <button type="button" disabled={isBusy} onClick={() => setDeleteId(product.id)}>Удалить</button>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  <button type="button" onClick={() => openEdit(product.id)}>Изменить</button>
                  <details className={styles.mobileOverflow}>
                    <summary aria-label={`Действия для ${product.title}`}>⋯</summary>
                    <div className={styles.mobileOverflowMenu}>
                      <button type="button" disabled={isBusy} onClick={() => void duplicateProduct(product)}>
                        Дублировать
                      </button>
                      <button type="button" disabled={isBusy} onClick={() => setDeleteId(product.id)}>
                        Удалить
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {deleteId ? (
        <div className={styles.dialogBackdrop}>
          <div className={styles.dialog} role="dialog" aria-modal="true">
            <h3>Удалить товар?</h3>
            <p>{getProductById(deleteId)?.title ?? "Этот товар"} будет удалён из каталога.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setDeleteId(null)}>
                Отмена
              </button>
              <button type="button" className={styles.dangerButton} onClick={() => void deleteProduct()}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminCategoryManagerModal
        open={categoryManagerOpen}
        categories={categories}
        onClose={() => setCategoryManagerOpen(false)}
        onCreate={createCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
      />
    </div>
  );
}
