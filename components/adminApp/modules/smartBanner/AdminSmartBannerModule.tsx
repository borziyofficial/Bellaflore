// ==================================================
// SECTION: ADMIN APP — Smart banner module (promo banner management)
// РАЗДЕЛ: Умный баннер — управление промо-слайдами (Hero не затрагивается)
//
// This manages a real promotional-slide system that renders between the
// Hero and the catalog grid on the storefront (see
// components/home/SmartPromoBanner.tsx). It is intentionally separate from
// the Hero itself (components/home/HeroSection.tsx / lib/heroBannerDb.ts),
// which this section no longer edits.
// ==================================================
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/smartBanner/AdminSmartBannerModule.module.css";
import {
  ensureCatalogLoaded,
  getCachedProducts,
  ADMIN_CATALOG_CACHE_EVENT,
} from "@/components/adminCatalogManager/adminCatalogCache";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { homeCatalogCategoryChips } from "@/components/catalog/homeCatalogConfig";
import { useStorefrontCustomCategories } from "@/components/catalog/useStorefrontCustomCategories";
import { SmartPromoBanner } from "@/components/home/SmartPromoBanner";

type PromoBannerMode = "manual" | "auto";
type PromoBannerAutoSource = "featured" | "popular" | "new" | "bestsellers" | "admin_selected";
type SlideDestinationType = "url" | "category";

type PromoBannerSettings = {
  mode: PromoBannerMode;
  autoSource: PromoBannerAutoSource;
  autoSelectedProductIds: string[];
  autoSlideLimit: number;
  updatedAt: string;
};

type PromoBannerSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  priority: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type ResolvedPromoSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
};

type PromoBannerSnapshot = {
  settings: PromoBannerSettings;
  slides: PromoBannerSlide[];
};

const SOURCE_OPTIONS: { id: PromoBannerAutoSource; label: string; hint: string }[] = [
  { id: "featured", label: "Рекомендуемые", hint: "Товары с отметкой «На главной»" },
  { id: "popular", label: "Популярные", hint: "Рекомендуемые и бестселлеры вместе" },
  { id: "new", label: "Новинки", hint: "Товары с отметкой «Новинка»" },
  { id: "bestsellers", label: "Хиты продаж", hint: "Товары с отметкой «Бестселлер»" },
  { id: "admin_selected", label: "Выбранные вручную", hint: "Вы выбираете конкретные товары" },
];

const EMPTY_SETTINGS: PromoBannerSettings = {
  mode: "manual",
  autoSource: "featured",
  autoSelectedProductIds: [],
  autoSlideLimit: 8,
  updatedAt: "",
};

type SlideFormState = {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  destinationType: SlideDestinationType;
  categoryId: string;
  isEnabled: boolean;
  imageUrl: string;
  imageFile: File | null;
  removeImage: boolean;
};

const EMPTY_SLIDE_FORM: SlideFormState = {
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",
  destinationType: "url",
  categoryId: "",
  isEnabled: true,
  imageUrl: "",
  imageFile: null,
  removeImage: false,
};

function formatPriceLabel(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  })} МБ`;
}

function getImageFileName(imageUrl: string): string {
  try {
    return decodeURIComponent(
      new URL(imageUrl, "https://bellaflore.ru").pathname.split("/").pop() || "Фото",
    );
  } catch {
    return "Фото";
  }
}

function getCategoryIdFromLink(buttonLink: string): string {
  try {
    return new URL(buttonLink, "https://bellaflore.ru").searchParams.get("category") ?? "";
  } catch {
    return "";
  }
}

function buildCategoryLink(categoryId: string): string {
  return `/?category=${encodeURIComponent(categoryId)}#catalog`;
}

