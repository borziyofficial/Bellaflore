// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Live Delivery Experience
//
// Purpose (EN):
// Checkout UX phases for address → zone → price without changing the engine.
//
// Назначение (RU):
// Фазы UX checkout: адрес → зона → цена (без изменения engine).
// ==================================================
import type { LiveAddressPreview } from "@/components/addressIntelligence/liveAddressPreviewTypes";
import { getAvailableDeliveryIntervals } from "@/components/checkout/deliveryIntervals";
import { shouldShowCheckoutDeliveryMap } from "@/components/deliveryZones/deliveryZoneCheckoutLabels";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";

export type LiveDeliveryExperiencePhase =
  | "idle"
  | "geocoding"
  | "detecting_zone"
  | "calculating_price"
  | "ready"
  | "unavailable";

export type LiveDeliveryExperienceState = {
  phase: LiveDeliveryExperiencePhase;
  loadingMessage: string | null;
  isLoading: boolean;
  showCard: boolean;
};

export const LIVE_DELIVERY_LOADING_MESSAGES = {
  geocoding: "Рассчитываем доставку...",
  detectingZone: "Рассчитываем доставку...",
  calculatingPrice: "Рассчитываем доставку...",
} as const;

type ResolveLiveDeliveryExperienceParams = {
  address: string;
  zoneResult: RealDeliveryZoneResult;
  liveAddressPreview?: LiveAddressPreview | null;
  validationResult?: DeliveryValidationResult;
};

function hasResolvedCoordinates(
  zoneResult: RealDeliveryZoneResult,
  liveAddressPreview?: LiveAddressPreview | null,
): boolean {
  return shouldShowCheckoutDeliveryMap(zoneResult, liveAddressPreview);
}

export function resolveLiveDeliveryExperienceState({
  address,
  zoneResult,
  liveAddressPreview = null,
  validationResult,
}: ResolveLiveDeliveryExperienceParams): LiveDeliveryExperienceState {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return {
      phase: "idle",
      loadingMessage: null,
      isLoading: false,
      showCard: false,
    };
  }

  const hasCoordinates = hasResolvedCoordinates(zoneResult, liveAddressPreview);
  const isGeocodingPending =
    !hasCoordinates &&
    (liveAddressPreview?.previewStatus === "no_coordinates" ||
      liveAddressPreview?.previewStatus === "selected" ||
      (trimmedAddress.length > 0 && zoneResult.status === "unknown"));

  if (isGeocodingPending) {
    return {
      phase: "geocoding",
      loadingMessage: LIVE_DELIVERY_LOADING_MESSAGES.geocoding,
      isLoading: true,
      showCard: true,
    };
  }

  if (
    hasCoordinates &&
    zoneResult.status === "unknown" &&
    zoneResult.selectedZoneId === null
  ) {
    return {
      phase: "detecting_zone",
      loadingMessage: LIVE_DELIVERY_LOADING_MESSAGES.detectingZone,
      isLoading: true,
      showCard: true,
    };
  }

  if (
    zoneResult.selectedZoneId !== null &&
    zoneResult.deliveryPriceRub === null &&
    zoneResult.status !== "outside_delivery_area"
  ) {
    return {
      phase: "calculating_price",
      loadingMessage: LIVE_DELIVERY_LOADING_MESSAGES.calculatingPrice,
      isLoading: true,
      showCard: true,
    };
  }

  if (zoneResult.status === "outside_delivery_area") {
    return {
      phase: "unavailable",
      loadingMessage: null,
      isLoading: false,
      showCard: true,
    };
  }

  if (zoneResult.status === "available" && zoneResult.selectedZoneId !== null) {
    return {
      phase: "ready",
      loadingMessage: null,
      isLoading: false,
      showCard: true,
    };
  }

  const addressConfirmed =
    validationResult?.status === "VALID" ||
    validationResult?.status === "WARNING";

  if (addressConfirmed || hasCoordinates) {
    return {
      phase: "detecting_zone",
      loadingMessage: LIVE_DELIVERY_LOADING_MESSAGES.detectingZone,
      isLoading: true,
      showCard: true,
    };
  }

  return {
    phase: "idle",
    loadingMessage: null,
    isLoading: false,
    showCard: false,
  };
}

export function resolveNearestDeliveryIntervalLabel(params: {
  deliveryTime: string;
  deliveryDate: string;
  nearestFromConfidence: string | null;
  now: Date;
}): string | null {
  if (params.deliveryTime.trim()) {
    return params.deliveryTime.trim();
  }

  if (params.nearestFromConfidence) {
    return params.nearestFromConfidence;
  }

  const todayValue = `${params.now.getFullYear()}-${String(params.now.getMonth() + 1).padStart(2, "0")}-${String(params.now.getDate()).padStart(2, "0")}`;
  const dateForIntervals = params.deliveryDate.trim() || todayValue;
  const intervals = getAvailableDeliveryIntervals(dateForIntervals, params.now);

  return intervals[0]?.label ?? null;
}
