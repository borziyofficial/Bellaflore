// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Courier live location sharing panel
//
// Назначение (RU):
// Панель трансляции геолокации курьера
// ==================================================
"use client";

import styles from "@/components/couriers/CourierWorkspace.module.css";
import type { Courier } from "@/components/couriers/courierModel";
import {
  formatCourierLocationCoordinates,
  getCourierLocationStatusLabel,
} from "@/components/couriers/courierLocationTypes";
import { useCourierGeolocation } from "@/components/couriers/useCourierGeolocation";

type CourierLocationPanelProps = {
  courier: Courier;
};

export function CourierLocationPanel({ courier }: CourierLocationPanelProps) {
  const {
    location: courierLocation,
    status: courierLocationStatus,
    statusMessage: courierLocationMessage,
    isRequesting: isSharingLocation,
    shareLocation,
    applyMockMoscowLocation,
  } = useCourierGeolocation(courier.id, courier.fullName);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <section className={styles.locationCard} aria-label="Courier live location">
      {/* ==================================================
SECTION: MAP
РАЗДЕЛ: Элементы трансляции геолокации
Purpose (EN): Live location share controls
Назначение (RU): Элементы трансляции геолокации
================================================== */}
      <h2 className={styles.sectionHeading}>Live location</h2>
      <p className={styles.locationMeta}>
        Share the current courier location locally for future live tracking.
        Location is stored in this browser only.
      </p>

      <div className={styles.locationActions}>
        <button
          type="button"
          className={styles.shareLocationButton}
          onClick={shareLocation}
          disabled={isSharingLocation}
        >
          {isSharingLocation ? "Sharing location…" : "Share my location"}
        </button>

        {isDevelopment ? (
          <button
            type="button"
            className={styles.mockLocationButton}
            onClick={applyMockMoscowLocation}
            disabled={isSharingLocation}
          >
            Use mock Moscow location
          </button>
        ) : null}
      </div>

      <div className={styles.locationStatusRow}>
        <span className={styles.locationStatusLabel}>Status</span>
        <strong
          className={`${styles.locationStatusBadge} ${
            courierLocationStatus === "active"
              ? styles.locationStatusActive
              : courierLocationStatus === "permission_denied"
                ? styles.locationStatusDenied
                : courierLocationStatus === "unavailable"
                  ? styles.locationStatusUnavailable
                  : courierLocationStatus === "error"
                    ? styles.locationStatusError
                    : styles.locationStatusIdle
          }`}
        >
          {courierLocationStatus === "idle"
            ? "Not shared yet"
            : getCourierLocationStatusLabel(courierLocationStatus)}
        </strong>
      </div>

      {courierLocationMessage ? (
        <p className={styles.locationNotice} role="status">
          {courierLocationMessage}
        </p>
      ) : null}

      {courierLocation ? (
        <dl className={styles.locationDetails}>
          <div>
            <dt>Coordinates</dt>
            <dd>
              {formatCourierLocationCoordinates(
                courierLocation.latitude,
                courierLocation.longitude,
              )}
            </dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>
              {courierLocation.accuracy !== null
                ? `${Math.round(courierLocation.accuracy)} m`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{courierLocation.source}</dd>
          </div>
          <div>
            <dt>Captured</dt>
            <dd>{new Date(courierLocation.capturedAt).toLocaleString()}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
