// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Confirms a selected Yandex suggestion via official geocoder and caches coordinates.
//
// Назначение (RU):
// Подтверждает выбранную подсказку Yandex через официальный геокодер и сохраняет координаты.
// ==================================================
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import { writeGeocodingCacheEntry } from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";
import type { GeocodingResult } from "@/components/maps/geocodingTypes";
import { geocodeAddressYandexFromValue } from "@/components/maps/yandexGeocoder";

export async function confirmMapPointSelection(
  latitude: number,
  longitude: number,
  address: string,
): Promise<void> {
  const addressKey = normalizeGeocodingAddress(address);

  if (!addressKey) {
    return;
  }

  const geocodingResult: GeocodingResult = {
    address,
    latitude,
    longitude,
    confidence: 0.9,
    provider: "yandex",
    status: "found",
    updatedAt: new Date().toISOString(),
  };

  writeGeocodingCacheEntry(addressKey, geocodingResult);
}

export function cacheGeocodingFromAddressSuggestion(
  suggestion: AddressSuggestion,
): void {
  const latitude = suggestion.latitude;
  const longitude = suggestion.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }

  const addressKey = normalizeGeocodingAddress(suggestion.fullAddress);

  if (!addressKey) {
    return;
  }

  const geocodingResult: GeocodingResult = {
    address: suggestion.fullAddress,
    latitude,
    longitude,
    confidence: suggestion.confidence ?? 0.92,
    provider: suggestion.source === "geocoder" ? "yandex" : "fallback",
    status: "found",
    updatedAt: new Date().toISOString(),
  };

  writeGeocodingCacheEntry(addressKey, geocodingResult);

  const labelKey = normalizeGeocodingAddress(suggestion.label);
  if (labelKey && labelKey !== addressKey) {
    writeGeocodingCacheEntry(labelKey, geocodingResult);
  }
}

async function enrichSuggestionWithYandexCoordinates(
  suggestion: AddressSuggestion,
): Promise<AddressSuggestion> {
  const hasCoordinates =
    typeof suggestion.latitude === "number" &&
    typeof suggestion.longitude === "number" &&
    Number.isFinite(suggestion.latitude) &&
    Number.isFinite(suggestion.longitude);

  if (hasCoordinates) {
    return suggestion;
  }

  const geocodeQuery = suggestion.fullAddress;

  const geocodingResult = await geocodeAddressYandexFromValue(
    geocodeQuery,
    suggestion.yandexUri ? { uri: suggestion.yandexUri } : undefined,
  );

  if (
    geocodingResult.status !== "found" ||
    geocodingResult.latitude === null ||
    geocodingResult.longitude === null
  ) {
    return suggestion;
  }

  return {
    ...suggestion,
    latitude: geocodingResult.latitude,
    longitude: geocodingResult.longitude,
    confidence: geocodingResult.confidence ?? suggestion.confidence,
    source: "geocoder",
  };
}

export async function confirmAddressSuggestionSelection(
  suggestion: AddressSuggestion,
): Promise<AddressSuggestion> {
  const confirmedSuggestion = await enrichSuggestionWithYandexCoordinates(
    suggestion,
  );

  cacheGeocodingFromAddressSuggestion(confirmedSuggestion);

  return confirmedSuggestion;
}
