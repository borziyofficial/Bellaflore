// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Maps foundation setup and diagnostics assistant
//
// Назначение (RU):
// Ассистент настройки и диагностики карт
// ==================================================
"use client";

import styles from "@/components/admin/MapsFoundationAssistant.module.css";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { geocodePendingMapPoints } from "@/components/maps/geocodingActions";
import { isYandexGeocodingEnabled } from "@/components/maps/mapProviderRegistry";
import {
  buildMapsFoundationData,
  formatMapCoordinates,
  getGeocodingResultStatusClassSuffix,
  getGeocodingResultStatusLabel,
  getNeedsGeocodingMapPoints,
  type GeocodingOverrides,
  type OrderMapPoint,
} from "@/components/maps/orderMapData";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";
import { useMemo, useState } from "react";

type MapsFoundationAssistantProps = {
  orders: AdminOrderRecord[];
  geocodingOverrides: GeocodingOverrides;
  onGeocodingOverridesChange: (overrides: GeocodingOverrides) => void;
  onOrderSelect: (orderId: string) => void;
};

function getGeocodingResultClass(point: OrderMapPoint): string {
  const suffix = getGeocodingResultStatusClassSuffix(point.geocoding);

  switch (suffix) {
    case "Cached":
      return styles.statusCached;
    case "Found":
      return styles.statusFound;
    case "Pending":
      return styles.statusPending;
    case "Error":
      return styles.statusError;
    case "NotFound":
    default:
      return styles.statusNotFound;
  }
}

function MapPointItem({
  point,
  onOrderSelect,
}: {
  point: OrderMapPoint;
  onOrderSelect: (orderId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.pointButton}
        onClick={() => onOrderSelect(point.orderId)}
      >
        <div className={styles.pointTop}>
          <strong>{point.orderId}</strong>
          <div className={styles.statusBadgeGroup}>
            <span
              className={`${styles.statusBadge} ${getGeocodingResultClass(point)}`}
            >
              {getGeocodingResultStatusLabel(point.geocoding)}
            </span>
          </div>
        </div>

        <div className={styles.pointMeta}>
          <div>
            <span>Address</span>
            <strong>{point.address || "—"}</strong>
          </div>
          <div>
            <span>Coordinates</span>
            <strong>{formatMapCoordinates(point.coordinates)}</strong>
          </div>
          <div>
            <span>Provider</span>
            <strong>{point.geocoding.provider}</strong>
          </div>
          <div>
            <span>Courier</span>
            <strong>{point.courier ?? "Not assigned"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{getOrderStatusLabel(point.status)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>
              {point.deliveryDate || "—"}
              {point.deliveryInterval ? ` · ${point.deliveryInterval}` : ""}
            </strong>
          </div>
          <div>
            <span>Customer</span>
            <strong>{point.customer}</strong>
          </div>
        </div>
      </button>
    </li>
  );
}

export function MapsFoundationAssistant({
  orders,
  geocodingOverrides,
  onGeocodingOverridesChange,
  onOrderSelect,
}: MapsFoundationAssistantProps) {
  const yandexGeocodingEnabled = isYandexGeocodingEnabled();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [geocodeNotice, setGeocodeNotice] = useState("");

  const mapsData = useMemo(
    () => buildMapsFoundationData(orders, geocodingOverrides),
    [geocodingOverrides, orders],
  );
  const needsGeocodingCount = getNeedsGeocodingMapPoints(mapsData.points).length;

  const handleGeocodeAddresses = async () => {
    if (!yandexGeocodingEnabled || isGeocoding) {
      return;
    }

    setIsGeocoding(true);
    setGeocodeError("");
    setGeocodeNotice("");

    try {
      const results = await geocodePendingMapPoints(mapsData.points);
      onGeocodingOverridesChange(results);
      setGeocodeNotice(
        Object.keys(results).length > 0
          ? `Geocoded ${Object.keys(results).length} address(es) in memory.`
          : "No pending or not-found addresses to geocode.",
      );
    } catch {
      setGeocodeError("Unable to geocode addresses right now.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <section
      className={styles.mapsFoundationSection}
      aria-label="Maps foundation"
    >
      <h3 className={styles.mapsFoundationHeading}>Maps Foundation</h3>
      <p className={styles.mapsFoundationMeta}>
        {yandexGeocodingEnabled
          ? "Yandex geocoding is enabled. Run geocoding manually for pending or not-found addresses. Results stay in browser memory and local cache only."
          : "Mock geocoding foundation for delivery map previews. External geocoding stays disabled until Yandex provider and API key are configured."}
      </p>

      {yandexGeocodingEnabled ? (
        <div className={styles.geocodeActions}>
          <button
            type="button"
            className={styles.geocodeButton}
            onClick={() => void handleGeocodeAddresses()}
            disabled={isGeocoding || needsGeocodingCount === 0}
          >
            {isGeocoding ? "Geocoding addresses…" : "Geocode addresses"}
          </button>
          <span className={styles.geocodeHint}>
            {needsGeocodingCount} pending or not-found address
            {needsGeocodingCount === 1 ? "" : "es"}
          </span>
        </div>
      ) : null}

      {geocodeNotice ? (
        <p className={styles.geocodeNotice} role="status">
          {geocodeNotice}
        </p>
      ) : null}

      {geocodeError ? (
        <p className={styles.geocodeError} role="alert">
          {geocodeError}
        </p>
      ) : null}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Total addresses</span>
          <strong>{mapsData.summary.totalDeliveryAddresses}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Geocoded</span>
          <strong>{mapsData.summary.geocodedCount}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Pending</span>
          <strong>{mapsData.summary.pendingCount}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Not found</span>
          <strong>{mapsData.summary.notFoundCount}</strong>
        </div>
      </div>

      {mapsData.points.length === 0 ? (
        <p className={styles.emptyState}>No delivery addresses yet.</p>
      ) : (
        <ul className={styles.pointList}>
          {mapsData.points.map((point) => (
            <MapPointItem
              key={point.orderId}
              point={point}
              onOrderSelect={onOrderSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
