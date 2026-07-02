// ==================================================
// SECTION: DELIVERY VALIDATION
// РАЗДЕЛ: Валидация доставки
//
// Purpose (EN):
// Orchestrates delivery validation rules into checkout-ready results.
//
// Назначение (RU):
// Оркестрация правил валидации доставки для оформления заказа.
// ==================================================
import {
  DELIVERY_VALIDATION_VERSION,
  type DeliveryValidationInput,
  type DeliveryValidationIssueCode,
  type DeliveryValidationOrderFields,
  type DeliveryValidationResult,
  type DeliveryValidationStatus,
} from "@/components/deliveryValidation/deliveryValidationTypes";
import {
  getDeliveryValidationHeadline,
  getDeliveryValidationIssueMessage,
} from "@/components/deliveryValidation/deliveryValidationMessages";
import { runDeliveryValidationRules } from "@/components/deliveryValidation/deliveryValidationRules";
import { geocodeAddress } from "@/components/maps/geocodeAddress";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function resolveValidationStatus(
  issueCodes: DeliveryValidationIssueCode[],
): DeliveryValidationStatus {
  if (issueCodes.length === 0) {
    return "VALID";
  }

  if (issueCodes.includes("outside_delivery_area")) {
    return "OUTSIDE_DELIVERY_AREA";
  }

  if (
    issueCodes.includes("geocoding_pending") ||
    issueCodes.includes("address_empty")
  ) {
    return "UNKNOWN";
  }

  const blockingIssues = issueCodes.filter(
    (code) => code !== "road_distance_fallback",
  );

  if (blockingIssues.length === 0) {
    return issueCodes.includes("road_distance_fallback") ? "WARNING" : "VALID";
  }

  if (
    blockingIssues.length === 1 &&
    blockingIssues[0] === "address_ambiguous"
  ) {
    return "WARNING";
  }

  return "ERROR";
}

function resolveCanSubmitCheckout(
  status: DeliveryValidationStatus,
  issueCodes: DeliveryValidationIssueCode[],
): boolean {
  if (status === "VALID") {
    return true;
  }

  if (status === "WARNING") {
    const blockingCodes = issueCodes.filter(
      (code) => code !== "road_distance_fallback",
    );

    if (blockingCodes.length === 0) {
      return true;
    }

    return false;
  }

  return false;
}

function buildValidationDetail(
  status: DeliveryValidationStatus,
  warnings: string[],
  errors: string[],
): string {
  if (status === "VALID") {
    return "Address verified for delivery.";
  }

  if (errors.length > 0) {
    return errors[0] ?? "";
  }

  if (warnings.length > 0) {
    return warnings[0] ?? "";
  }

  return getDeliveryValidationHeadline(status);
}


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
export function validateDeliveryAddress(
  input: DeliveryValidationInput,
): DeliveryValidationResult {
  const validatedAt = new Date().toISOString();
  const issues = runDeliveryValidationRules(input);
  const issueCodes = issues.map((issue) => issue.code);
  const status = resolveValidationStatus(issueCodes);

  const validationWarnings = issues
    .filter((issue) => issue.safeWarning)
    .map((issue) => getDeliveryValidationIssueMessage(issue.code));

  const validationErrors = issues
    .filter((issue) => issue.blocking && !issue.safeWarning)
    .map((issue) => getDeliveryValidationIssueMessage(issue.code));

  const canSubmitCheckout = resolveCanSubmitCheckout(status, issueCodes);

  return {
    status,
    validationWarnings,
    validationErrors,
    issueCodes,
    validationVersion: DELIVERY_VALIDATION_VERSION,
    validatedAt,
    canSubmitCheckout,
    headline: getDeliveryValidationHeadline(status),
    detail: buildValidationDetail(status, validationWarnings, validationErrors),
    geocodingProvider: input.geocoding.provider ?? null,
    detectionMode: input.realZoneResult.detectionMode ?? null,
  };
}

export function resolveDeliveryValidationForCheckout(
  address: string,
  realZoneResult: RealDeliveryZoneResult,
): DeliveryValidationResult {
  return validateDeliveryAddress({
    address,
    geocoding: geocodeAddress(address),
    realZoneResult,
  });
}

export function canSubmitCheckoutWithDeliveryValidation(
  validationResult: DeliveryValidationResult,
): boolean {
  return validationResult.canSubmitCheckout;
}

export function buildDeliveryValidationOrderFields(
  validationResult: DeliveryValidationResult,
): DeliveryValidationOrderFields {
  return {
    validationStatus: validationResult.status,
    validationWarnings: validationResult.validationWarnings,
    validationVersion: validationResult.validationVersion,
    validatedAt: validationResult.validatedAt,
  };
}

export function getDeliveryValidationUnavailableMessage(
  validationResult: DeliveryValidationResult,
): string | null {
  if (validationResult.canSubmitCheckout) {
    return null;
  }

  if (validationResult.validationErrors.length > 0) {
    return validationResult.validationErrors[0] ?? null;
  }

  return validationResult.detail || validationResult.headline;
}
