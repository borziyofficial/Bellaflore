// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Map marker and route data builders for live courier tracking.
//
// Назначение (RU):
// Построение маркеров и маршрутов для live-карты курьеров.
// ==================================================
import { getAllCourierLocations } from "@/components/couriers/courierLocationStorage";
import type {
  CourierLocationRecord,
  CourierLocationStatus,
} from "@/components/couriers/courierLocationTypes";
import { getCourierMapColor } from "@/components/maps/courierMapColors";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type LiveCourierOnlineBadge = "online" | "recent" | "offline" | "error";

export type LiveCourierMapMarker = {
  courierId: string;
  courierName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  capturedAt: string;
  source: CourierLocationRecord["source"];
  recordStatus: CourierLocationStatus;
  markerColor: string;
  onlineBadge: LiveCourierOnlineBadge;
  onlineBadgeLabel: string;
  ageSeconds: number;
};

export type LiveCourierGroups = {
  online: LiveCourierMapMarker[];
  recent: LiveCourierMapMarker[];
  offline: LiveCourierMapMarker[];
  error: LiveCourierMapMarker[];
};

export type LiveCourierMapData = {
  markers: LiveCourierMapMarker[];
  visibleCouriers: LiveCourierMapMarker[];
  groups: LiveCourierGroups;
  summary: {
    total: number;
    online: number;
    recent: number;
    offline: number;
    error: number;
  };
};


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
const ONLINE_THRESHOLD_SECONDS = 60;
const RECENT_THRESHOLD_SECONDS = 5 * 60;

const ONLINE_BADGE_COLORS: Record<LiveCourierOnlineBadge, string> = {
  online: "#34A853",
  recent: "#F2A93B",
  offline: "#9AA0A6",
  error: "#D93025",
};


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
export function getCourierMarkerColor(courierId: string): string {
  return getCourierMapColor(courierId);
}

export function getLiveCourierOnlineBadgeColor(
  badge: LiveCourierOnlineBadge,
): string {
  return ONLINE_BADGE_COLORS[badge];
}

function isErrorRecordStatus(status: CourierLocationStatus): boolean {
  return (
    status === "permission_denied" ||
    status === "unavailable" ||
    status === "error"
  );
}

function resolveOnlineBadge(
  record: CourierLocationRecord,
  ageSeconds: number,
): { badge: LiveCourierOnlineBadge; label: string } {
  if (isErrorRecordStatus(record.status)) {
    if (record.status === "permission_denied") {
      return { badge: "error", label: "Permission denied" };
    }

    if (record.status === "unavailable") {
      return { badge: "error", label: "Unavailable" };
    }

    return { badge: "error", label: "Error" };
  }

  if (ageSeconds < ONLINE_THRESHOLD_SECONDS) {
    return { badge: "online", label: "Online" };
  }

  if (ageSeconds < RECENT_THRESHOLD_SECONDS) {
    return { badge: "recent", label: "Recently online" };
  }

  return { badge: "offline", label: "Offline" };
}

function recordToMarker(
  record: CourierLocationRecord,
  nowMs: number,
): LiveCourierMapMarker | null {
  if (!Number.isFinite(record.latitude) || !Number.isFinite(record.longitude)) {
    return null;
  }

  const capturedMs = Date.parse(record.capturedAt);
  const ageSeconds = Number.isNaN(capturedMs)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, Math.floor((nowMs - capturedMs) / 1000));
  const { badge, label } = resolveOnlineBadge(record, ageSeconds);

  return {
    courierId: record.courierId,
    courierName: record.courierName,
    latitude: record.latitude,
    longitude: record.longitude,
    accuracy: record.accuracy,
    heading: record.heading,
    speed: record.speed,
    capturedAt: record.capturedAt,
    source: record.source,
    recordStatus: record.status,
    markerColor: getCourierMarkerColor(record.courierId),
    onlineBadge: badge,
    onlineBadgeLabel: label,
    ageSeconds,
  };
}

export function getVisibleCouriers(
  markers: LiveCourierMapMarker[],
): LiveCourierMapMarker[] {
  return markers.filter(
    (marker) =>
      Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude),
  );
}

export function groupCouriers(
  markers: LiveCourierMapMarker[],
): LiveCourierGroups {
  return {
    online: markers.filter((marker) => marker.onlineBadge === "online"),
    recent: markers.filter((marker) => marker.onlineBadge === "recent"),
    offline: markers.filter((marker) => marker.onlineBadge === "offline"),
    error: markers.filter((marker) => marker.onlineBadge === "error"),
  };
}

export function buildLiveCourierMapData(
  now: Date = new Date(),
): LiveCourierMapData {
  const nowMs = now.getTime();
  const markers = getAllCourierLocations()
    .map((record) => recordToMarker(record, nowMs))
    .filter((marker): marker is LiveCourierMapMarker => marker !== null)
    .sort((firstMarker, secondMarker) =>
      firstMarker.courierName.localeCompare(secondMarker.courierName, "ru"),
    );
  const visibleCouriers = getVisibleCouriers(markers);
  const groups = groupCouriers(visibleCouriers);

  return {
    markers,
    visibleCouriers,
    groups,
    summary: {
      total: visibleCouriers.length,
      online: groups.online.length,
      recent: groups.recent.length,
      offline: groups.offline.length,
      error: groups.error.length,
    },
  };
}

export function formatLiveCourierAge(ageSeconds: number): string {
  if (!Number.isFinite(ageSeconds)) {
    return "Unknown";
  }

  if (ageSeconds < 60) {
    return `${ageSeconds} sec ago`;
  }

  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

export function formatLiveCourierHeading(heading: number | null): string {
  if (heading === null || !Number.isFinite(heading)) {
    return "—";
  }

  return `${Math.round(heading)}°`;
}

export function formatLiveCourierSpeed(speed: number | null): string {
  if (speed === null || !Number.isFinite(speed)) {
    return "—";
  }

  const speedKmh = speed * 3.6;
  return `${speedKmh.toFixed(1)} km/h`;
}

export function formatLiveCourierAccuracy(accuracy: number | null): string {
  if (accuracy === null || !Number.isFinite(accuracy)) {
    return "—";
  }

  return `${Math.round(accuracy)} m`;
}
