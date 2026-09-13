// ==================================================
// SECTION: ADMIN APP — Hero banner control
// РАЗДЕЛ: Управление Hero главной страницы
// ==================================================
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import styles from "@/components/adminApp/modules/smartBanner/AdminSmartBannerModule.module.css";

export type AdminHeroBannerPhoto = {
  id: string;
  imageUrl: string;
  isEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
};

export type AdminHeroBannerSettings = {
  imageUrl: string;
  photos: AdminHeroBannerPhoto[];
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
  updatedAt: string;
};

const EMPTY_HERO_SETTINGS: AdminHeroBannerSettings = {
  imageUrl: "",
  photos: [],
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",
  isEnabled: false,
  updatedAt: "",
};

type HeroBannerResponse = {
  settings?: AdminHeroBannerSettings | null;
  imageUrl?: string;
  message?: string;
};

function createPhotoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `hero-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createHeroPhoto(
  imageUrl: string,
  sortOrder: number,
  isPrimary: boolean,
): AdminHeroBannerPhoto {
  return {
    id: createPhotoId(),
    imageUrl,
    isEnabled: true,
    isPrimary,
    sortOrder,
  };
}

function normalizeHeroPhotos(
  photos: AdminHeroBannerPhoto[] | undefined,
  legacyImageUrl = "",
): AdminHeroBannerPhoto[] {
  const normalized = Array.isArray(photos)
    ? photos
        .filter((photo) => photo.imageUrl.trim())
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((photo, index) => ({
          id: photo.id || `hero-photo-${index}`,
          imageUrl: photo.imageUrl.trim(),
          isEnabled: photo.isEnabled,
          isPrimary: photo.isPrimary,
          sortOrder: index,
        }))
    : [];

  if (normalized.length === 0 && legacyImageUrl.trim()) {
    return [
      {
        id: "legacy-primary",
        imageUrl: legacyImageUrl.trim(),
        isEnabled: true,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
  }

  if (normalized.length === 0) {
    return [];
  }

  const primaryIndex = normalized.findIndex((photo) => photo.isPrimary);
  return normalized.map((photo, index) => ({
    ...photo,
    isPrimary: index === (primaryIndex >= 0 ? primaryIndex : 0),
  }));
}

function normalizeHeroDraft(settings: AdminHeroBannerSettings): AdminHeroBannerSettings {
  const photos = normalizeHeroPhotos(settings.photos, settings.imageUrl);
  const primaryPhoto =
    photos.find((photo) => photo.isPrimary) ??
    photos.find((photo) => photo.isEnabled) ??
    photos[0];

  return {
    ...settings,
    imageUrl: primaryPhoto?.imageUrl ?? settings.imageUrl.trim(),
    photos,
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    buttonText: settings.buttonText.trim(),
    buttonLink: settings.buttonLink.trim(),
  };
}

function serializeHeroSettings(settings: AdminHeroBannerSettings): string {
  const normalized = normalizeHeroDraft(settings);
  return JSON.stringify({
    imageUrl: normalized.imageUrl,
    photos: normalized.photos,
    title: normalized.title,
    subtitle: normalized.subtitle,
    buttonText: normalized.buttonText,
    buttonLink: normalized.buttonLink,
    isEnabled: normalized.isEnabled,
  });
}

function formatUpdatedAt(updatedAt: string): string {
  if (!updatedAt) {
    return "Не сохранено";
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return "Дата обновления недоступна";
  }
  return date.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

export function AdminHeroBannerPanel({
  initialSettings,
}: {
  initialSettings?: AdminHeroBannerSettings | null;
}) {
  const initialHeroSettings = initialSettings
    ? normalizeHeroDraft(initialSettings)
    : EMPTY_HERO_SETTINGS;
  const [settings, setSettings] = useState<AdminHeroBannerSettings>(initialHeroSettings);
  const [draft, setDraft] = useState<AdminHeroBannerSettings>(initialHeroSettings);
  const [ready, setReady] = useState(Boolean(initialSettings));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState(
    initialHeroSettings.photos.find((photo) => photo.isPrimary)?.id ??
      initialHeroSettings.photos[0]?.id ??
      "",
  );
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSettings) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    fetch("/api/admin/hero-banner", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as HeroBannerResponse;
        if (!response.ok) {
          throw new Error(body.message || "Не удалось загрузить Hero.");
        }
        return normalizeHeroDraft(body.settings ?? EMPTY_HERO_SETTINGS);
      })
      .then((loadedSettings) => {
        if (!active) {
          return;
        }
        setSettings(loadedSettings);
        setDraft(loadedSettings);
        setSelectedPhotoId(
          loadedSettings.photos.find((photo) => photo.isPrimary)?.id ??
            loadedSettings.photos[0]?.id ??
            "",
        );
      })
      .catch((error) => {
        if (active) {
          setNotice({
            tone: "error",
            text: error instanceof Error ? error.message : "Не удалось загрузить Hero.",
          });
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [initialSettings]);

  const normalizedDraft = normalizeHeroDraft(draft);
  const selectedPhoto = useMemo(
    () =>
      normalizedDraft.photos.find((photo) => photo.id === selectedPhotoId) ??
      normalizedDraft.photos.find((photo) => photo.isPrimary) ??
      normalizedDraft.photos[0],
    [normalizedDraft.photos, selectedPhotoId],
  );
  const activePhotoCount = normalizedDraft.photos.filter((photo) => photo.isEnabled).length;
  const hasUnsavedChanges = serializeHeroSettings(normalizedDraft) !== serializeHeroSettings(settings);

  const uploadHeroPhotos = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      const uploadedPhotos: AdminHeroBannerPhoto[] = [];
      for (const file of selectedFiles) {
        const imageForm = new FormData();
        imageForm.append("image", file);
        const imageResponse = await fetch("/api/admin/hero-banner/image", {
          method: "POST",
          credentials: "include",
          body: imageForm,
        });
        const imageBody = (await imageResponse.json()) as HeroBannerResponse;
        if (!imageResponse.ok || !imageBody.imageUrl) {
          throw new Error(imageBody.message || `Не удалось загрузить ${file.name}.`);
        }

        uploadedPhotos.push(
          createHeroPhoto(
            imageBody.imageUrl,
            normalizedDraft.photos.length + uploadedPhotos.length,
            normalizedDraft.photos.length === 0 && uploadedPhotos.length === 0,
          ),
        );
      }

      setDraft((current) =>
        normalizeHeroDraft({
          ...current,
          photos: [...normalizeHeroDraft(current).photos, ...uploadedPhotos],
        }),
      );
      setSelectedPhotoId(uploadedPhotos[0]?.id ?? selectedPhotoId);
      setNotice({
        tone: "success",
        text:
          selectedFiles.length === 1
            ? `${selectedFiles[0].name} загружен. Сохраните Hero, чтобы опубликовать изменение.`
            : `Загружено фото: ${selectedFiles.length}. Сохраните Hero, чтобы опубликовать изменения.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось загрузить фото Hero.",
      });
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const updatePhoto = (photoId: string, patch: Partial<AdminHeroBannerPhoto>) => {
    setDraft((current) =>
      normalizeHeroDraft({
        ...current,
        photos: normalizeHeroDraft(current).photos.map((photo) =>
          photo.id === photoId ? { ...photo, ...patch } : photo,
        ),
      }),
    );
  };

  const removePhoto = (photoId: string) => {
    setDraft((current) => {
      const nextPhotos = normalizeHeroDraft(current).photos.filter((photo) => photo.id !== photoId);
      const normalized = normalizeHeroDraft({ ...current, photos: nextPhotos, imageUrl: "" });
      setSelectedPhotoId(
        normalized.photos.find((photo) => photo.isPrimary)?.id ?? normalized.photos[0]?.id ?? "",
      );
      return normalized;
    });
  };

  const movePhoto = (photoId: string, direction: -1 | 1) => {
    setDraft((current) => {
      const photos = normalizeHeroDraft(current).photos;
      const index = photos.findIndex((photo) => photo.id === photoId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= photos.length) {
        return current;
      }

      const nextPhotos = [...photos];
      const [photo] = nextPhotos.splice(index, 1);
      nextPhotos.splice(targetIndex, 0, photo);
      return normalizeHeroDraft({
        ...current,
        photos: nextPhotos.map((nextPhoto, nextIndex) => ({
          ...nextPhoto,
          sortOrder: nextIndex,
        })),
      });
    });
  };

  const markPrimary = (photoId: string) => {
    setDraft((current) =>
      normalizeHeroDraft({
        ...current,
        photos: normalizeHeroDraft(current).photos.map((photo) => ({
          ...photo,
          isPrimary: photo.id === photoId,
        })),
      }),
    );
    setSelectedPhotoId(photoId);
  };

  const saveHero = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const nextDraft = normalizeHeroDraft(draft);
      const response = await fetch("/api/admin/hero-banner", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            imageUrl: nextDraft.imageUrl,
            photos: nextDraft.photos,
            title: nextDraft.title,
            subtitle: nextDraft.subtitle,
            buttonText: nextDraft.buttonText,
            buttonLink: nextDraft.buttonLink,
            isEnabled: nextDraft.isEnabled,
          },
        }),
      });
      const body = (await response.json()) as HeroBannerResponse;
      if (!response.ok || !body.settings) {
        throw new Error(body.message || "Не удалось сохранить Hero.");
      }

      const savedSettings = normalizeHeroDraft(body.settings);
      setSettings(savedSettings);
      setDraft(savedSettings);
      setSelectedPhotoId(
        savedSettings.photos.find((photo) => photo.isPrimary)?.id ??
          savedSettings.photos[0]?.id ??
          "",
      );
      setNotice({ tone: "success", text: "Hero сохранён и подключён к витрине." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить Hero.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel title="Hero главной страницы">
      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

      {!ready ? (
        <p className={styles.futureNote}>Загрузка Hero…</p>
      ) : (
        <>
          <div className={styles.heroControlGrid}>
            <div className={styles.heroFields}>
              <div className={styles.statusControl}>
                <div className={styles.statusCopy}>
                  <strong>Публичный показ Hero</strong>
                  <span>
                    {draft.isEnabled
                      ? `Hero использует ${activePhotoCount} активн. фото и этот текст.`
                      : "Hero использует резервное содержимое витрины."}
                  </span>
                </div>
                <div
                  className={styles.statusToggle}
                  role="radiogroup"
                  aria-label="Публичный показ Hero"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.isEnabled}
                    className={`${styles.statusButton} ${
                      draft.isEnabled ? styles.statusButtonActive : ""
                    }`}
                    onClick={() => setDraft((current) => ({ ...current, isEnabled: true }))}
                  >
                    ENABLED
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!draft.isEnabled}
                    className={`${styles.statusButton} ${
                      !draft.isEnabled ? styles.statusButtonDisabled : ""
                    }`}
                    onClick={() => setDraft((current) => ({ ...current, isEnabled: false }))}
                  >
                    DISABLED
                  </button>
                </div>
              </div>

              <label className={styles.field}>
                <span>Заголовок</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Цветы, которые запоминаются"
                />
              </label>

              <label className={styles.field}>
                <span>Подзаголовок</span>
                <textarea
                  value={draft.subtitle}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, subtitle: event.target.value }))
                  }
                  placeholder="Свежие цветы • Доставка за 90 минут"
                />
              </label>

              <label className={styles.field}>
                <span>Текст кнопки</span>
                <input
                  value={draft.buttonText}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, buttonText: event.target.value }))
                  }
                  placeholder="Перейти в каталог"
                />
              </label>

              <label className={styles.field}>
                <span>Ссылка кнопки</span>
                <input
                  value={draft.buttonLink}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, buttonLink: event.target.value }))
                  }
                  placeholder="/catalog"
                />
              </label>

              <div className={styles.heroPhotoManager}>
                <div className={styles.heroPhotoToolbar}>
                  <div>
                    <strong>Фотографии Hero</strong>
                    <span>
                      {normalizedDraft.photos.length} всего · {activePhotoCount} активны
                    </span>
                  </div>
                  <label className={styles.uploadButton}>
                    {uploading ? "Загрузка…" : "Загрузить фото"}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading}
                      onChange={(event) => void uploadHeroPhotos(event.target.files)}
                    />
                  </label>
                </div>

                {normalizedDraft.photos.length === 0 ? (
                  <p className={styles.heroPhotoEmpty}>Добавьте одно или несколько фото для Hero.</p>
                ) : (
                  <ul className={styles.heroPhotoList}>
                    {normalizedDraft.photos.map((photo, index) => (
                      <li
                        key={photo.id}
                        className={`${styles.heroPhotoRow} ${
                          selectedPhoto?.id === photo.id ? styles.heroPhotoRowSelected : ""
                        }`}
                      >
                        <button
                          type="button"
                          className={styles.heroPhotoThumb}
                          onClick={() => setSelectedPhotoId(photo.id)}
                          aria-label={`Предпросмотр фото ${index + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.imageUrl} alt="" />
                        </button>
                        <div className={styles.heroPhotoInfo}>
                          <strong>{photo.isPrimary ? "Основное фото" : `Фото ${index + 1}`}</strong>
                          <span>{getImageFileName(photo.imageUrl)}</span>
                        </div>
                        <div className={styles.heroPhotoActions}>
                          <label
                            className={`${styles.switch} ${photo.isEnabled ? styles.switchOn : ""}`}
                            aria-label={photo.isEnabled ? "Отключить фото" : "Включить фото"}
                          >
                            <input
                              type="checkbox"
                              checked={photo.isEnabled}
                              onChange={(event) =>
                                updatePhoto(photo.id, { isEnabled: event.target.checked })
                              }
                            />
                            <span />
                          </label>
                          <button
                            type="button"
                            className={styles.iconButton}
                            disabled={index === 0}
                            onClick={() => movePhoto(photo.id, -1)}
                            aria-label="Переместить выше"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={styles.iconButton}
                            disabled={index === normalizedDraft.photos.length - 1}
                            onClick={() => movePhoto(photo.id, 1)}
                            aria-label="Переместить ниже"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={photo.isPrimary}
                            onClick={() => markPrimary(photo.id)}
                          >
                            По умолчанию
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => removePhoto(photo.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={styles.heroPreviewCard}>
              <div className={styles.heroPreview}>
                {selectedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPhoto.imageUrl} alt="Предпросмотр Hero" />
                ) : (
                  <span className={styles.heroPreviewEmpty}>Нет изображения</span>
                )}
              </div>

              {selectedPhoto ? (
                <p className={styles.fileMeta}>
                  <span>{getImageFileName(selectedPhoto.imageUrl)}</span>
                  <span>{selectedPhoto.isEnabled ? "В ротации" : "Отключено"}</span>
                </p>
              ) : null}
              <p className={styles.heroUpdatedAt}>
                Обновлено: {formatUpdatedAt(settings.updatedAt)}
              </p>
            </div>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={saving || uploading || !hasUnsavedChanges}
              onClick={() => void saveHero()}
            >
              {saving ? "Сохранение…" : "Сохранить Hero"}
            </button>
            {hasUnsavedChanges ? (
              <span className={styles.unsavedHint}>Есть несохранённые изменения</span>
            ) : null}
            {uploading ? <span className={styles.unsavedHint}>Фото загружаются</span> : null}
          </div>
        </>
      )}
    </AdminPanel>
  );
}
