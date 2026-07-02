// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Live route monitoring dashboard panel
//
// Назначение (RU):
// Панель мониторинга маршрутов в реальном времени
// ==================================================
"use client";

import styles from "@/components/admin/LiveRouteMonitoringPanel.module.css";
import { formatLiveCourierAge } from "@/components/couriers/liveCourierMapData";
import { formatEstimatedMinutes } from "@/components/maps/etaCalculator";
import type { LiveRouteMonitoringData } from "@/components/couriers/liveRouteMonitoringTypes";
import {
  formatLiveRouteDistanceKm,
  getLiveRouteDeviationStatusLabel,
  getLiveRouteMovementStatusLabel,
  type LiveRouteCourierMonitoring,
  type LiveRouteDeviationStatus,
  type LiveRouteMovementStatus,
} from "@/components/couriers/liveRouteMonitoringTypes";

type LiveRouteMonitoringPanelProps = {
  data: LiveRouteMonitoringData;
};

function getMovementStatusClassName(status: LiveRouteMovementStatus): string {
  switch (status) {
    case "moving":
      return styles.movementMoving;
    case "stopped":
      return styles.movementStopped;
    case "unknown":
    default:
      return styles.movementUnknown;
  }
}

function getDeviationStatusClassName(
  status: LiveRouteDeviationStatus,
): string {
  switch (status) {
    case "on_route":
      return styles.deviationOnRoute;
    case "slight_deviation":
      return styles.deviationSlight;
    case "off_route":
      return styles.deviationOffRoute;
    case "unknown":
    default:
      return styles.deviationUnknown;
  }
}

function getGpsStatusLabel(record: LiveRouteCourierMonitoring): string {
  if (!record.currentLocation) {
    return "No live courier location";
  }

  if (record.lastLocationAgeSeconds === null) {
    return "Live GPS available";
  }

  return `Live GPS · ${formatLiveCourierAge(record.lastLocationAgeSeconds)}`;
}

function LiveRouteMonitoringCard({
  record,
}: {
  record: LiveRouteCourierMonitoring;
}) {
  const hasActiveRoute = record.activeRouteOrderIds.length > 0;

  return (
    <li className={styles.monitoringCard}>
      <div className={styles.monitoringCardTop}>
        <strong>{record.courierName}</strong>
        <span className={styles.gpsStatus}>{getGpsStatusLabel(record)}</span>
      </div>

      <dl className={styles.monitoringDetails}>
        <div>
          <dt>Movement</dt>
          <dd>
            <span
              className={`${styles.statusBadge} ${getMovementStatusClassName(record.movementStatus)}`}
            >
              {getLiveRouteMovementStatusLabel(record.movementStatus)}
            </span>
          </dd>
        </div>
        <div>
          <dt>Next delivery</dt>
          <dd>
            {hasActiveRoute
              ? (record.nextOrderId ?? "—")
              : "No active route"}
          </dd>
        </div>
        <div>
          <dt>Distance to next</dt>
          <dd>{formatLiveRouteDistanceKm(record.distanceToNextKm)}</dd>
        </div>
        <div>
          <dt>ETA to next</dt>
          <dd>{formatEstimatedMinutes(record.estimatedMinutesToNext)}</dd>
        </div>
        <div>
          <dt>Route deviation</dt>
          <dd>
            <span
              className={`${styles.statusBadge} ${getDeviationStatusClassName(record.routeDeviationStatus)}`}
            >
              {getLiveRouteDeviationStatusLabel(record.routeDeviationStatus)}
            </span>
          </dd>
        </div>
      </dl>

      {!record.currentLocation ? (
        <p className={styles.monitoringNotice}>No live courier location</p>
      ) : null}

      {!hasActiveRoute ? (
        <p className={styles.monitoringNotice}>No active route</p>
      ) : null}

      {record.warnings.length > 0 ? (
        <ul className={styles.warningList}>
          {record.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LiveRouteMonitoringPanel({ data }: LiveRouteMonitoringPanelProps) {
  return (
    <section
      className={styles.monitoringSection}
      aria-label="Live route monitoring"
    >
      <div className={styles.monitoringHeader}>
        <h3 className={styles.monitoringHeading}>Live Route Monitoring</h3>
        <p className={styles.monitoringMeta}>
          Observe courier movement against active routes. Read-only monitoring
          signals for dispatchers.
        </p>
      </div>

      {data.couriers.length === 0 ? (
        <p className={styles.monitoringEmpty}>
          No couriers with active routes or live GPS yet.
        </p>
      ) : (
        <ul className={styles.monitoringList}>
          {data.couriers.map((record) => (
            <LiveRouteMonitoringCard key={record.courierId} record={record} />
          ))}
        </ul>
      )}

      <p className={styles.monitoringUpdatedAt}>
        Monitoring updated {new Date(data.updatedAt).toLocaleTimeString()}
      </p>
    </section>
  );
}
