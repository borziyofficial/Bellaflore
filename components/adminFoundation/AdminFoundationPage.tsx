// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Фундамент админ-панели
// ==================================================
"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import styles from "@/components/adminFoundation/AdminFoundationPage.module.css";
import { AdminPhotoManager } from "@/components/adminFoundation/AdminPhotoManager";
import { AdminProductManager } from "@/components/adminFoundation/AdminProductManager";

type AdminFoundationPageProps = {
  adminUsername: string;
};

type FoundationSectionId = "products" | "photos" | "orders" | "settings";

type FoundationSection = {
  id: FoundationSectionId;
  title: string;
  description: string;
};

const UNLOCK_STORAGE_KEY = "bellaflore.admin.foundation.unlocked";
const UNLOCK_STATE_EVENT = "bellaflore-admin-unlock-change";

const FOUNDATION_SECTIONS: FoundationSection[] = [
  {
    id: "products",
    title: "Товары",
    description: "Заглушка для управления каталогом и карточками товаров.",
  },
  {
    id: "photos",
    title: "Фото",
    description: "Заглушка для будущей фотогалереи и медиа-ресурсов.",
  },
  {
    id: "orders",
    title: "Заказы",
    description: "Заглушка для рабочего стола заказов и статусов.",
  },
  {
    id: "settings",
    title: "Настройки",
    description: "Заглушка для локальных настроек и параметров admin.",
  },
];

function getStoredUnlockState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === "unlocked";
  } catch {
    return false;
  }
}

function subscribeToUnlockState(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === UNLOCK_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleUnlockEvent = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(UNLOCK_STATE_EVENT, handleUnlockEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(UNLOCK_STATE_EVENT, handleUnlockEvent);
  };
}

export function AdminFoundationPage({
  adminUsername,
}: AdminFoundationPageProps) {
  const isUnlocked = useSyncExternalStore(
    subscribeToUnlockState,
    getStoredUnlockState,
    () => false,
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<FoundationSectionId>(
    "products",
  );

  const activeSectionInfo = useMemo(
    () => FOUNDATION_SECTIONS.find((section) => section.id === activeSection) ?? FOUNDATION_SECTIONS[0],
    [activeSection],
  );

  const renderSectionContent = () => {
    if (activeSection === "products") {
      return <AdminProductManager />;
    }

    if (activeSection === "photos") {
      return <AdminPhotoManager />;
    }

    return (
      <section className={styles.placeholderPanel} aria-label={activeSectionInfo.title}>
        <p className={styles.placeholderEyebrow}>Раздел в работе</p>
        <h2 className={styles.placeholderTitle}>{activeSectionInfo.title}</h2>
        <p className={styles.placeholderDescription}>{activeSectionInfo.description}</p>
        <p className={styles.placeholderStatus}>
          Пока здесь только локальный каркас. Customer UI и данные не затрагиваются.
        </p>
      </section>
    );
  };

  const unlockAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminUsername,
          password,
        }),
      });

      if (!response.ok) {
        setError("Неверный пароль.");
        return;
      }

      try {
        window.localStorage.setItem(UNLOCK_STORAGE_KEY, "unlocked");
      } catch {
        // Local storage is optional for the dev foundation.
      }

      window.dispatchEvent(new Event(UNLOCK_STATE_EVENT));
    } catch {
      setError("Не удалось проверить пароль.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    window.dispatchEvent(new Event(UNLOCK_STATE_EVENT));
    setPassword("");
    setError(null);
  };

  if (!isUnlocked) {
    return (
      <main className={styles.page}>
        <section className={styles.authShell} aria-label="Вход в BellaFlore Admin">
          <div className={styles.authHero}>
            <p className={styles.eyebrow}>BellaFlore Admin</p>
            <h1 className={styles.title}>BellaFlore Admin</h1>
            <p className={styles.lead}>
              Локальный доступ к админ-фундаменту. Пока это только пароль и
              заглушки разделов.
            </p>
          </div>

          <form className={styles.authForm} onSubmit={unlockAdmin}>
            <label className={styles.field}>
              <span className={styles.label}>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
                className={styles.input}
                required
              />
            </label>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : (
              <p className={styles.hint}>
                Локальный пароль берётся из `ADMIN_PASSWORD`.
              </p>
            )}

            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Проверяем..." : "Войти"}
            </button>

            <p className={styles.smallHint}>
              TODO: заменить временную защиту на полноценную роль администратора.
            </p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.dashboardShell} aria-label="BellaFlore Admin dashboard">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>BellaFlore Admin</p>
            <h1 className={styles.title}>BellaFlore Admin</h1>
            <p className={styles.lead}>
              Фундамент админ-панели для будущего управления товарами и фото.
            </p>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
            Выйти
          </button>
        </header>

        <section className={styles.sectionGrid} aria-label="Разделы админ-панели">
          {FOUNDATION_SECTIONS.map((section) => {
            const active = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                className={`${styles.sectionCard} ${active ? styles.sectionCardActive : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.sectionDescription}>{section.description}</span>
              </button>
            );
          })}
        </section>

        <div className={styles.contentShell}>{renderSectionContent()}</div>
      </section>
    </main>
  );
}
