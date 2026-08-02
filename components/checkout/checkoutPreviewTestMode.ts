// ==================================================
// SECTION: CHECKOUT — PREVIEW TEST MODE
// РАЗДЕЛ: Оформление заказа — тестовый режим Preview
//
// Purpose (EN):
// Lets QA place a real test order on a protected Vercel Preview deployment
// without depending on a live Yandex Maps/Geocoder integration. Resolves a
// single, explicitly-named fixture address to fixed, real Moscow coordinates
// so the normal delivery-zone/price engine (and the server-side recompute in
// app/api/orders) runs unchanged and produces a real, correct price.
//
// Safety: gated by TWO independent conditions that must both be true:
//   1. NEXT_PUBLIC_VERCEL_ENV === "preview" — this value is set automatically
//      by the Vercel platform per deployment target and is NOT something a
//      developer sets by hand, so it cannot be "on" in a Production build
//      even if the feature-flag var below were accidentally copied into the
//      Production environment scope in the Vercel dashboard.
//   2. NEXT_PUBLIC_CHECKOUT_PREVIEW_TEST_MODE === "1" — an explicit opt-in
//      flag that must be set manually on the Preview environment scope only.
//
// Even when both are true, the bypass only ever activates for the single,
// clearly-labeled fixture address below — it never substitutes for real
// Yandex geocoding on any other address, in any environment.
//
// Назначение (RU):
// Позволяет QA оформить настоящий тестовый заказ на защищённом Vercel
// Preview без работающей интеграции Yandex Maps/Geocoder. Один явно
// поименованный тестовый адрес получает фиксированные, реальные координаты
// Москвы — дальше обычный движок зон/цены (и серверный пересчёт в
// app/api/orders) отрабатывает без изменений и считает настоящую цену.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";

export const CHECKOUT_TEST_ADDRESS =
  "Москва, Тестовый адрес Preview QA, 1";

const CHECKOUT_TEST_COORDINATES = {
  latitude: 55.7558,
  longitude: 37.6173,
} as const;

const CHECKOUT_TEST_GEOCODING_PROVIDER = "preview_test_fixture";

function readPublicEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * True only on a Vercel Preview deployment that has explicitly opted in via
 * NEXT_PUBLIC_CHECKOUT_PREVIEW_TEST_MODE=1. Always false in Production and in
 * local development (where NEXT_PUBLIC_VERCEL_ENV is unset).
 */
export function isCheckoutPreviewTestModeEnabled(): boolean {
  return (
    readPublicEnv("NEXT_PUBLIC_VERCEL_ENV") === "preview" &&
    readPublicEnv("NEXT_PUBLIC_CHECKOUT_PREVIEW_TEST_MODE") === "1"
  );
}

export function matchesCheckoutTestAddress(address: string): boolean {
  const normalized = normalizeGeocodingAddress(address).toLowerCase();
  return normalized === CHECKOUT_TEST_ADDRESS.toLowerCase();
}

/**
 * Returns fixed, real Moscow coordinates for the fixture address so the
 * normal zone/price/validation engines resolve exactly as they would for a
 * genuine address at that location. Callers must gate this behind
 * isCheckoutPreviewTestModeEnabled() themselves.
 */
export function getCheckoutTestGeocodingResult(address: string): GeocodingResult {
  return {
    address,
    latitude: CHECKOUT_TEST_COORDINATES.latitude,
    longitude: CHECKOUT_TEST_COORDINATES.longitude,
    confidence: 1,
    provider: CHECKOUT_TEST_GEOCODING_PROVIDER,
    status: "found",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Single entry point: resolves the fixture geocoding result only when both
 * the Preview test-mode flag is on AND the address matches the fixture
 * exactly. Returns null otherwise, so callers fall back to normal geocoding.
 */
export function resolveCheckoutPreviewTestGeocoding(
  address: string,
): GeocodingResult | null {
  if (!isCheckoutPreviewTestModeEnabled()) {
    return null;
  }

  if (!matchesCheckoutTestAddress(address)) {
    return null;
  }

  return getCheckoutTestGeocodingResult(address);
}
