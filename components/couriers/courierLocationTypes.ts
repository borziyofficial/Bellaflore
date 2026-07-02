// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Courier GPS location and tracking type definitions.
//
// Назначение (RU):
// Типы GPS-позиции и отслеживания курьеров.
// ==================================================
export type CourierLocationSource = "browser_geolocation" | "manual_mock";


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
export type CourierLocationStatus =
  | "active"
  | "unavailable"
  | "permission_denied"
  | "error";

export type CourierLocationRecord = {
  courierId: string;
  courierName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  capturedAt: string;
  source: CourierLocationSource;
  status: CourierLocationStatus;
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
export function getCourierLocationStatusLabel(
  status: CourierLocationStatus,
): string {
  switch (status) {
    case "active":
      return "Location active";
    case "unavailable":
      return "Unavailable";
    case "permission_denied":
      return "Permission denied";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function formatCourierLocationCoordinates(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
