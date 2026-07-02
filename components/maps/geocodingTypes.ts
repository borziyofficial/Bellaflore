// ==================================================
// SECTION: GEOCODING TYPES
// РАЗДЕЛ: Типы геокодирования
//
// Purpose (EN):
// Geocoding status, result, and coordinate type definitions.
//
// Назначение (RU):
// Определения типов статуса, результата и координат геокодирования.
// ==================================================
export type GeocodingStatus = "pending" | "found" | "not_found" | "error";

export type GeocodingResult = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  confidence: number | null;
  provider: string;
  status: GeocodingStatus;
  updatedAt: string;
  fromCache?: boolean;
};

export type GeocodingCoordinates = {
  latitude: number;
  longitude: number;
};
