// ==================================================
// SECTION: MAP
// РАЗДЕЛ: Карта
//
// Purpose (EN):
// Live courier positions on admin map
//
// Назначение (RU):
// Карта живых позиций курьеров в админке
// ==================================================
"use client";

import styles from "@/components/admin/LiveCourierMap.module.css";
import {
  formatLiveCourierAccuracy,
  formatLiveCourierAge,
  formatLiveCourierHeading,
  formatLiveCourierSpeed,
  getLiveCourierOnlineBadgeColor,
  type LiveCourierMapData,
  type LiveCourierMapMarker,
  type LiveCourierOnlineBadge,
} from "@/components/couriers/liveCourierMapData";
import {
  formatCourierLocationCoordinates,
  getCourierLocationStatusLabel,
} from "@/components/couriers/courierLocationTypes";
import type {
  YandexGeoObject,
  YandexMap,
  YandexMapsApi,
} from "@/components/maps/yandexMapsApi.types";
import {
  LIVE_COURIER_REFRESH_INTERVAL_OPTIONS,
  type LiveCourierRefreshIntervalMs,
} from "@/components/couriers/liveCourierUpdateConfig";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getOnlineBadgeClassName(badge: LiveCourierOnlineBadge): string {
  switch (badge) {
    case "online":
      return styles.liveCourierBadgeOnline;
    case "recent":
      return styles.liveCourierBadgeRecent;
    case "offline":
      return styles.liveCourierBadgeOffline;
    case "error":
    default:
      return styles.liveCourierBadgeError;
  }
}

function buildCourierBalloonBody(marker: LiveCourierMapMarker): string {
  return [
    `<div><strong>Status:</strong> ${escapeHtml(marker.onlineBadgeLabel)}</div>`,
    `<div><strong>Latitude:</strong> ${escapeHtml(marker.latitude.toFixed(5))}</div>`,
    `<div><strong>Longitude:</strong> ${escapeHtml(marker.longitude.toFixed(5))}</div>`,
    `<div><strong>Accuracy:</strong> ${escapeHtml(formatLiveCourierAccuracy(marker.accuracy))}</div>`,
    `<div><strong>Heading:</strong> ${escapeHtml(formatLiveCourierHeading(marker.heading))}</div>`,
    `<div><strong>Speed:</strong> ${escapeHtml(formatLiveCourierSpeed(marker.speed))}</div>`,
    `<div><strong>Captured:</strong> ${escapeHtml(new Date(marker.capturedAt).toLocaleString())}</div>`,
  ].join("");
}

function buildCourierPlacemark(
  ymaps: YandexMapsApi,
  marker: LiveCourierMapMarker,
) {
  const placemark = new ymaps.Placemark(
    [marker.latitude, marker.longitude],
    {
      hintContent: `${marker.courierName} · ${marker.onlineBadgeLabel}`,
      balloonContentHeader: marker.courierName,
      balloonContentBody: buildCourierBalloonBody(marker),
    },
    {
      preset: "islands#squareDotIcon",
      iconColor: marker.markerColor,
    },
  );

  placemark.events.add("click", () => {
    placemark.balloon.open();
  });

  return placemark;
}

type LiveCourierRefreshControlsProps = {
  autoRefreshEnabled: boolean;
  refreshIntervalMs: LiveCourierRefreshIntervalMs;
  lastRefreshedAt: Date | null;
  isDocumentVisible: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefreshIntervalChange: (intervalMs: LiveCourierRefreshIntervalMs) => void;
  onRefreshNow: () => void;
};

