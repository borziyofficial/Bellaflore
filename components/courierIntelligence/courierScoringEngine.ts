// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Assignment scoring engine
// ==================================================
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import type {
  CourierAssignmentCandidate,
  CourierAssignmentPriority,
  CourierAssignmentRequest,
  CourierProfile,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

const PRIORITY_WEIGHT: Record<CourierAssignmentPriority, number> = {
  low: 0,
  normal: 8,
  high: 16,
  urgent: 24,
};

function isWithinWorkingHours(
  profile: CourierProfile,
  now: Date = new Date(),
): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (
    minutes >= profile.workingHours.startMinutes &&
    minutes <= profile.workingHours.endMinutes
  );
}

function scoreDistance(distanceKm: number | null): number {
  if (distanceKm === null) {
    return 8;
  }

  if (distanceKm <= 3) {
    return 30;
  }

  if (distanceKm <= 7) {
    return 22;
  }

  if (distanceKm <= 12) {
    return 12;
  }

  return 4;
}

function scoreLoad(profile: CourierProfile): number {
  const loadRatio = profile.activeOrderIds.length / Math.max(profile.capacityOrders, 1);

  if (loadRatio >= 1) {
    return 0;
  }

  if (loadRatio >= 0.75) {
    return 8;
  }

  if (loadRatio >= 0.5) {
    return 16;
  }

  return 24;
}

function scoreZone(
  profile: CourierProfile,
  zoneId?: string | null,
): { score: number; reason?: string } {
  if (!zoneId) {
    return { score: 10 };
  }

  if (profile.supportedZoneIds.includes(zoneId)) {
    return { score: 18, reason: "Работает в зоне доставки" };
  }

  return { score: 0, reason: "Зона не поддерживается" };
}

export function scoreCourierForAssignment(
  profile: CourierProfile,
  request: CourierAssignmentRequest,
  now: Date = new Date(),
): CourierAssignmentCandidate | null {
  const reasons: string[] = [];
  let score = profile.priorityScore;

  if (profile.isBlocked) {
    return null;
  }

  if (profile.status === "offline" || profile.status === "resting") {
    return null;
  }

  if (!isWithinWorkingHours(profile, now)) {
    return null;
  }

  if (profile.activeOrderIds.length >= profile.capacityOrders) {
    return null;
  }

  let distanceKm: number | null = null;

  if (
    profile.currentLocation &&
    request.latitude != null &&
    request.longitude != null
  ) {
    distanceKm = calculateStraightLineDistanceKm(
      {
        latitude: profile.currentLocation.latitude,
        longitude: profile.currentLocation.longitude,
      },
      {
        latitude: request.latitude,
        longitude: request.longitude,
      },
    );
    reasons.push(`Расстояние ~${distanceKm.toFixed(1)} км`);
  }

  const distanceScore = scoreDistance(distanceKm);
  const loadScore = scoreLoad(profile);
  const zoneResult = scoreZone(profile, request.zoneId);
  const priorityBoost = PRIORITY_WEIGHT[request.priority ?? "normal"];

  score += distanceScore + loadScore + zoneResult.score + priorityBoost;

  if (zoneResult.reason) {
    reasons.push(zoneResult.reason);
  }

  if (loadScore >= 16) {
    reasons.push("Низкая текущая загрузка");
  }

  if (profile.status === "available") {
    score += 10;
    reasons.push("Курьер свободен");
  } else if (profile.status === "busy") {
    score += 4;
    reasons.push("Курьер занят, но вмещает заказ");
  }

  if (priorityBoost > 0) {
    reasons.push(`Приоритет заказа: ${request.priority}`);
  }

  return {
    courier: profile,
    score,
    distanceKm,
    currentLoad: profile.activeOrderIds.length,
    reasons,
  };
}

export function rankCourierCandidates(
  candidates: CourierAssignmentCandidate[],
): CourierAssignmentCandidate[] {
  return [...candidates].sort((left, right) => right.score - left.score);
}
