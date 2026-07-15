// ==================================================
// SECTION: ADMIN APP — Smart banner module (hero management)
// РАЗДЕЛ: Умный баннер — управление главной страницей
// ==================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminModuleHeader, AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/smartBanner/AdminSmartBannerModule.module.css";

type HeroBannerSettings = {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  isEnabled: boolean;
  updatedAt: string;
};

const EMPTY_SETTINGS: HeroBannerSettings = {
  imageUrl: "",
  title: "",
  subtitle: "",
  buttonText: "",
  buttonLink: "",
  isEnabled: false,
  updatedAt: "",
};

export function AdminSmartBannerModule() {
  const [settings, setSettings] = useState<HeroBannerSettings>(EMPTY_SETTINGS);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/hero-banner", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((body: { settings?: HeroBannerSettings; message?: string }) => {
        if (!active) return;
        if (body.settings) {
          setSettings(body.settings);
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
    };
  }, []);

  const updateField = (patch: Partial<HeroBannerSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setNotice(null);
  };

  const save = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/hero-banner", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            title: settings.title,
            subtitle: settings.subtitle,
            buttonText: settings.buttonText,
            buttonLink: settings.buttonLink,
            isEnabled: settings.isEnabled,
          },
        }),
      });
      const body = (await response.json()) as { settings?: HeroBannerSettings; message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сохранить баннер.");
      }
      if (body.settings) {
        setSettings(body.settings);
      }
      setNotice({ tone: "success", text: "Баннер сохранён и обновлён на главной странице." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить баннер.",
      });
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/admin/hero-banner/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as { settings?: HeroBannerSettings; message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось загрузить изображение.");
      }
      if (body.settings) {
        setSettings(body.settings);
      }
      setNotice({ tone: "success", text: "Изображение обновлено." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось загрузить изображение.",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setUploading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/hero-banner/image", {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await response.json()) as { settings?: HeroBannerSettings; message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось удалить изображение.");
      }
      if (body.settings) {
        setSettings(body.settings);
      }
      setNotice({ tone: "success", text: "Изображение удалено." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось удалить изображение.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Умный баннер"
        subtitle="Управление изображением и текстом главной страницы"
      />

      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}
      {!ready ? <p className={ui.listItemMuted}>Загрузка…</p> : null}

      <div className={styles.layout}>
        <AdminPanel title="Настройки баннера">
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(event) => updateField({ isEnabled: event.target.checked })}
            />
            <span>Баннер включён на главной странице</span>
          </label>

          <div className={styles.imageRow}>
            <div className={styles.imagePreview}>
              {settings.imageUrl ? (
                // Admin-uploaded arbitrary image — next/image domain config not guaranteed, use plain img.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.imageUrl} alt="Баннер" />
              ) : (
                <span style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 12, color: "#75695c" }}>
                  Нет фото
                </span>
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
                  if (file) {
                    void uploadImage(file);
                  }
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {settings.imageUrl ? "Заменить" : "Загрузить"}
              </button>
              {settings.imageUrl ? (
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={uploading}
                  onClick={() => void removeImage()}
                >
                  Удалить
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <span>Заголовок</span>
            <input
              value={settings.title}
              onChange={(event) => updateField({ title: event.target.value })}
              placeholder="Премиальная доставка цветов"
            />
          </div>

          <div className={styles.field}>
            <span>Подзаголовок</span>
            <textarea
              value={settings.subtitle}
              onChange={(event) => updateField({ subtitle: event.target.value })}
              placeholder="для особых моментов"
            />
          </div>

          <div className={styles.field}>
            <span>Текст кнопки</span>
            <input
              value={settings.buttonText}
              onChange={(event) => updateField({ buttonText: event.target.value })}
              placeholder="Выбрать букет"
            />
          </div>

          <div className={styles.field}>
            <span>Ссылка кнопки (необязательно)</span>
            <input
              value={settings.buttonLink}
              onChange={(event) => updateField({ buttonLink: event.target.value })}
              placeholder="/#catalog или https://…"
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </AdminPanel>

        <AdminPanel title="Просмотр (iPhone)">
          <div className={styles.previewWrap}>
            <div
              className={styles.phoneFrame}
              style={{ opacity: settings.isEnabled ? 1 : 0.5 }}
            >
              <div
                className={styles.phoneBackground}
                style={
                  settings.imageUrl
                    ? { backgroundImage: `url(${settings.imageUrl})` }
                    : { background: "linear-gradient(180deg, #efe6da, #d9c9b3)" }
                }
              >
                <div className={styles.phoneContent}>
                  <p className={styles.phoneTitle}>{settings.title || "Bellaflore"}</p>
                  <p className={styles.phoneSubtitle}>
                    {settings.subtitle || "Премиальная доставка цветов"}
                  </p>
                  <span className={styles.phoneButton}>{settings.buttonText || "Выбрать букет"}</span>
                </div>
              </div>
            </div>
            <p className={styles.previewLabel}>
              {settings.isEnabled ? "Баннер активен на витрине" : "Баннер выключен — показан стандартный экран"}
            </p>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