export function LiveCourierRefreshControls({
  autoRefreshEnabled,
  refreshIntervalMs,
  lastRefreshedAt,
  isDocumentVisible,
  onAutoRefreshChange,
  onRefreshIntervalChange,
  onRefreshNow,
}: LiveCourierRefreshControlsProps) {
  return (
    <div className={styles.liveCourierControls}>
      <label className={styles.liveCourierControlToggle}>
        <input
          type="checkbox"
          checked={autoRefreshEnabled}
          onChange={(event) => onAutoRefreshChange(event.target.checked)}
        />
        Auto-refresh
      </label>

      <label className={styles.liveCourierControlField}>
        <span>Refresh interval</span>
        <select
          value={refreshIntervalMs}
          disabled={!autoRefreshEnabled}
          onChange={(event) =>
            onRefreshIntervalChange(
              Number(event.target.value) as LiveCourierRefreshIntervalMs,
            )
          }
        >
          {LIVE_COURIER_REFRESH_INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={styles.liveCourierRefreshButton}
        onClick={onRefreshNow}
      >
        Refresh now
      </button>

      <p className={styles.liveCourierRefreshMeta} role="status">
        Last refresh:{" "}
        {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : "Not yet"}
        {!isDocumentVisible ? " · Paused while tab is hidden" : null}
      </p>
    </div>
  );
}

type LiveCourierMapSummaryProps = {
  data: LiveCourierMapData;
};

export function LiveCourierMapSummary({ data }: LiveCourierMapSummaryProps) {
  return (
    <section className={styles.liveCourierSection} aria-label="Live courier map">
      <div className={styles.liveCourierHeader}>
        <h3 className={styles.liveCourierHeading}>Live Courier Map</h3>
        <p className={styles.liveCourierMeta}>
          Courier GPS markers from local storage with optional background refresh.
        </p>
      </div>

      <div className={styles.liveCourierSummaryGrid}>
        <article className={styles.liveCourierSummaryCard}>
          <span>Total</span>
          <strong>{data.summary.total}</strong>
        </article>
        <article className={styles.liveCourierSummaryCard}>
          <span>Online</span>
          <strong>{data.summary.online}</strong>
        </article>
        <article className={styles.liveCourierSummaryCard}>
          <span>Recent</span>
          <strong>{data.summary.recent}</strong>
        </article>
        <article className={styles.liveCourierSummaryCard}>
          <span>Offline</span>
          <strong>{data.summary.offline}</strong>
        </article>
        <article className={styles.liveCourierSummaryCard}>
          <span>Error</span>
          <strong>{data.summary.error}</strong>
        </article>
      </div>

      <div className={styles.liveCourierLegendRow}>
        <span className={styles.liveCourierLegendItem}>
          <span
            className={styles.liveCourierLegendSwatch}
            style={{ backgroundColor: getLiveCourierOnlineBadgeColor("online") }}
          />
          Online (&lt; 60 sec)
        </span>
        <span className={styles.liveCourierLegendItem}>
          <span
            className={styles.liveCourierLegendSwatch}
            style={{ backgroundColor: getLiveCourierOnlineBadgeColor("recent") }}
          />
          Recent (60 sec – 5 min)
        </span>
        <span className={styles.liveCourierLegendItem}>
          <span
            className={styles.liveCourierLegendSwatch}
            style={{ backgroundColor: getLiveCourierOnlineBadgeColor("offline") }}
          />
          Offline (&gt; 5 min)
        </span>
        <span className={styles.liveCourierLegendItem}>
          <span
            className={styles.liveCourierLegendSwatch}
            style={{ backgroundColor: getLiveCourierOnlineBadgeColor("error") }}
          />
          Permission denied / error
        </span>
      </div>

      {data.visibleCouriers.length === 0 ? (
        <p className={styles.liveCourierEmpty}>
          No courier GPS locations in local storage yet.
        </p>
      ) : (
        <ul className={styles.liveCourierList}>
          {data.visibleCouriers.map((marker) => (
            <li key={marker.courierId} className={styles.liveCourierListItem}>
              <div className={styles.liveCourierListTop}>
                <span
                  className={styles.liveCourierColorSwatch}
                  style={{ backgroundColor: marker.markerColor }}
                />
                <strong>{marker.courierName}</strong>
                <span
                  className={`${styles.liveCourierBadge} ${getOnlineBadgeClassName(marker.onlineBadge)}`}
                >
                  {marker.onlineBadgeLabel}
                </span>
              </div>
              <p className={styles.liveCourierListMeta}>
                Updated {formatLiveCourierAge(marker.ageSeconds)}
                {" · "}
                Accuracy {formatLiveCourierAccuracy(marker.accuracy)}
                {marker.heading !== null
                  ? ` · Heading ${formatLiveCourierHeading(marker.heading)}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type LiveCourierSvgMarkersProps = {
  markers: LiveCourierMapMarker[];
  projectCoordinates: (
    latitude: number,
    longitude: number,
  ) => { x: number; y: number };
  selectedCourierId: string | null;
  onMarkerClick: (courierId: string) => void;
};

export function LiveCourierSvgMarkers({
  markers,
  projectCoordinates,
  selectedCourierId,
  onMarkerClick,
}: LiveCourierSvgMarkersProps) {
  return (
    <>
      {markers.map((marker) => {
        const position = projectCoordinates(marker.latitude, marker.longitude);
        const isSelected = selectedCourierId === marker.courierId;
        const badgeColor = getLiveCourierOnlineBadgeColor(marker.onlineBadge);

        return (
          <g
            key={marker.courierId}
            data-live-courier-marker
            className={`${styles.liveCourierMarker} ${isSelected ? styles.liveCourierMarkerSelected : ""}`}
            transform={`translate(${position.x}, ${position.y})`}
            onClick={(event) => {
              event.stopPropagation();
              onMarkerClick(marker.courierId);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onMarkerClick(marker.courierId);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Courier ${marker.courierName}, ${marker.onlineBadgeLabel}`}
          >
            <rect
              x={isSelected ? -12 : -10}
              y={isSelected ? -12 : -10}
              width={isSelected ? 24 : 20}
              height={isSelected ? 24 : 20}
              rx={4}
              className={styles.liveCourierMarkerBody}
              fill={marker.markerColor}
              transform="rotate(45)"
            />
            <circle
              cx={14}
              cy={-14}
              r={5}
              className={styles.liveCourierMarkerBadge}
              fill={badgeColor}
            />
            <circle
              r={isSelected ? 18 : 16}
              className={styles.liveCourierMarkerRing}
            />
            <text y={24} className={styles.liveCourierMarkerLabel}>
              {marker.courierName}
            </text>
            <text y={35} className={styles.liveCourierMarkerMeta}>
              {formatLiveCourierAge(marker.ageSeconds)}
            </text>
          </g>
        );
      })}
    </>
  );
}

type LiveCourierMarkerPopupProps = {
  marker: LiveCourierMapMarker;
};

export function LiveCourierMarkerPopup({ marker }: LiveCourierMarkerPopupProps) {
  return (
    <div className={styles.liveCourierPopup} role="status">
      <p className={styles.liveCourierPopupHeading}>{marker.courierName}</p>
      <dl className={styles.liveCourierPopupList}>
        <div>
          <dt>Status</dt>
          <dd>{marker.onlineBadgeLabel}</dd>
        </div>
        <div>
          <dt>Record status</dt>
          <dd>{getCourierLocationStatusLabel(marker.recordStatus)}</dd>
        </div>
        <div>
          <dt>Latitude</dt>
          <dd>{marker.latitude.toFixed(5)}</dd>
        </div>
        <div>
          <dt>Longitude</dt>
          <dd>{marker.longitude.toFixed(5)}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            {formatCourierLocationCoordinates(
              marker.latitude,
              marker.longitude,
            )}
          </dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{formatLiveCourierAccuracy(marker.accuracy)}</dd>
        </div>
        <div>
          <dt>Heading</dt>
          <dd>{formatLiveCourierHeading(marker.heading)}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{formatLiveCourierSpeed(marker.speed)}</dd>
        </div>
        <div>
          <dt>Captured time</dt>
          <dd>{new Date(marker.capturedAt).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}

export function addLiveCourierPlacemarksToYandexMap(
  ymaps: YandexMapsApi,
  map: YandexMap,
  markers: LiveCourierMapMarker[],
): void {
  for (const marker of markers) {
    map.geoObjects.add(buildCourierPlacemark(ymaps, marker));
  }
}

export function replaceLiveCourierPlacemarksOnYandexMap(
  ymaps: YandexMapsApi,
  map: YandexMap,
  markers: LiveCourierMapMarker[],
  existingPlacemarks: YandexGeoObject[],
): YandexGeoObject[] {
  for (const placemark of existingPlacemarks) {
    map.geoObjects.remove(placemark);
  }

  return markers.map((marker) => {
    const placemark = buildCourierPlacemark(ymaps, marker);
    map.geoObjects.add(placemark);
    return placemark;
  });
}
