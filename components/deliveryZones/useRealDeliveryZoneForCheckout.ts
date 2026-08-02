// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
"use client";

import {
  resolveRealDeliveryZoneForCheckout,
  resolveRealDeliveryZoneForCheckoutAsync,
} from "@/components/deliveryZones/realDeliveryZoneEngine";
import type {
  DeliveryZoneDetectionMode,
  RealDeliveryZoneResult,
} from "@/components/deliveryZones/realDeliveryZoneTypes";
import { geocodeAddress } from "@/components/maps/geocodeAddress";
import {
  GEOCODING_CACHE_UPDATED_EVENT,
  readGeocodingCacheEntry,
  writeGeocodingCacheEntry,
} from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";
import { isYandexGeocodingEnabled } from "@/components/maps/mapProviderRegistry";
import { geocodeAddressYandex } from "@/components/maps/yandexGeocoder";
import { useEffect, useMemo, useState } from "react";

// Hard ceiling on how long the UI waits for geocoding before treating it as
// failed. The underlying HTTP/SDK calls have their own internal timeouts
// too, but this top-level cap guarantees the "Проверяем адрес…" state can
// never persist longer than this, regardless of how many fallback layers
// the lower-level code attempts internally.
const GEOCODING_OVERALL_TIMEOUT_MS = 9_000;

function withOverallTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timerId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(onTimeout());
    }, timeoutMs);

    promise.then((value) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timerId);
      resolve(value);
    });
  });
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function useRealDeliveryZoneForCheckout(
  address: string,
  detectionMode: DeliveryZoneDetectionMode = "hybrid",
): RealDeliveryZoneResult {
  const [geocodingCacheVersion, setGeocodingCacheVersion] = useState(0);
  const syncResult = useMemo(() => {
    void geocodingCacheVersion;
    return resolveRealDeliveryZoneForCheckout(address, detectionMode);
  }, [address, detectionMode, geocodingCacheVersion]);
  const [asyncResult, setAsyncResult] =
    useState<RealDeliveryZoneResult | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleCacheUpdate = () => {
      setGeocodingCacheVersion((current) => current + 1);
    };

    window.addEventListener(GEOCODING_CACHE_UPDATED_EVENT, handleCacheUpdate);

    return () => {
      window.removeEventListener(GEOCODING_CACHE_UPDATED_EVENT, handleCacheUpdate);
    };
  }, []);

  useEffect(() => {
    const normalizedAddress = address.trim();

    if (!normalizedAddress || !isYandexGeocodingEnabled()) {
      return;
    }

    const addressKey = normalizeGeocodingAddress(normalizedAddress);
    const cachedResult = readGeocodingCacheEntry(addressKey);

    if (cachedResult?.status === "found") {
      return;
    }

    const geocoding = geocodeAddress(normalizedAddress);

    if (geocoding.status !== "pending") {
      return;
    }

    let cancelled = false;

    void withOverallTimeout(
      geocodeAddressYandex(normalizedAddress),
      GEOCODING_OVERALL_TIMEOUT_MS,
      () => ({
        address: normalizedAddress,
        latitude: null,
        longitude: null,
        confidence: null,
        provider: "yandex" as const,
        status: "error" as const,
        updatedAt: new Date().toISOString(),
      }),
    ).then((geocodingResult) => {
      if (cancelled) {
        return;
      }

      writeGeocodingCacheEntry(addressKey, geocodingResult);
      setGeocodingCacheVersion((current) => current + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    let cancelled = false;

    void resolveRealDeliveryZoneForCheckoutAsync(address, detectionMode).then(
      (nextResult) => {
        if (!cancelled) {
          setAsyncResult(nextResult);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [address, detectionMode, geocodingCacheVersion]);

  if (asyncResult?.address === syncResult.address) {
    return asyncResult;
  }

  return syncResult;
}
