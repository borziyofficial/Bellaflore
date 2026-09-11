// ==================================================
// SECTION: ADMIN APP — Hero banner control
// РАЗДЕЛ: Управление Hero главной страницы
// ==================================================
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import styles from "@/components/adminApp/modules/smartBanner/AdminSmartBannerModule.module.css";

export type AdminHeroBannerSettings = {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
  updatedAt: string;
};

const EMPTY_HERO_SETTINGS: AdminHeroBannerSettings = {
  imageUrl: "",
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

function normalizeHeroDraft(settings: AdminHeroBannerSettings): AdminHeroBannerSettings {
  return {
    ...settings,
    imageUrl: settings.imageUrl.trim(),
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    buttonText: settings.buttonText.trim(),
    buttonLink: settings.buttonLink.trim(),
  };
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

export function AdminHeroBannerPanel({
  initialSettings,
}: {
  initialSettings?: AdminHeroBannerSettings | null;
}) {
  const [settings, setSettings] = useState<AdminHeroBannerSettings>(
    initialSettings ?? EMPTY_HERO_SETTINGS,
  );
  const [draft, setDraft] = useState<AdminHeroBannerSettings>(
    initialSettings ?? EMPTY_HERO_SETTINGS,
  );
  const [ready, setReady] = useState(Boolean(initialSettings));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

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
        return body.settings ?? EMPTY_HERO_SETTINGS;
      })
      .then((loadedSettings) => {
        if (!active) {
          return;
        }
        setSettings(loadedSettings);
        setDraft(loadedSettings);
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
  const hasUnsavedChanges =
    Boolean(imageFile) ||
    normalizedDraft.imageUrl !== settings.imageUrl ||
    normalizedDraft.title !== settings.title ||
    normalizedDraft.subtitle !== settings.subtitle ||
    normalizedDraft.buttonText !== settings.buttonText ||
    normalizedDraft.buttonLink !== settings.buttonLink ||
    normalizedDraft.isEnabled !== settings.isEnabled;
  const previewUrl = filePreviewUrl ?? normalizedDraft.imageUrl;

  const saveHero = async () => {
    setSaving(true);
    setNotice(null);
    try {
      let nextImageUrl = normalizedDraft.imageUrl;
      if (imageFile) {
        const imageForm = new FormData();
        imageForm.append("image", imageFile);
        const imageResponse = await fetch("/api/admin/hero-banner/image", {
          method: "POST",
          credentials: "include",
          body: imageForm,
        });
        const imageBody = (await imageResponse.json()) as HeroBannerResponse;
        if (!imageResponse.ok || !imageBody.imageUrl) {
          throw new Error(imageBody.message || "Не удалось загрузить изображение Hero.");
        }
        nextImageUrl = imageBody.imageUrl;
      }

      const response = await fetch("/api/admin/hero-banner", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            imageUrl: nextImageUrl,
            title: normalizedDraft.title,
            subtitle: normalizedDraft.subtitle,
            buttonText: normalizedDraft.buttonText,
            buttonLink: normalizedDraft.buttonLink,
            isEnabled: normalizedDraft.isEnabled,
          },
        }),
      });
      const body = (await response.json()) as HeroBannerResponse;
      if (!response.ok || !body.settings) {
        throw new Error(body.message || "Не удалось сохранить Hero.");
      }

      setSettings(body.settings);
      setDraft(body.settings);
      setImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
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
                      ? "Hero берёт изображение и текст из этой настройки."
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
            </div>

            <div className={styles.heroPreviewCard}>
              <div className={styles.heroPreview}>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Предпросмотр Hero" />
                ) : (
                  <span className={styles.heroPreviewEmpty}>Нет изображения</span>
                )}
              </div>

              <input
                ref={imageInputRef}
                className={styles.heroFileInput}
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
              {imageFile ? (
                <p className={styles.fileMeta}>
                  <span>{imageFile.name}</span>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setImageFile(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                    }}
                  >
                    Убрать
                  </button>
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
              disabled={saving || !hasUnsavedChanges}
              onClick={() => void saveHero()}
            >
              {saving ? "Сохранение…" : "Сохранить Hero"}
            </button>
            {hasUnsavedChanges ? (
              <span className={styles.unsavedHint}>Есть несохранённые изменения</span>
            ) : null}
          </div>
        </>
      )}
    </AdminPanel>
  );
}
