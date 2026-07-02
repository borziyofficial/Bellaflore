// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN): Live address suggestions, normalization, and geocoder adapters.
//
// Назначение (RU): Подсказки адресов, нормализация и адаптеры геокодера.
// ==================================================
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import type {
  LiveAddressPreview,
  LiveAddressPreviewStatus,
} from "@/components/addressIntelligence/liveAddressPreviewTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createLiveAddressPreview(
  partial: Omit<LiveAddressPreview, "updatedAt">,
): LiveAddressPreview {
  return {
    ...partial,
    updatedAt: new Date().toISOString(),
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createIdleLiveAddressPreview(): LiveAddressPreview {
  return createLiveAddressPreview({
    selectedAddress: "",
    latitude: null,
    longitude: null,
    hasCoordinates: false,
    previewStatus: "idle",
  });
}

export function buildLiveAddressPreviewFromSuggestion(
  suggestion: AddressSuggestion,
): LiveAddressPreview {
  const hasCoordinates =
    typeof suggestion.latitude === "number" &&
    typeof suggestion.longitude === "number" &&
    Number.isFinite(suggestion.latitude) &&
    Number.isFinite(suggestion.longitude);

  if (hasCoordinates) {
    return createLiveAddressPreview({
      selectedAddress: suggestion.label.trim() || suggestion.fullAddress,
      latitude: suggestion.latitude ?? null,
      longitude: suggestion.longitude ?? null,
      hasCoordinates: true,
      previewStatus: "geocoded",
    });
  }

  return createLiveAddressPreview({
    selectedAddress: suggestion.label.trim() || suggestion.fullAddress,
    latitude: null,
    longitude: null,
    hasCoordinates: false,
    previewStatus: "no_coordinates",
  });
}

export function clearLiveAddressPreview(): LiveAddressPreview {
  return createIdleLiveAddressPreview();
}

export function getLiveAddressPreviewStatusMessage(
  previewStatus: LiveAddressPreviewStatus,
): string | null {
  switch (previewStatus) {
    case "geocoded":
      return "Адрес отображён на карте";
    case "no_coordinates":
      return "Адрес выбран, координаты уточняются";
    case "selected":
      return "Адрес выбран";
    case "error":
      return "Не удалось показать адрес на карте";
    case "idle":
    default:
      return null;
  }
}
