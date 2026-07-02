// ==================================================
// SECTION: DELIVERY VALIDATION
// РАЗДЕЛ: Валидация доставки
//
// Purpose (EN):
// User-facing validation headlines and issue message strings.
//
// Назначение (RU):
// Заголовки и сообщения об ошибках валидации для пользователя.
// ==================================================
import type {
  DeliveryValidationIssueCode,
  DeliveryValidationStatus,
} from "@/components/deliveryValidation/deliveryValidationTypes";


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
export function getDeliveryValidationIssueMessage(
  code: DeliveryValidationIssueCode,
): string {
  switch (code) {
    case "address_empty":
      return "Укажите адрес доставки";
    case "geocoding_pending":
      return "Проверяем адрес…";
    case "geocoder_failed":
      return "Geocoder failed";
    case "coordinates_missing":
      return "Адрес не определён";
    case "house_number_missing":
      return "Missing house number";
    case "address_ambiguous":
      return "Multiple address matches";
    case "unsupported_region":
      return "Unsupported area";
    case "address_coordinate_mismatch":
      return "Address does not match geocoder coordinates";
    case "zone_not_detected":
      return "Zone not detected";
    case "outside_delivery_area":
      return "Delivery unavailable";
    case "road_distance_fallback":
      return "Road distance unavailable — using approximate distance";
    default:
      return "Address validation issue";
  }
}

export function getDeliveryValidationHeadline(
  status: DeliveryValidationStatus,
): string {
  switch (status) {
    case "VALID":
      return "Address verified";
    case "WARNING":
      return "Address requires clarification";
    case "ERROR":
      return "Delivery unavailable";
    case "OUTSIDE_DELIVERY_AREA":
      return "Delivery unavailable";
    case "UNKNOWN":
    default:
      return "Адрес не определён";
  }
}

export function getDeliveryValidationStatusIcon(
  status: DeliveryValidationStatus,
): string {
  switch (status) {
    case "VALID":
      return "✔";
    case "WARNING":
      return "⚠";
    case "ERROR":
    case "OUTSIDE_DELIVERY_AREA":
      return "❌";
    case "UNKNOWN":
    default:
      return "…";
  }
}

export function getDeliveryValidationStatusLabel(
  status: DeliveryValidationStatus,
): string {
  switch (status) {
    case "VALID":
      return "Verified";
    case "WARNING":
      return "Warning";
    case "ERROR":
      return "Error";
    case "OUTSIDE_DELIVERY_AREA":
      return "Outside delivery area";
    case "UNKNOWN":
    default:
      return "Unknown";
  }
}

export function getTelegramValidationLine(
  status: DeliveryValidationStatus | undefined,
): string {
  const label = status
    ? getDeliveryValidationStatusLabel(status)
    : "Unknown";

  return `Validation:\n${label}`;
}
