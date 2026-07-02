// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Courier bridge (read-only)
// ==================================================
import { buildAdminCourierSummary } from "@/components/adminIntelligence/adminCourierBridge";

export type AiCourierBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminCourierSummary>;
  overloadedCourierIds: string[];
  availableCourierIds: string[];
  generatedAt: string;
};

export function readAiCourierSnapshot(): AiCourierBridgeSnapshot {
  const summary = buildAdminCourierSummary(12);

  const overloadedCourierIds = summary.couriers
    .filter(
      (courier) =>
        !courier.isBlocked &&
        courier.currentLoad >= courier.capacityOrders &&
        courier.capacityOrders > 0,
    )
    .map((courier) => courier.id);

  const availableCourierIds = summary.couriers
    .filter(
      (courier) =>
        courier.status === "available" &&
        !courier.isBlocked &&
        courier.currentLoad < courier.capacityOrders,
    )
    .map((courier) => courier.id);

  return {
    summary,
    overloadedCourierIds,
    availableCourierIds,
    generatedAt: new Date().toISOString(),
  };
}
