// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Map provider configuration status indicator
//
// Назначение (RU):
// Индикатор статуса провайдера карт
// ==================================================
"use client";

import styles from "@/components/admin/MapProviderStatus.module.css";
import {
  getMapProviderCapabilityLabel,
  getMapProviderLabel,
} from "@/components/maps/mapProviderConfig";
import {
  getMapProviderStatusSnapshot,
  isDeliveryMapSdkLazyLoadEnabled,
  isYandexGeocodingEnabled,
  isYandexMapsPreviewEnabled,
  isYandexSuggestEnabled,
} from "@/components/maps/mapProviderRegistry";
import type { MapProviderCapability } from "@/components/maps/mapProviderTypes";
import { useMemo } from "react";

const CAPABILITY_ORDER: MapProviderCapability[] = [
  "geocoding",
  "mapPreview",
  "routing",
  "eta",
  "traffic",
];

function getRuntimeStatusMessage(
  mapsPreviewReady: boolean,
  geocodingReady: boolean,
  suggestReady: boolean,
  usesMockFallback: boolean,
): string {
  if (mapsPreviewReady) {
    return "Yandex Maps JavaScript API настроен. SDK загружается lazy: только после «Показать карту» на главной, в checkout и в Delivery Planner.";
  }

  if (usesMockFallback) {
    return "Провайдер Yandex выбран, но ключ карты не найден. Checkout использует лёгкий static fallback с цветными зонами.";
  }

  if (geocodingReady || suggestReady) {
    return "Geocoder или GeoSuggest частично настроены. Preview карты недоступен без NEXT_PUBLIC_YANDEX_MAPS_API_KEY.";
  }

  return "Активен mock-провайдер. Добавьте ключи Yandex в .env.local для live-карты и подсказок адреса.";
}

export function MapProviderStatus() {
  const status = useMemo(() => getMapProviderStatusSnapshot(), []);
  const mapsPreviewReady = isYandexMapsPreviewEnabled();
  const geocodingReady = isYandexGeocodingEnabled();
  const suggestReady = isYandexSuggestEnabled();
  const sdkLazyLoadEnabled = isDeliveryMapSdkLazyLoadEnabled();
  const runtimeMessage = getRuntimeStatusMessage(
    mapsPreviewReady,
    geocodingReady,
    suggestReady,
    status.config.usesMockFallback,
  );

  return (
    <section className={styles.providerStatusSection}>
      <div className={styles.providerStatusHeader}>
        <h2 className={styles.providerStatusHeading}>Maps Provider</h2>
        <p className={styles.providerStatusMeta}>{runtimeMessage}</p>
      </div>

      <div className={styles.statusGrid}>
        <article className={styles.statusCard}>
          <span>Current provider</span>
          <strong>{getMapProviderLabel(status.config.configuredProvider)}</strong>
        </article>
        <article className={styles.statusCard}>
          <span>Maps API key</span>
          <strong
            className={
              mapsPreviewReady ? styles.valueConfigured : styles.valueMissing
            }
          >
            {mapsPreviewReady ? "Configured" : "Missing"}
          </strong>
        </article>
        <article className={styles.statusCard}>
          <span>Geocoder key</span>
          <strong
            className={
              geocodingReady ? styles.valueConfigured : styles.valueMissing
            }
          >
            {geocodingReady ? "Configured" : "Missing"}
          </strong>
        </article>
        <article className={styles.statusCard}>
          <span>GeoSuggest key</span>
          <strong
            className={
              suggestReady ? styles.valueConfigured : styles.valueMissing
            }
          >
            {suggestReady ? "Configured" : "Missing"}
          </strong>
        </article>
        <article className={styles.statusCard}>
          <span>SDK lazy-loaded</span>
          <strong
            className={
              sdkLazyLoadEnabled ? styles.valueConfigured : styles.valueMissing
            }
          >
            {sdkLazyLoadEnabled ? "Enabled" : "Disabled"}
          </strong>
        </article>
        <article className={styles.statusCard}>
          <span>Runtime fallback</span>
          <strong
            className={
              status.config.usesMockFallback
                ? styles.valueWarning
                : styles.valueReady
            }
          >
            {status.config.usesMockFallback
              ? getMapProviderLabel(status.config.effectiveProvider)
              : "Not active"}
          </strong>
        </article>
      </div>

      {status.config.usesMockFallback ? (
        <p className={styles.fallbackWarning} role="status">
          {getMapProviderLabel(status.config.configuredProvider)} is configured,
          but{" "}
          {status.config.configuredProvider === "yandex" ? (
            <code>NEXT_PUBLIC_YANDEX_MAPS_API_KEY</code>
          ) : (
            <>
              an API key (<code>NEXT_PUBLIC_MAP_API_KEY</code>)
            </>
          )}{" "}
          was not found. Checkout shows the static zone fallback until a maps key
          is added.
        </p>
      ) : null}

      {mapsPreviewReady ? (
        <p className={styles.fallbackInfo} role="status">
          Live Yandex zone polygons (MKAD approximation + outer rings) render
          after the user opens the map. Checkout, home delivery section, and
          admin planner share the same lazy SDK gate. Static colored rings remain
          the lightweight fallback when the SDK is unavailable.
        </p>
      ) : null}

      {!status.realProviderEnabled &&
      status.config.configuredProvider === "mock" ? (
        <p className={styles.fallbackInfo} role="status">
          Mock provider is active. Set <code>NEXT_PUBLIC_MAP_PROVIDER=yandex</code>{" "}
          and <code>NEXT_PUBLIC_YANDEX_MAPS_API_KEY</code> to enable the Yandex
          map preview.
        </p>
      ) : null}

      <div className={styles.capabilitiesSection}>
        <h3 className={styles.capabilitiesHeading}>Capabilities</h3>
        <ul className={styles.capabilitiesList}>
          {CAPABILITY_ORDER.map((capability) => {
            const isEnabled = status.capabilities[capability];

            return (
              <li
                key={capability}
                className={`${styles.capabilityItem} ${
                  isEnabled
                    ? styles.capabilityEnabled
                    : styles.capabilityDisabled
                }`}
              >
                <span className={styles.capabilityName}>
                  {getMapProviderCapabilityLabel(capability)}
                </span>
                <span className={styles.capabilityState}>
                  {isEnabled ? "Supported" : "Not available"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
