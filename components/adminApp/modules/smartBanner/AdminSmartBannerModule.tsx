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

type PromoBannerMode = "manual" | "auto";
type PromoBannerAutoSource = "featured" | "popular" | "new" | "bestsellers" | "admin_selected";

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
  isEnabled: boolean;
  imageUrl: string;
  imageFile: File | null;
};

const EMPTY_SLIDE_FORM: SlideFormState = {
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",
  isEnabled: true,
  imageUrl: "",
  imageFile: null,
};

function formatPriceLabel(priceRub: number): string {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

export function AdminSmartBannerModule() {
  const [settings, setSettings] = useState<PromoBannerSettings>(EMPTY_SETTINGS);
  // Draft settings mirror the form the admin is editing. They start equal to
  // the saved settings and only diverge until "Сохранить настройки" is
  // pressed — this is what lets the preview panel react instantly to a
  // mode/source change without persisting anything yet.
  const [draftMode, setDraftMode] = useState<PromoBannerMode>("manual");
  const [draftSource, setDraftSource] = useState<PromoBannerAutoSource>("featured");
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>([]);
  const [draftLimit, setDraftLimit] = useState(8);

  const [slides, setSlides] = useState<PromoBannerSlide[]>([]);
  const [products, setProducts] = useState<CatalogProductRecord[]>(getCachedProducts());
  const [ready, setReady] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [previewSlides, setPreviewSlides] = useState<ResolvedPromoSlide[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [productQuery, setProductQuery] = useState("");
  const [slideModal, setSlideModal] = useState<{ id: string | null; form: SlideFormState } | null>(
    null,
  );
  const [savingSlide, setSavingSlide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    Promise.all([
      fetch("/api/admin/promo-banner/settings", { credentials: "include", cache: "no-store" }).then(
        (response) => response.json(),
      ),
      fetch("/api/admin/promo-banner/slides", { credentials: "include", cache: "no-store" }).then(
        (response) => response.json(),
      ),
    ])
      .then(([settingsBody, slidesBody]: [
        { settings?: PromoBannerSettings },
        { slides?: PromoBannerSlide[] },
      ]) => {
        if (!active) return;
        if (settingsBody.settings) {
          setSettings(settingsBody.settings);
          setDraftMode(settingsBody.settings.mode);
          setDraftSource(settingsBody.settings.autoSource);
          setDraftSelectedIds(settingsBody.settings.autoSelectedProductIds);
          setDraftLimit(settingsBody.settings.autoSlideLimit);
        }
        if (slidesBody.slides) {
          setSlides(slidesBody.slides);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({ tone: "error", text: "Не удалось загрузить баннер." });
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      window.removeEventListener(ADMIN_CATALOG_CACHE_EVENT, onCacheChange);
    };
  }, []);

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
        .then((response) => response.json())
        .then((body: { slides?: ResolvedPromoSlide[] }) => {
          if (active) setPreviewSlides(body.slides ?? []);
        })
        .catch(() => {
          if (active) setPreviewSlides([]);
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
  // Clamp defensively at render time instead of resetting via an effect —
  // avoids a derived-state effect entirely.
  const safePreviewIndex =
    displayedPreviewSlides.length === 0
      ? 0
      : Math.min(previewIndex, displayedPreviewSlides.length - 1);

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
    setSlideModal({
      id: slide.id,
      form: {
        title: slide.title,
        subtitle: slide.subtitle,
        buttonText: slide.buttonText,
        buttonLink: slide.buttonLink,
        isEnabled: slide.isEnabled,
        imageUrl: slide.imageUrl,
        imageFile: null,
      },
    });
  };

  const closeSlideModal = () => setSlideModal(null);

  const saveSlide = async () => {
    if (!slideModal) return;
    setSavingSlide(true);
    setNotice(null);
    try {
      const { id, form } = slideModal;
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
              buttonLink: form.buttonLink,
              isEnabled: form.isEnabled,
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
        createForm.append("buttonLink", form.buttonLink);
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

  const toggleProductSelected = (id: string) => {
    setDraftSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  if (!ready) {
    return (
      <div className={ui.stack}>
        <AdminModuleHeader title="Умный баннер" subtitle="Промо-слайды между Hero и каталогом" />
        <p className={ui.listItemMuted}>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className={ui.stack}>
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
            {displayedPreviewSlides.length === 0 ? (
              <div className={styles.phoneFrame}>
                <div className={styles.phoneEmpty}>
                  Нет активных слайдов — баннер будет скрыт на витрине.
                </div>
              </div>
            ) : (
              <>
                <div className={styles.phoneFrame}>
                  <div
                    className={styles.phoneBackground}
                    style={
                      displayedPreviewSlides[safePreviewIndex]?.imageUrl
                        ? {
                            backgroundImage: `url(${displayedPreviewSlides[safePreviewIndex].imageUrl})`,
                          }
                        : { background: "linear-gradient(180deg, #efe6da, #d9c9b3)" }
                    }
                  >
                    <div className={styles.phoneContent}>
                      <p className={styles.phoneTitle}>
                        {displayedPreviewSlides[safePreviewIndex]?.title || "—"}
                      </p>
                      <p className={styles.phoneSubtitle}>
                        {displayedPreviewSlides[safePreviewIndex]?.subtitle || ""}
                      </p>
                      {displayedPreviewSlides[safePreviewIndex]?.buttonText ? (
                        <span className={styles.phoneButton}>
                          {displayedPreviewSlides[safePreviewIndex].buttonText}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {displayedPreviewSlides.length > 1 ? (
                  <div className={styles.previewDots}>
                    {displayedPreviewSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Слайд ${index + 1}`}
                        className={`${styles.previewDot} ${
                          index === safePreviewIndex ? styles.previewDotActive : ""
                        }`}
                        onClick={() => setPreviewIndex(index)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && slideModal) {
                      setSlideModal({
                        ...slideModal,
                        form: { ...slideModal.form, imageFile: file },
                      });
                    }
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {slideModal.form.imageUrl || slideModal.form.imageFile ? "Заменить фото" : "Загрузить фото"}
                </button>
              </div>
            </div>

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

            <div className={styles.field}>
              <span>Ссылка кнопки</span>
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
            </div>

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
                disabled={savingSlide || !slideModal.form.title.trim()}
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
