"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import type {
  VisualStory,
  VisualStoriesSettings,
  VisualStoryDestinationType,
} from "@/lib/visualStoriesTypes";
import styles from "@/components/adminApp/modules/smartBanner/AdminVisualStoriesPanel.module.css";

const DESTINATION_OPTIONS: Array<{
  id: VisualStoryDestinationType;
  label: string;
}> = [
  { id: "product", label: "Товар" },
  { id: "category", label: "Категория" },
  { id: "catalog", label: "Весь каталог" },
  { id: "url", label: "URL" },
];

function destinationPlaceholder(type: VisualStoryDestinationType): string {
  if (type === "product") return "Например: pink-elegance";
  if (type === "category") return "Например: roses";
  if (type === "url") return "Например: /catalog или https://…";
  return "Не требуется";
}

export function AdminVisualStoriesPanel() {
  const [settings, setSettings] = useState<VisualStoriesSettings | null>(null);
  const [stories, setStories] = useState<VisualStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetch("/api/admin/visual-stories", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          settings?: VisualStoriesSettings;
          message?: string;
        };
        if (!response.ok || !body.settings) {
          throw new Error(body.message || "Не удалось загрузить фото-витрину.");
        }
        return body.settings;
      })
      .then((nextSettings) => {
        if (!active) return;
        setSettings(nextSettings);
        setStories(
            [...nextSettings.stories]
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .slice(0, 6),
        );
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setNotice({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "Не удалось загрузить фото-витрину.",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return JSON.stringify(settings.stories) !== JSON.stringify(stories);
  }, [settings, stories]);

  const patchStory = (id: string, patch: Partial<VisualStory>) => {
    setStories((current) =>
      current.map((story) => (story.id === id ? { ...story, ...patch } : story)),
    );
  };

  const moveStory = (id: string, direction: -1 | 1) => {
    setStories((current) => {
      const ordered = [...current].sort(
        (left, right) => left.sortOrder - right.sortOrder,
      );
      const index = ordered.findIndex((story) => story.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((story, sortOrder) => ({ ...story, sortOrder }));
    });
  };

  const uploadImage = async (story: VisualStory, file: File | undefined) => {
    if (!file) return;

    setUploadingId(story.id);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.set("image", file);

      const response = await fetch("/api/admin/visual-stories/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as {
        imageUrl?: string;
        message?: string;
      };

      if (!response.ok || !body.imageUrl) {
        throw new Error(body.message || "Не удалось загрузить фото.");
      }

      patchStory(story.id, { imageUrl: body.imageUrl });
      setNotice({
        tone: "success",
        text: "Фото загружено. Нажмите «Сохранить витрину».",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Не удалось загрузить фото.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);

    try {
      const normalized = [...stories]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((story, sortOrder) => ({ ...story, sortOrder }));

      const response = await fetch("/api/admin/visual-stories", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stories: normalized }),
      });
      const body = (await response.json()) as {
        settings?: VisualStoriesSettings;
        message?: string;
      };

      if (!response.ok || !body.settings) {
        throw new Error(body.message || "Не удалось сохранить витрину.");
      }

      setSettings(body.settings);
      setStories(body.settings.stories);
      setNotice({
        tone: "success",
        text: "Фото-витрина сохранена и доступна на главной странице.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить фото-витрину.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel title="Фото на главной">
      <div className={styles.headerCopy}>
        <strong>Витрина из 5–6 фотографий</strong>
        <span>
          Заменяйте большие фото на свои 4K изображения, меняйте подписи,
          порядок, видимость и переход по нажатию. Шестую позицию можно включить
          при необходимости.
        </span>
      </div>

      {notice ? (
        <p
          className={
            notice.tone === "success" ? styles.success : styles.error
          }
        >
          {notice.text}
        </p>
      ) : null}

      {loading ? (
        <div className={styles.loading}>Загрузка витрины…</div>
      ) : (
        <div className={styles.list}>
          {stories.map((story, index) => (
            <article className={styles.storyEditor} key={story.id}>
              <div className={styles.storyTop}>
                <div className={styles.preview}>
                  {story.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.imageUrl} alt="" />
                  ) : (
                    <span>Нет фото</span>
                  )}
                </div>

                <div className={styles.storyMeta}>
                  <strong>Фото {index + 1}</strong>
                  <span>{story.imageUrl ? "Фото подключено" : "Нужно фото"}</span>
                  <label className={styles.uploadButton}>
                    {uploadingId === story.id ? "Загрузка…" : "Заменить фото"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      disabled={uploadingId !== null}
                      onChange={(event) => {
                        void uploadImage(story, event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <small>До 15 МБ. Можно загружать 4K JPEG/WebP/PNG.</small>
                </div>

                <div className={styles.orderButtons}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStory(story.id, -1)}
                    aria-label="Поднять фото"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === stories.length - 1}
                    onClick={() => moveStory(story.id, 1)}
                    aria-label="Опустить фото"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <div className={styles.fields}>
                <label>
                  <span>Маленькая подпись</span>
                  <input
                    value={story.eyebrow}
                    onChange={(event) =>
                      patchStory(story.id, { eyebrow: event.target.value })
                    }
                    placeholder="Авторские"
                  />
                </label>

                <label>
                  <span>Название</span>
                  <input
                    value={story.title}
                    onChange={(event) =>
                      patchStory(story.id, { title: event.target.value })
                    }
                    placeholder="Маттиола"
                  />
                </label>

                <label>
                  <span>Куда ведёт фото</span>
                  <select
                    value={story.destinationType}
                    onChange={(event) =>
                      patchStory(story.id, {
                        destinationType: event.target
                          .value as VisualStoryDestinationType,
                        destinationValue:
                          event.target.value === "catalog"
                            ? ""
                            : story.destinationValue,
                      })
                    }
                  >
                    {DESTINATION_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {story.destinationType !== "catalog" ? (
                  <label>
                    <span>Товар / категория / URL</span>
                    <input
                      value={story.destinationValue}
                      onChange={(event) =>
                        patchStory(story.id, {
                          destinationValue: event.target.value,
                        })
                      }
                      placeholder={destinationPlaceholder(story.destinationType)}
                    />
                  </label>
                ) : null}
              </div>

              <label className={styles.enabledRow}>
                <input
                  type="checkbox"
                  checked={story.isEnabled}
                  onChange={(event) =>
                    patchStory(story.id, { isEnabled: event.target.checked })
                  }
                />
                <span>Показывать это фото на главной</span>
              </label>
            </article>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.saveButton}
          disabled={loading || saving || uploadingId !== null || !hasChanges}
          onClick={() => void save()}
        >
          {saving ? "Сохранение…" : "Сохранить фото"}
        </button>
      </div>
    </AdminPanel>
  );
}
