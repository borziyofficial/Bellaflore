// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
export const UNASSIGNED_MAP_COLOR = "#9AA0A6";

export const COURIER_MAP_COLOR_BY_ID: Record<string, string> = {
  "courier-ahmad": "#E85D8A",
  "courier-ali": "#4A90D9",
  "courier-bekzod": "#6BBF59",
  "courier-muhammad": "#F2A93B",
};

export const COURIER_MAP_LEGEND = [
  { id: "courier-ahmad", label: "Ahmad", color: COURIER_MAP_COLOR_BY_ID["courier-ahmad"] },
  { id: "courier-ali", label: "Ali", color: COURIER_MAP_COLOR_BY_ID["courier-ali"] },
  { id: "courier-bekzod", label: "Bekzod", color: COURIER_MAP_COLOR_BY_ID["courier-bekzod"] },
  {
    id: "courier-muhammad",
    label: "Muhammad",
    color: COURIER_MAP_COLOR_BY_ID["courier-muhammad"],
  },
  { id: "unassigned", label: "Unassigned", color: UNASSIGNED_MAP_COLOR },
] as const;


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getCourierMapColor(
  courierId: string | null | undefined,
): string {
  if (!courierId?.trim()) {
    return UNASSIGNED_MAP_COLOR;
  }

  return COURIER_MAP_COLOR_BY_ID[courierId] ?? UNASSIGNED_MAP_COLOR;
}
