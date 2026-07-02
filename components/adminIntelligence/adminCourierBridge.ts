// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Courier bridge (read-only)
// ==================================================
import { listCourierProfiles } from "@/components/courierIntelligence/courierAdminFoundation";

export type AdminCourierBridgeSummary = {
  totalCouriers: number;
  activeCouriers: number;
  blockedCouriers: number;
  availableCouriers: number;
  couriers: Array<{
    id: string;
    name: string;
    status: string;
    isBlocked: boolean;
    currentLoad: number;
    capacityOrders: number;
  }>;
  generatedAt: string;
};

export function buildAdminCourierSummary(limit = 8): AdminCourierBridgeSummary {
  const profiles = listCourierProfiles();

  const couriers = profiles.slice(0, limit).map((profile) => ({
    id: profile.id,
    name: profile.fullName,
    status: profile.status,
    isBlocked: profile.isBlocked,
    currentLoad: profile.activeOrderIds.length,
    capacityOrders: profile.capacityOrders,
  }));

  return {
    totalCouriers: profiles.length,
    activeCouriers: profiles.filter(
      (profile) => profile.status !== "offline" && !profile.isBlocked,
    ).length,
    blockedCouriers: profiles.filter((profile) => profile.isBlocked).length,
    availableCouriers: profiles.filter(
      (profile) =>
        profile.status === "available" &&
        !profile.isBlocked &&
        profile.activeOrderIds.length < profile.capacityOrders,
    ).length,
    couriers,
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminCourierAttentionCount(): number {
  const summary = buildAdminCourierSummary(0);
  return summary.blockedCouriers;
}
