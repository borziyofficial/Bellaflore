// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: ETA foundation
// ==================================================
import { getCourierProfileById } from "@/components/courierIntelligence/courierAdminFoundation";
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryIntelligence/deliveryZoneBridge";
import type {
  DeliveryCoordinates,
  DeliveryDelayRisk,
  DeliveryEta,
  DeliveryPriority,
  DeliveryTask,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

const BASE_ETA_MINUTES = 35;
const AVERAGE_SPEED_KMH = 28;

function priorityBoost(priority: DeliveryPriority): number {
  switch (priority) {
    case "urgent":
      return -10;
    case "high":
      return -5;
    case "low":
      return 8;
    default:
      return 0;
  }
}

function zoneEtaBoost(zoneId: string | null): number {
  const zone = zoneId ? getDeliveryZoneCatalogEntry(zoneId) : null;
  if (!zone) {
    return 10;
  }

  if (zone.isBaseZone) {
    return 0;
  }

  return Math.min(25, zone.sortOrder * 4);
}

export function calculateCourierLoadImpact(courierId: string | null): number {
  if (!courierId) {
    return 0;
  }

  const courier = getCourierProfileById(courierId);
  if (!courier) {
    return 0;
  }

  const loadRatio = courier.activeOrderIds.length / Math.max(courier.capacityOrders, 1);
  return Math.round(loadRatio * 20);
}

export function calculateDeliveryEta(input: {
  coordinates: DeliveryCoordinates | null;
  courierId: string | null;
  deliveryZoneId: string | null;
  deliveryInterval: string;
  priority: DeliveryPriority;
  hub?: DeliveryCoordinates;
}): DeliveryEta {
  const factors: string[] = [];
  let etaMin = BASE_ETA_MINUTES;
  let confidence: DeliveryEta["confidence"] = "medium";

  const hub = input.hub ?? { latitude: 55.7558, longitude: 37.6176 };

  if (input.coordinates) {
    const distanceKm = calculateStraightLineDistanceKm(hub, input.coordinates);
    const travelMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
    etaMin += travelMinutes;
    factors.push(`Расстояние ~${distanceKm.toFixed(1)} км`);
    confidence = "high";
  } else {
    factors.push("Координаты не указаны — базовая оценка");
    confidence = "low";
  }

  const zoneBoost = zoneEtaBoost(input.deliveryZoneId);
  if (zoneBoost > 0) {
    etaMin += zoneBoost;
    factors.push("Удалённая зона доставки");
  }

  const loadImpact = calculateCourierLoadImpact(input.courierId);
  if (loadImpact > 0) {
    etaMin += loadImpact;
    factors.push("Загрузка курьера");
  }

  etaMin += priorityBoost(input.priority);
  if (input.priority === "urgent" || input.priority === "high") {
    factors.push("Приоритетный заказ");
  }

  if (input.deliveryInterval.includes("21:00")) {
    etaMin += 10;
    factors.push("Поздний интервал");
  }

  const estimatedMinutesMin = Math.max(20, etaMin - 8);
  const estimatedMinutesMax = etaMin + 12;

  return {
    estimatedMinutesMin,
    estimatedMinutesMax,
    estimatedArrivalLabel: `${estimatedMinutesMin}–${estimatedMinutesMax} мин`,
    calculatedAt: new Date().toISOString(),
    confidence,
    factors,
  };
}

export function predictDeliveryDelay(task: DeliveryTask): DeliveryDelayRisk {
  const eta = task.eta ?? calculateDeliveryEta({
    coordinates: task.coordinates,
    courierId: task.courierId,
    deliveryZoneId: task.deliveryZoneId,
    deliveryInterval: task.deliveryInterval,
    priority: task.priority,
  });

  const loadImpact = calculateCourierLoadImpact(task.courierId);
  let level: DeliveryDelayRisk["level"] = "low";
  const reasons = [...eta.factors];

  if (eta.estimatedMinutesMax >= 90 || loadImpact >= 15) {
    level = "high";
    reasons.push("Высокий прогноз времени доставки");
  } else if (eta.estimatedMinutesMax >= 60 || loadImpact >= 8) {
    level = "medium";
    reasons.push("Возможная задержка");
  }

  if (!task.courierId && task.status !== "delivered") {
    level = level === "low" ? "medium" : level;
    reasons.push("Курьер ещё не назначен");
  }

  return {
    level,
    delayMinutesEstimate: Math.max(0, eta.estimatedMinutesMax - 45),
    reasons,
    shouldNotify: level === "high" || level === "medium",
    shouldReschedule: level === "high",
  };
}

export function getExampleDeliveryEta(): DeliveryEta {
  return calculateDeliveryEta({
    coordinates: { latitude: 55.757, longitude: 37.615 },
    courierId: "courier-ali",
    deliveryZoneId: "7km",
    deliveryInterval: "14:00–16:00",
    priority: "high",
  });
}

export function getExampleDeliveryDelayRisk(): DeliveryDelayRisk {
  return predictDeliveryDelay({
    id: "DLV-BF-1001",
    orderId: "BF-1001",
    courierId: null,
    address: "Москва, ул. Тверская, 12",
    coordinates: { latitude: 55.757, longitude: 37.615 },
    deliveryZoneId: "28km",
    deliveryPriceRub: 2490,
    deliveryDate: "2026-06-25",
    deliveryInterval: "21:00–23:00",
    priority: "normal",
    status: "pending",
    eta: null,
    routePlanId: null,
    assignment: null,
    timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveredAt: null,
    cancelledAt: null,
  });
}
