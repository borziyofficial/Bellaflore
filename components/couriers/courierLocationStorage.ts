// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// localStorage persistence for live courier location updates.
//
// Назначение (RU):
// Сохранение live-позиций курьеров в localStorage.
// ==================================================
import type { CourierLocationRecord } from "@/components/couriers/courierLocationTypes";

export const COURIER_LOCATION_STORAGE_KEY = "bellaflore_courier_locations_v1";

type CourierLocationStore = Record<string, CourierLocationRecord>;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function readStore(): CourierLocationStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(COURIER_LOCATION_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as CourierLocationStore;
  } catch {
    return {};
  }
}

function writeStore(store: CourierLocationStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    COURIER_LOCATION_STORAGE_KEY,
    JSON.stringify(store),
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function saveCourierLocation(location: CourierLocationRecord): void {
  const courierId = location.courierId.trim();
  if (!courierId) {
    return;
  }

  const store = readStore();
  store[courierId] = location;
  writeStore(store);
}

export function getCourierLocation(
  courierId: string,
): CourierLocationRecord | null {
  const normalizedCourierId = courierId.trim();
  if (!normalizedCourierId) {
    return null;
  }

  return readStore()[normalizedCourierId] ?? null;
}

export function getAllCourierLocations(): CourierLocationRecord[] {
  return Object.values(readStore()).sort((firstLocation, secondLocation) =>
    firstLocation.courierName.localeCompare(secondLocation.courierName, "ru"),
  );
}

export function clearCourierLocation(courierId: string): void {
  const normalizedCourierId = courierId.trim();
  if (!normalizedCourierId) {
    return;
  }

  const store = readStore();
  delete store[normalizedCourierId];
  writeStore(store);
}
