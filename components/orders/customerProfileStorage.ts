// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Хранилище личных данных профиля
//
// Purpose (EN):
// Safe localStorage persistence for the customer's saved name, phone, and
// default delivery address — used to prefill "Мой профиль" and checkout.
// No registration or server account is required; this is purely a local,
// per-device convenience store. Reads/writes are wrapped in try/catch so a
// blocked or unavailable localStorage (private browsing, disabled storage)
// never breaks the page — the app just falls back to blank fields.
//
// Назначение (RU):
// Безопасное хранение в localStorage сохранённых имени, телефона и адреса
// по умолчанию покупателя — используется для автозаполнения «Мой профиль»
// и checkout. Регистрация не требуется — это локальное хранилище на
// устройстве. Чтение/запись обёрнуты в try/catch, чтобы недоступный
// localStorage (приватный режим, отключённое хранилище) не ломал страницу.
// ==================================================

const CUSTOMER_PROFILE_STORAGE_KEY = "bellaflore-customer-profile";

export type CustomerProfile = {
  name: string;
  phone: string;
  defaultAddress: string;
};

const EMPTY_PROFILE: CustomerProfile = {
  name: "",
  phone: "",
  defaultAddress: "",
};

function isCustomerProfile(value: unknown): value is CustomerProfile {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CustomerProfile).name === "string" &&
    typeof (value as CustomerProfile).phone === "string" &&
    typeof (value as CustomerProfile).defaultAddress === "string"
  );
}

export function readCustomerProfile(): CustomerProfile {
  if (typeof window === "undefined") {
    return EMPTY_PROFILE;
  }

  try {
    const stored = window.localStorage.getItem(CUSTOMER_PROFILE_STORAGE_KEY);
    if (!stored) {
      return EMPTY_PROFILE;
    }

    const parsed: unknown = JSON.parse(stored);
    return isCustomerProfile(parsed) ? parsed : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function writeCustomerProfile(profile: CustomerProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CUSTOMER_PROFILE_STORAGE_KEY,
      JSON.stringify(profile),
    );
  } catch {
    // In-memory state in the open form still works if storage is blocked.
  }
}
