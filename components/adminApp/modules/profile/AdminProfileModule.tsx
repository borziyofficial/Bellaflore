// ==================================================
// SECTION: ADMIN APP — Profile module
// РАЗДЕЛ: Профиль администратора и настройки магазина
// ==================================================
"use client";

import { useEffect, useState } from "react";
import {
  AdminModuleHeader,
  AdminPanel,
} from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/profile/AdminProfileModule.module.css";

type ProfileData = {
  displayName: string;
  email: string;
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeTelegram: string;
  storeWhatsapp: string;
  storeAddress: string;
  hasCustomPassword: boolean;
};

const EMPTY_PROFILE: ProfileData = {
  displayName: "",
  email: "",
  storeName: "",
  storePhone: "",
  storeEmail: "",
  storeTelegram: "",
  storeWhatsapp: "",
  storeAddress: "",
  hasCustomPassword: false,
};

export function AdminProfileModule() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [envUsername, setEnvUsername] = useState("");
  const [ready, setReady] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [accountNotice, setAccountNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [storeNotice, setStoreNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/profile", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((body: { profile?: ProfileData; envUsername?: string }) => {
        if (!active) return;
        if (body.profile) setProfile(body.profile);
        if (body.envUsername) setEnvUsername(body.envUsername);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (patch: Partial<ProfileData>) => {
    setProfile((current) => ({ ...current, ...patch }));
  };

  const saveProfileFields = async (
    fields: Array<keyof ProfileData>,
    setSaving: (value: boolean) => void,
    setNotice: (value: { tone: "success" | "error"; text: string } | null) => void,
    successText: string,
  ) => {
    setSaving(true);
    setNotice(null);
    try {
      const payload: Record<string, string> = {};
      for (const field of fields) {
        payload[field] = String(profile[field] ?? "");
      }
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: payload }),
      });
      const body = (await response.json()) as { profile?: ProfileData; message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сохранить.");
      }
      if (body.profile) setProfile(body.profile);
      setNotice({ tone: "success", text: successText });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить.",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitPasswordChange = async () => {
    setPasswordNotice(null);
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ tone: "error", text: "Пароли не совпадают." });
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch("/api/admin/profile/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Не удалось сменить пароль.");
      }
      setPasswordNotice({ tone: "success", text: "Пароль обновлён." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfile((current) => ({ ...current, hasCustomPassword: true }));
    } catch (error) {
      setPasswordNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сменить пароль.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className={ui.stack}>
      <AdminModuleHeader
        title="Профиль"
        subtitle="Аккаунт администратора и настройки магазина"
      />

      {!ready ? <p className={ui.listItemMuted}>Загрузка…</p> : null}

      <AdminPanel title="Аккаунт администратора">
        {accountNotice ? <p className={styles[accountNotice.tone]}>{accountNotice.text}</p> : null}

        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Имя</span>
            <input
              value={profile.displayName}
              onChange={(event) => updateField({ displayName: event.target.value })}
              placeholder={envUsername || "Администратор"}
            />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              value={profile.email}
              onChange={(event) => updateField({ email: event.target.value })}
              placeholder={envUsername ? `${envUsername}@bellaflore.ru` : "admin@bellaflore.ru"}
            />
          </label>
        </div>

        <div className={styles.field}>
          <span>Роль</span>
          <div className={styles.readOnlyValue}>Владелец (owner)</div>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={savingAccount}
          onClick={() =>
            void saveProfileFields(
              ["displayName", "email"],
              setSavingAccount,
              setAccountNotice,
              "Данные аккаунта сохранены.",
            )
          }
        >
          {savingAccount ? "Сохранение…" : "Сохранить"}
        </button>
      </AdminPanel>

      <AdminPanel title="Смена пароля">
        {passwordNotice ? <p className={styles[passwordNotice.tone]}>{passwordNotice.text}</p> : null}
        <label className={styles.field}>
          <span>Текущий пароль</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Новый пароль</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className={styles.field}>
            <span>Повторите пароль</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>
        <p className={styles.hint}>Минимум 8 символов. Действует сразу после сохранения.</p>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={changingPassword || !currentPassword || !newPassword}
          onClick={() => void submitPasswordChange()}
        >
          {changingPassword ? "Сохранение…" : "Сменить пароль"}
        </button>
      </AdminPanel>

      <AdminPanel title="Уведомления в Telegram">
        <div className={ui.emptyZone}>
          Подключение Telegram-уведомлений запланировано на следующий этап и пока не влияет
          на остальные настройки профиля.
        </div>
      </AdminPanel>

      <AdminPanel title="Настройки магазина">
        {storeNotice ? <p className={styles[storeNotice.tone]}>{storeNotice.text}</p> : null}
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Название магазина</span>
            <input
              value={profile.storeName}
              onChange={(event) => updateField({ storeName: event.target.value })}
              placeholder="Bellaflore"
            />
          </label>
          <label className={styles.field}>
            <span>Телефон</span>
            <input
              value={profile.storePhone}
              onChange={(event) => updateField({ storePhone: event.target.value })}
              placeholder="+7 (___) ___-__-__"
            />
          </label>
          <label className={styles.field}>
            <span>Email магазина</span>
            <input
              value={profile.storeEmail}
              onChange={(event) => updateField({ storeEmail: event.target.value })}
              placeholder="info@bellaflore.ru"
            />
          </label>
          <label className={styles.field}>
            <span>Telegram</span>
            <input
              value={profile.storeTelegram}
              onChange={(event) => updateField({ storeTelegram: event.target.value })}
              placeholder="@bellaflore"
            />
          </label>
          <label className={styles.field}>
            <span>WhatsApp</span>
            <input
              value={profile.storeWhatsapp}
              onChange={(event) => updateField({ storeWhatsapp: event.target.value })}
              placeholder="+7 (___) ___-__-__"
            />
          </label>
          <label className={styles.field}>
            <span>Адрес</span>
            <input
              value={profile.storeAddress}
              onChange={(event) => updateField({ storeAddress: event.target.value })}
              placeholder="Москва, ..."
            />
          </label>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={savingStore}
          onClick={() =>
            void saveProfileFields(
              [
                "storeName",
                "storePhone",
                "storeEmail",
                "storeTelegram",
                "storeWhatsapp",
                "storeAddress",
              ],
              setSavingStore,
              setStoreNotice,
              "Настройки магазина сохранены.",
            )
          }
        >
          {savingStore ? "Сохранение…" : "Сохранить"}
        </button>
      </AdminPanel>

      <AdminPanel title="Выход">
        <p className={ui.listItemMuted}>
          Кнопка «Выйти» доступна в верхней панели приложения.
        </p>
      </AdminPanel>
    </div>
  );
}
