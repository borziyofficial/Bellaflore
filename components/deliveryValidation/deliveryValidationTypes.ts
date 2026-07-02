// ==================================================
// SECTION: DELIVERY VALIDATION
// РАЗДЕЛ: Валидация доставки
//
// Purpose (EN):
// Delivery address validation status and result type definitions.
//
// Назначение (RU):
// Типы статуса и результата валидации адреса доставки.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";

export const DELIVERY_VALIDATION_VERSION = "bellaflore_delivery_validation_v1";

export type DeliveryValidationStatus =
  | "VALID"
  | "WARNING"
  | "ERROR"
  | "OUTSIDE_DELIVERY_AREA"
  | "UNKNOWN";

export type DeliveryValidationIssueCode =
  | "address_empty"
  | "geocoding_pending"
  | "geocoder_failed"
  | "coordinates_missing"
  | "house_number_missing"
  | "address_ambiguous"
  | "unsupported_region"
  | "address_coordinate_mismatch"
  | "zone_not_detected"
  | "outside_delivery_area"
  | "road_distance_fallback";

export type DeliveryValidationIssue = {
  code: DeliveryValidationIssueCode;
  blocking: boolean;
  safeWarning: boolean;
};

export type DeliveryValidationInput = {
  address: string;
  geocoding: GeocodingResult;
  realZoneResult: RealDeliveryZoneResult;
};

export type DeliveryValidationResult = {
  status: DeliveryValidationStatus;
  validationWarnings: string[];
  validationErrors: string[];
  issueCodes: DeliveryValidationIssueCode[];
  validationVersion: string;
  validatedAt: string;
  canSubmitCheckout: boolean;
  headline: string;
  detail: string;
  geocodingProvider: string | null;
  detectionMode: string | null;
};

export type DeliveryValidationOrderFields = {
  validationStatus: DeliveryValidationStatus;
  validationWarnings: string[];
  validationVersion: string;
  validatedAt: string;
};
