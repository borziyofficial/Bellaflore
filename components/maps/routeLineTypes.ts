// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for maps.
//
// Назначение (RU): Определения типов для maps.
// ==================================================
export type RouteLineStatus = "ready" | "incomplete" | "empty";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type RouteLinePoint = {
  orderId: string;
  latitude: number;
  longitude: number;
};

export type CourierRouteLine = {
  courierId: string;
  courierName: string;
  color: string;
  points: RouteLinePoint[];
  orderIds: string[];
  missingCoordinateOrderIds: string[];
  status: RouteLineStatus;
};

export type RouteLineCourierFilter =
  | "all"
  | "courier-ahmad"
  | "courier-ali"
  | "courier-bekzod"
  | "courier-muhammad"
  | "unassigned";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getRouteLineStatusLabel(status: RouteLineStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "incomplete":
      return "Incomplete";
    case "empty":
      return "Empty";
    default:
      return status;
  }
}