export function AdminSmartBannerModule({
  initialSnapshot,
}: {
  initialSnapshot?: PromoBannerSnapshot | null;
}) {
  const [settings, setSettings] = useState<PromoBannerSettings>(
    initialSnapshot?.settings ?? EMPTY_SETTINGS,
  );
  // Draft settings mirror the form the admin is editing. They start equal to
  // the saved settings and only diverge until "Сохранить настройки" is
  // pressed — this is what lets the preview panel react instantly to a
  // mode/source change without persisting anything yet.
  const [draftMode, setDraftMode] = useState<PromoBannerMode>(
    initialSnapshot?.settings.mode ?? "manual",
  );
  const [draftSource, setDraftSource] = useState<PromoBannerAutoSource>(
    initialSnapshot?.settings.autoSource ?? "featured",
  );
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>(
    initialSnapshot?.settings.autoSelectedProductIds ?? [],
  );
  const [draftLimit, setDraftLimit] = useState(
    initialSnapshot?.settings.autoSlideLimit ?? 8,
  );

  const [slides, setSlides] = useState<PromoBannerSlide[]>(initialSnapshot?.slides ?? []);
  const [products, setProducts] = useState<CatalogProductRecord[]>(getCachedProducts());
  const customCategories = useStorefrontCustomCategories();
  const [ready, setReady] = useState(Boolean(initialSnapshot));
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [previewSlides, setPreviewSlides] = useState<ResolvedPromoSlide[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [slideModal, setSlideModal] = useState<{ id: string | null; form: SlideFormState } | null>(
    null,
  );
  const [savingSlide, setSavingSlide] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Avoid re-creating (and leaking) an object URL on every keystroke while
  // the slide modal is open — only recompute when the selected file changes.
  const slideModalImageFile = slideModal?.form.imageFile ?? null;
  const slideModalFilePreviewUrl = useMemo(
    () => (slideModalImageFile ? URL.createObjectURL(slideModalImageFile) : null),
    [slideModalImageFile],
  );
  useEffect(() => {
    return () => {
      if (slideModalFilePreviewUrl) {
        URL.revokeObjectURL(slideModalFilePreviewUrl);
      }
    };
  }, [slideModalFilePreviewUrl]);

  // --- initial load: settings + slides (real DB) + warm admin product cache ---
  useEffect(() => {
    let active = true;

    void ensureCatalogLoaded().then(() => {
      if (active) setProducts(getCachedProducts());
    });
    const onCacheChange = () => setProducts(getCachedProducts());
    window.addEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);

    if (initialSnapshot) {
      return () => {
        active = false;
        window.removeEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);
      };
    }

    const controller = new AbortController();
    fetch("/api/admin/promo-banner", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as PromoBannerSnapshot & { message?: string };
        if (!response.ok) {
          throw new Error(body.message || "Не удалось загрузить баннер.");
        }
        return body;
      })
      .then((body) => {
        if (!active) return;
        setSettings(body.settings);
        setDraftMode(body.settings.mode);
        setDraftSource(body.settings.autoSource);
        setDraftSelectedIds(body.settings.autoSelectedProductIds);
        setDraftLimit(body.settings.autoSlideLimit);
        setSlides(body.slides);
      })
      .catch((error) => {
        if (active) {
          setNotice({
            tone: "error",
            text: error instanceof Error ? error.message : "Не удалось загрузить баннер.",
          });
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);
    };
  }, [initialSnapshot]);

  const manualPreview: ResolvedPromoSlide[] = useMemo(
    () =>
      slides
        .filter((slide) => slide.isEnabled)
        .sort((left, right) => left.priority - right.priority)
        .map((slide) => ({
          id: slide.id,
          imageUrl: slide.imageUrl,
          title: slide.title,
          subtitle: slide.subtitle,
          buttonText: slide.buttonText,
          buttonLink: slide.buttonLink,
        })),
    [slides],
  );

  // --- live preview: manual mode reflects the real (already-persisted)
  // slide list directly via `manualPreview` (computed at render time, no
  // effect needed); auto mode asks the server to run the real catalog
  // filter against the *draft* (possibly unsaved) source/selection so the
  // admin sees the effect before clicking "Сохранить настройки". Only the
  // auto-mode branch needs an effect at all, since it's the only case doing
  // an async fetch. ---
  useEffect(() => {
    if (draftMode !== "auto") {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      fetch("/api/admin/promo-banner/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: draftMode,
          autoSource: draftSource,
          autoSelectedProductIds: draftSelectedIds,
          autoSlideLimit: draftLimit,
        }),
      })
        .then(async (response) => {
          const body = (await response.json()) as {
            slides?: ResolvedPromoSlide[];
            message?: string;
          };
          if (!response.ok) {
            throw new Error(body.message || "Не удалось построить предпросмотр.");
          }
          return body;
        })
        .then((body) => {
          if (active) setPreviewSlides(body.slides ?? []);
        })
        .catch(() => {
          if (active) setPreviewSlides([]);
        })
        .finally(() => {
          if (active) setPreviewLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draftMode, draftSource, draftSelectedIds, draftLimit]);

  // The banner actually shown in the preview: the live manual slide list in
  // manual mode, or the last auto-mode fetch result otherwise.
  const displayedPreviewSlides = draftMode === "manual" ? manualPreview : previewSlides;
  const isPreviewLoading = draftMode === "auto" && previewLoading;
  const hasUnsavedSettingsChanges =
    draftMode !== settings.mode ||
    draftSource !== settings.autoSource ||
    draftLimit !== settings.autoSlideLimit ||
    draftSelectedIds.join(",") !== settings.autoSelectedProductIds.join(",");

  const saveSettings = useCallback(async () => {
    setSavingSettings(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/promo-banner/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            mode: draftMode,
            autoSource: draftSource,
            autoSelectedProductIds: draftSelectedIds,
            autoSlideLimit: draftLimit,
          },
        }),
      });
      const body = (await response.json()) as { settings?: PromoBannerSettings; message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сохранить баннер.");
      }
      if (body.settings) {
        setSettings(body.settings);
        setDraftMode(body.settings.mode);
        setDraftSource(body.settings.autoSource);
        setDraftSelectedIds(body.settings.autoSelectedProductIds);
        setDraftLimit(body.settings.autoSlideLimit);
      }
      setNotice({ tone: "success", text: "Настройки баннера сохранены и обновлены на витрине." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить баннер.",
      });
    } finally {
      setSavingSettings(false);
    }
  }, [draftMode, draftSource, draftSelectedIds, draftLimit]);

  // --- manual slide CRUD ---
  const reloadSlides = useCallback(async () => {
    const response = await fetch("/api/admin/promo-banner/slides", {
      credentials: "include",
      cache: "no-store",
    });
    const body = (await response.json()) as { slides?: PromoBannerSlide[] };
    if (body.slides) setSlides(body.slides);
  }, []);

  const openCreateSlide = () => {
    setSlideModal({ id: null, form: EMPTY_SLIDE_FORM });
  };

  const openEditSlide = (slide: PromoBannerSlide) => {
    const categoryId = getCategoryIdFromLink(slide.buttonLink);
    setSlideModal({
      id: slide.id,
      form: {
        title: slide.title,
        subtitle: slide.subtitle,
        buttonText: slide.buttonText,
        buttonLink: slide.buttonLink,
        destinationType: categoryId ? "category" : "url",
        categoryId,
        isEnabled: slide.isEnabled,
        imageUrl: slide.imageUrl,
        imageFile: null,
        removeImage: false,
      },
    });
  };

  const closeSlideModal = () => setSlideModal(null);

  const saveSlide = async () => {
    if (!slideModal) return;
    const hasImage = Boolean(
      slideModal.form.imageFile ||
        (!slideModal.form.removeImage && slideModal.form.imageUrl),
    );
    if (!hasImage) {
      setNotice({ tone: "error", text: "Добавьте изображение для слайда." });
      return;
    }
    setSavingSlide(true);
    setNotice(null);
    try {
      const { id, form } = slideModal;
      const buttonLink =
        form.destinationType === "category" && form.categoryId
          ? buildCategoryLink(form.categoryId)
          : form.buttonLink.trim();
      if (id) {
        const patchResponse = await fetch(`/api/admin/promo-banner/slides/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patch: {
              title: form.title,
              subtitle: form.subtitle,
              buttonText: form.buttonText,
              buttonLink,
              isEnabled: form.isEnabled,
              imageUrl: form.removeImage ? "" : form.imageUrl,
            },
          }),
        });
        if (!patchResponse.ok) {
          const body = (await patchResponse.json()) as { message?: string };
          throw new Error(body.message || "Не удалось сохранить слайд.");
        }
        if (form.imageFile) {
          const imageForm = new FormData();
          imageForm.append("image", form.imageFile);
          const imageResponse = await fetch(`/api/admin/promo-banner/slides/${id}/image`, {
            method: "POST",
            credentials: "include",
            body: imageForm,
          });
          if (!imageResponse.ok) {
            const body = (await imageResponse.json()) as { message?: string };
            throw new Error(body.message || "Не удалось загрузить изображение.");
          }
        }
      } else {
        const createForm = new FormData();
        createForm.append("title", form.title);
        createForm.append("subtitle", form.subtitle);
        createForm.append("buttonText", form.buttonText);
        createForm.append("buttonLink", buttonLink);
        createForm.append("isEnabled", String(form.isEnabled));
        if (form.imageFile) {
          createForm.append("image", form.imageFile);
        }
        const createResponse = await fetch("/api/admin/promo-banner/slides", {
          method: "POST",
          credentials: "include",
          body: createForm,
        });
        if (!createResponse.ok) {
          const body = (await createResponse.json()) as { message?: string };
          throw new Error(body.message || "Не удалось создать слайд.");
        }
      }

      await reloadSlides();
      setNotice({ tone: "success", text: "Слайд сохранён." });
      closeSlideModal();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить слайд.",
      });
    } finally {
      setSavingSlide(false);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!window.confirm("Удалить слайд? Это необратимо.")) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/promo-banner/slides/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Не удалось удалить слайд.");
      }
      await reloadSlides();
      setNotice({ tone: "success", text: "Слайд удалён." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось удалить слайд.",
      });
    }
  };

  const toggleSlideEnabled = async (slide: PromoBannerSlide) => {
    setSlides((current) =>
      current.map((item) =>
        item.id === slide.id ? { ...item, isEnabled: !item.isEnabled } : item,
      ),
    );
    try {
      const response = await fetch(`/api/admin/promo-banner/slides/${slide.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { isEnabled: !slide.isEnabled } }),
      });
      if (!response.ok) {
        throw new Error();
      }
    } catch {
      await reloadSlides();
      setNotice({ tone: "error", text: "Не удалось изменить статус слайда." });
    }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) {
      return;
    }
    const reordered = [...slides];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setSlides(reordered);
    try {
      const response = await fetch("/api/admin/promo-banner/slides/reorder", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((slide) => slide.id) }),
      });
      const body = (await response.json()) as { slides?: PromoBannerSlide[] };
      if (body.slides) setSlides(body.slides);
    } catch {
      await reloadSlides();
    }
  };

  // --- admin-selected product picker ---
  const publishedProducts = useMemo(
    () => products.filter((product) => product.isPublished),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return publishedProducts;
    return publishedProducts.filter((product) => product.title.toLowerCase().includes(query));
  }, [publishedProducts, productQuery]);
  const selectedProducts = useMemo(
    () =>
      draftSelectedIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is CatalogProductRecord => Boolean(product)),
    [draftSelectedIds, products],
  );
  const destinationCategories = useMemo(() => {
    const builtIn = homeCatalogCategoryChips
      .filter((category) => category.id !== "all")
      .map((category) => ({ id: category.id, title: category.label }));
    const existingIds = new Set(builtIn.map((category) => category.id));
    return [
      ...builtIn,
      ...customCategories.filter((category) => !existingIds.has(category.id)),
    ];
  }, [customCategories]);

  const toggleProductSelected = (id: string) => {
    setDraftSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const selectSlideImage = (file: File | undefined) => {
    if (!file || !slideModal) {
      return;
    }
    setSlideModal({
      ...slideModal,
      form: {
        ...slideModal.form,
        imageFile: file,
        removeImage: false,
      },
    });
  };

  const removeSlideImage = () => {
    if (!slideModal) {
      return;
    }
    setSlideModal({
      ...slideModal,
      form: {
        ...slideModal.form,
        imageUrl: "",
        imageFile: null,
        removeImage: true,
      },
    });
  };

  if (!ready) {
    return (
      <div className={styles.moduleRoot} aria-label="Загрузка умного баннера" aria-busy="true">
        <div className={styles.loadingHeader} />
        <div className={styles.loadingGrid}>
          <div className={styles.loadingPanel} />
          <div className={styles.loadingPreview} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${ui.stack} ${styles.moduleRoot}`}>
      <AdminModuleHeader
        title="Умный баннер"
        subtitle="Промо-слайды между Hero и каталогом на главной странице"
      />

      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <AdminPanel title="Режим баннера">
            <div className={styles.modeToggle} role="tablist" aria-label="Режим баннера">
              <button
                type="button"
                role="tab"
                aria-selected={draftMode === "manual"}
                className={`${styles.modeButton} ${draftMode === "manual" ? styles.modeButtonActive : ""}`}
                onClick={() => setDraftMode("manual")}
              >
                Ручной режим
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={draftMode === "auto"}
                className={`${styles.modeButton} ${draftMode === "auto" ? styles.modeButtonActive : ""}`}
                onClick={() => setDraftMode("auto")}
              >
                Автоматический режим
              </button>
            </div>

            {draftMode === "auto" ? (
              <>
                <p className={styles.sectionLabel}>Источник слайдов</p>
                <div className={styles.sourceGrid}>
                  {SOURCE_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`${styles.sourceOption} ${
                        draftSource === option.id ? styles.sourceOptionActive : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="promo-banner-source"
                        checked={draftSource === option.id}
                        onChange={() => setDraftSource(option.id)}
                      />
                      <span className={styles.sourceOptionTitle}>{option.label}</span>
                      <span className={styles.sourceOptionHint}>{option.hint}</span>
                    </label>
                  ))}
                </div>

                <div className={styles.field}>
                  <span>Количество слайдов (1–20)</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={draftLimit}
                    onChange={(event) =>
                      setDraftLimit(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
                    }
                  />
                </div>

                {draftSource === "admin_selected" ? (
                  <div className={styles.pickerWrap}>
                    {selectedProducts.length > 0 ? (
                      <div className={styles.selectedChips}>
                        {selectedProducts.map((product) => (
                          <span key={product.id} className={styles.chip}>
                            {product.title}
                            <button
                              type="button"
                              aria-label={`Убрать ${product.title}`}
                              onClick={() => toggleProductSelected(product.id)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={ui.listItemMuted}>Товары не выбраны.</p>
                    )}
                    <input
                      className={styles.pickerSearch}
                      value={productQuery}
                      onChange={(event) => setProductQuery(event.target.value)}
                      placeholder="Поиск опубликованных товаров…"
                    />
                    <div className={styles.pickerList}>
                      {filteredProducts.length === 0 ? (
                        <p className={ui.listItemMuted}>Ничего не найдено.</p>
                      ) : (
                        filteredProducts.slice(0, 40).map((product) => (
                          <label key={product.id} className={styles.pickerRow}>
                            <input
                              type="checkbox"
                              checked={draftSelectedIds.includes(product.id)}
                              onChange={() => toggleProductSelected(product.id)}
                            />
                            <span className={styles.pickerRowTitle}>{product.title}</span>
                            <span className={styles.pickerRowPrice}>
                              {formatPriceLabel(product.basePriceRub)}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className={styles.futureNote}>
                Слайды формируются вручную ниже — создавайте, редактируйте, включайте и
                отключайте их. Порядок совпадает с порядком на витрине.
              </p>
            )}

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={savingSettings || !hasUnsavedSettingsChanges}
                onClick={() => void saveSettings()}
              >
                {savingSettings ? "Сохранение…" : "Сохранить настройки"}
              </button>
              {hasUnsavedSettingsChanges ? (
                <span className={styles.unsavedHint}>Есть несохранённые изменения</span>
              ) : null}
            </div>
          </AdminPanel>

          {draftMode === "manual" ? (
            <AdminPanel title="Слайды">
              <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} onClick={openCreateSlide}>
                  + Добавить слайд
                </button>
              </div>

              {slides.length === 0 ? (
                <p className={ui.listItemMuted}>
                  Слайдов пока нет — добавьте первый, чтобы баннер появился на витрине.
                </p>
              ) : (
                <ul className={styles.slideList}>
                  {slides.map((slide, index) => (
                    <li key={slide.id} className={styles.slideRow}>
                      <div className={styles.slideThumb}>
                        {slide.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={slide.imageUrl} alt={slide.title || "Слайд"} />
                        ) : (
                          <span className={styles.slideThumbEmpty}>Нет фото</span>
                        )}
                      </div>
                      <div className={styles.slideInfo}>
                        <p className={styles.slideTitle}>{slide.title || "Без названия"}</p>
                        <p className={styles.slideSubtitle}>{slide.subtitle || "—"}</p>
                      </div>
                      <div className={styles.slideActions}>
                        <label
                          className={`${styles.switch} ${slide.isEnabled ? styles.switchOn : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={slide.isEnabled}
                            onChange={() => void toggleSlideEnabled(slide)}
                          />
                          <span />
                        </label>
                        <button
                          type="button"
                          className={styles.iconButton}
                          disabled={index === 0}
                          aria-label="Выше"
                          onClick={() => void moveSlide(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          disabled={index === slides.length - 1}
                          aria-label="Ниже"
                          onClick={() => void moveSlide(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => openEditSlide(slide)}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => void deleteSlide(slide.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          ) : null}
        </div>

        <AdminPanel title="Просмотр (iPhone)" className={styles.previewPanel}>
          <div className={styles.previewWrap}>
            {isPreviewLoading ? (
              <div className={styles.productionPreview}>
                <SmartPromoBanner slides={null} preview />
              </div>
            ) : displayedPreviewSlides.length === 0 ? (
              <div className={styles.phoneFrame}>
                <div className={styles.phoneEmpty}>
                  Нет активных слайдов — баннер будет скрыт на витрине.
                </div>
              </div>
            ) : (
              <div className={styles.productionPreview}>
                <SmartPromoBanner slides={displayedPreviewSlides} preview />
              </div>
            )}
            <p className={styles.previewLabel}>
              {displayedPreviewSlides.length > 0
                ? `Активно на витрине: ${displayedPreviewSlides.length} слайд(ов)`
                : "Баннер скрыт — включите или добавьте слайды"}
            </p>
          </div>
        </AdminPanel>
      </div>

      {slideModal ? (
        <div className={styles.dialogBackdrop} role="presentation" onClick={closeSlideModal}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{slideModal.id ? "Изменить слайд" : "Новый слайд"}</h3>

            <div className={styles.imageRow}>
              <div className={styles.imagePreview}>
                {slideModalFilePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slideModalFilePreviewUrl} alt="Слайд" />
                ) : slideModal.form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slideModal.form.imageUrl} alt="Слайд" />
                ) : (
                  <span className={styles.slideThumbEmpty}>Нет фото</span>
                )}
              </div>
              <div className={styles.imageActions}>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    selectSlideImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    selectSlideImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  {slideModal.form.imageUrl || slideModal.form.imageFile
                    ? "Заменить фото"
                    : "Выбрать из галереи"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Сделать фото
                </button>
                {slideModal.form.imageUrl || slideModal.form.imageFile ? (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={removeSlideImage}
                  >
                    Удалить фото
                  </button>
                ) : null}
              </div>
            </div>

            {slideModal.form.imageFile ? (
              <div className={styles.fileMeta}>
                <span>{slideModal.form.imageFile.name}</span>
                <span>{formatFileSize(slideModal.form.imageFile.size)}</span>
              </div>
            ) : slideModal.form.imageUrl ? (
              <div className={styles.fileMeta}>
                <span>{getImageFileName(slideModal.form.imageUrl)}</span>
                <span>Сохранённое фото</span>
              </div>
            ) : null}

            <p className={styles.uploadNote}>
              Фото будет загружено только после нажатия «Сохранить».
            </p>

            <div className={styles.field}>
              <span>Заголовок</span>
              <input
                value={slideModal.form.title}
                onChange={(event) =>
                  setSlideModal({
                    ...slideModal,
                    form: { ...slideModal.form, title: event.target.value },
                  })
                }
                placeholder="Скидка 20% на весенние букеты"
              />
            </div>

            <div className={styles.field}>
              <span>Подзаголовок</span>
              <input
                value={slideModal.form.subtitle}
                onChange={(event) =>
                  setSlideModal({
                    ...slideModal,
                    form: { ...slideModal.form, subtitle: event.target.value },
                  })
                }
                placeholder="До конца недели"
              />
            </div>

            <div className={styles.field}>
              <span>Текст кнопки</span>
              <input
                value={slideModal.form.buttonText}
                onChange={(event) =>
                  setSlideModal({
                    ...slideModal,
                    form: { ...slideModal.form, buttonText: event.target.value },
                  })
                }
                placeholder="Смотреть букеты"
              />
            </div>

            <div className={styles.destinationBlock}>
              <span className={styles.destinationLabel}>Куда ведёт кнопка</span>
              <div className={styles.destinationToggle} role="group" aria-label="Назначение кнопки">
                <button
                  type="button"
                  className={`${styles.destinationButton} ${
                    slideModal.form.destinationType === "url"
                      ? styles.destinationButtonActive
                      : ""
                  }`}
                  onClick={() =>
                    setSlideModal({
                      ...slideModal,
                      form: { ...slideModal.form, destinationType: "url" },
                    })
                  }
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`${styles.destinationButton} ${
                    slideModal.form.destinationType === "category"
                      ? styles.destinationButtonActive
                      : ""
                  }`}
                  onClick={() =>
                    setSlideModal({
                      ...slideModal,
                      form: {
                        ...slideModal.form,
                        destinationType: "category",
                        categoryId:
                          slideModal.form.categoryId || destinationCategories[0]?.id || "",
                      },
                    })
                  }
                >
                  Категория
                </button>
              </div>
            </div>

            {slideModal.form.destinationType === "category" ? (
              <label className={styles.field}>
                <span>Категория каталога</span>
                <select
                  value={slideModal.form.categoryId}
                  onChange={(event) =>
                    setSlideModal({
                      ...slideModal,
                      form: { ...slideModal.form, categoryId: event.target.value },
                    })
                  }
                >
                  {destinationCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className={styles.field}>
                <span>URL назначения</span>
                <input
                  value={slideModal.form.buttonLink}
                  onChange={(event) =>
                    setSlideModal({
                      ...slideModal,
                      form: { ...slideModal.form, buttonLink: event.target.value },
                    })
                  }
                  placeholder="/#catalog или https://…"
                />
              </label>
            )}

            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={slideModal.form.isEnabled}
                onChange={(event) =>
                  setSlideModal({
                    ...slideModal,
                    form: { ...slideModal.form, isEnabled: event.target.checked },
                  })
                }
              />
              <span>Слайд включён</span>
            </label>

            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={closeSlideModal}>
                Отмена
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={
                  savingSlide ||
                  !slideModal.form.title.trim() ||
                  !(
                    slideModal.form.imageFile ||
                    (!slideModal.form.removeImage && slideModal.form.imageUrl)
                  ) ||
                  (slideModal.form.destinationType === "category" &&
                    !slideModal.form.categoryId)
                }
                onClick={() => void saveSlide()}
              >
                {savingSlide ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
