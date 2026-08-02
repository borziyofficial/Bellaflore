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
      return "Не удалось автоматически проверить адрес. Уточните адрес или повторите попытку.";
    case "coordinates_missing":
      return "Адрес не определён";
    case "house_number_missing":
      return "Укажите номер дома";
    case "address_ambiguous":
      return "Адрес указан неточно — уточните его";
    case "unsupported_region":
      return "Доставка недоступна в этом районе";
    case "address_coordinate_mismatch":
      return "Адрес не соответствует найденным координатам";
    case "zone_not_detected":
      return "Не удалось определить зону доставки";
    case "outside_delivery_area":
      return "Доставка недоступна по этому адресу";
    case "road_distance_fallback":
      return "Точное расстояние недоступно — используется приблизительный расчёт";
    default:
      return "Не удалось проверить адрес доставки";
  }
}

export function getDeliveryValidationHeadline(
  status: DeliveryValidationStatus,
): string {
  switch (status) {
    case "VALID":
      return "Адрес проверен";
    case "WARNING":
      return "Уточните адрес";
    case "ERROR":
      return "Доставка недоступна";
    case "OUTSIDE_DELIVERY_AREA":
      return "Доставка недоступна";
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
