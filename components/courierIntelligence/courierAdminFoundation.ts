// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Admin foundation
// ==================================================
import {
  blockCourierInAdmin,
  mergeCourierProfilesWithAdmin,
  unblockCourierInAdmin,
} from "@/components/courierIntelligence/courierAdminStore";
import {
  appendCourierTimelineEvent,
  createCourierTimelineEvent,
  listCourierTimelineEvents,
} from "@/components/courierIntelligence/courierTimelineEngine";
import type {
  CourierProfile,
  CourierStatsSnapshot,
  ManualCourierAssignmentResult,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

let assignmentRegistry = new Map<string, string>();

export function listCourierProfiles(): CourierProfile[] {
  return mergeCourierProfilesWithAdmin();
}

export function getCourierProfileById(courierId: string): CourierProfile | null {
  return listCourierProfiles().find((profile) => profile.id === courierId) ?? null;
}

export function assignCourierManually(
  orderId: string,
  courierId: string,
): ManualCourierAssignmentResult {
  const courier = getCourierProfileById(courierId);

  if (!courier) {
    return {
      ok: false,
      courierId,
      orderId,
      message: "Курьер не найден",
    };
  }

  if (courier.isBlocked) {
    return {
      ok: false,
      courierId,
      orderId,
      message: "Курьер заблокирован",
    };
  }

  if (courier.activeOrderIds.length >= courier.capacityOrders) {
    return {
      ok: false,
      courierId,
      orderId,
      message: "Курьер перегружен",
    };
  }

  assignmentRegistry.set(orderId, courierId);
  const timelineEvent = appendCourierTimelineEvent(
    createCourierTimelineEvent({
      courierId,
      orderId,
      kind: "assigned",
      message: `Курьер ${courier.fullName} назначен на заказ ${orderId}`,
      actorType: "admin",
      actorName: "Admin",
    }),
  );

  return {
    ok: true,
    courierId,
    orderId,
    message: `Курьер ${courier.fullName} назначен`,
    timelineEvent,
  };
}

export function reassignCourier(
  orderId: string,
  nextCourierId: string,
): ManualCourierAssignmentResult {
  const previousCourierId = assignmentRegistry.get(orderId);

  if (previousCourierId) {
    appendCourierTimelineEvent(
      createCourierTimelineEvent({
        courierId: previousCourierId,
        orderId,
        kind: "reassigned",
        message: `Курьер снят с заказа ${orderId} для переназначения`,
        actorType: "admin",
        actorName: "Admin",
      }),
    );
  }

  const result = assignCourierManually(orderId, nextCourierId);

  if (result.ok) {
    appendCourierTimelineEvent(
      createCourierTimelineEvent({
        courierId: nextCourierId,
        orderId,
        kind: "reassigned",
        message: `Заказ ${orderId} переназначен`,
        actorType: "admin",
        actorName: "Admin",
      }),
    );
  }

  return result;
}

export function unassignCourierFromOrder(orderId: string): ManualCourierAssignmentResult {
  const courierId = assignmentRegistry.get(orderId);

  if (!courierId) {
    return {
      ok: false,
      courierId: "",
      orderId,
      message: "На заказ не назначен курьер",
    };
  }

  assignmentRegistry.delete(orderId);

  const timelineEvent = appendCourierTimelineEvent(
    createCourierTimelineEvent({
      courierId,
      orderId,
      kind: "unassigned",
      message: `Курьер снят с заказа ${orderId}`,
      actorType: "admin",
      actorName: "Admin",
    }),
  );

  return {
    ok: true,
    courierId,
    orderId,
    message: "Курьер снят с заказа",
    timelineEvent,
  };
}

export function blockCourier(courierId: string): CourierProfile | null {
  blockCourierInAdmin(courierId);
  return getCourierProfileById(courierId);
}

export function unblockCourier(courierId: string): CourierProfile | null {
  unblockCourierInAdmin(courierId);
  return getCourierProfileById(courierId);
}

export function getCourierStats(courierId: string): CourierStatsSnapshot | null {
  const courier = getCourierProfileById(courierId);
  if (!courier) {
    return null;
  }

  const timeline = listCourierTimelineEvents(courierId);
  const deliveredCount = timeline.filter((event) => event.kind === "delivered").length;
  const cancelledCount = timeline.filter((event) => event.kind === "cancelled").length;

  return {
    courierId,
    fullName: courier.fullName,
    deliveredCount,
    activeCount: courier.activeOrderIds.length,
    cancelledCount,
    averageEtaMinutes: null,
    onTimeRate: null,
  };
}

export function readCourierAssignmentRegistry(): Record<string, string> {
  return Object.fromEntries(assignmentRegistry.entries());
}

export function clearCourierAssignmentRegistry(): void {
  assignmentRegistry = new Map();
}
