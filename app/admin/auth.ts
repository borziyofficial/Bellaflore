// ==================================================
// SECTION: Admin — Session Auth Helpers
// РАЗДЕЛ: Admin — хелперы сессионной авторизации
//
// Purpose (EN): Client-side admin session storage keys, paths, and read/write helpers for login gate.
//
// Назначение (RU): Ключи хранения admin-сессии на клиенте, пути и хелперы чтения/записи для проверки входа.
// ==================================================

export const ADMIN_SESSION_STORAGE_KEY = "bellaflore.admin.session";
export const ADMIN_SESSION_VALUE = "authenticated";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_DASHBOARD_PATH = "/admin";

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ===
      ADMIN_SESSION_VALUE
    );
  } catch {
    return false;
  }
}

export function storeAdminSession(): void {
  try {
    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, ADMIN_SESSION_VALUE);
  } catch {
    throw new Error("Admin session storage is unavailable.");
  }
}

