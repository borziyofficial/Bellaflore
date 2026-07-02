// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Delivery Intelligence
//
// Purpose (EN): Types for coordinate → zone → price → status pipeline.
//
// Назначение (RU): Типы цепочки координаты → зона → цена → статус.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { RealDeliveryZoneStatus } from "@/components/deliveryZones/realDeliveryZoneTypes";

export type DeliveryIntelligenceDetectionMethod = "polygon" | "distance";

export type AddressCoordinates = {
  latitude: number;
  longitude: number;
};

export type DeliveryIntelligenceResult = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  zoneId: DeliveryZoneId | null;
  zoneTitle: string | null;
  zoneLabel: string | null;
  deliveryPriceRub: number | null;
  estimatedTime: string | null;
  deliveryStatus: RealDeliveryZoneStatus;
  message: string;
  addressConfirmed: boolean;
  detectionMethod: DeliveryIntelligenceDetectionMethod;
};
