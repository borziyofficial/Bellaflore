// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
const MOSCOW_ADDRESS_PATTERN = /(moscow|москва)/i;
const FULLY_QUALIFIED_ADDRESS_PATTERN =
  /^(россия|russia|беларусь|belarus|казахстан|kazakhstan)\b/i;

// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Detect fully qualified Yandex geocoder values (country-prefixed addresses).
//
// Назначение (RU):
// Определяет полные значения Yandex (адреса с указанием страны).
// ==================================================
export function isFullyQualifiedYandexAddress(address: string): boolean {
  const normalizedAddress = normalizeGeocodingAddress(address);
  if (!normalizedAddress) {
    return false;
  }

  if (FULLY_QUALIFIED_ADDRESS_PATTERN.test(normalizedAddress)) {
    return true;
  }

  const commaCount = (normalizedAddress.match(/,/g) ?? []).length;
  return commaCount >= 2;
}

export function normalizeGeocodingAddress(address: string): string {
  return address.trim().replace(/\s+/g, " ");
}

export function normalizeAddressForYandexGeocoding(address: string): string {
  const normalizedAddress = normalizeGeocodingAddress(address);

  if (!normalizedAddress) {
    return "";
  }

  if (
    MOSCOW_ADDRESS_PATTERN.test(normalizedAddress) ||
    isFullyQualifiedYandexAddress(normalizedAddress)
  ) {
    return normalizedAddress;
  }

  return `Москва, ${normalizedAddress}`;
}
