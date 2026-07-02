// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Delivery bridge (read-only)
// ==================================================
import { listDeliveryTasks } from "@/components/deliveryIntelligence/deliveryTaskEngine";
import { readOrderCustomerSnapshot } from "@/components/customerIntelligence/orderCustomerBridge";
import { getCustomerProfile } from "@/components/customerIntelligence/customerProfileEngine";

export function readDeliveryCustomerSnapshot(customerId: string) {
  const profile = getCustomerProfile(customerId);
  const orderSnapshot = readOrderCustomerSnapshot(customerId);
  const orderIds = new Set(orderSnapshot.orders.map((order) => order.orderId));

  const deliveries = listDeliveryTasks().filter((task) => orderIds.has(task.orderId));

  return {
    customerId,
    totalDeliveries: deliveries.length,
    completedDeliveries: deliveries.filter((task) => task.status === "delivered").length,
    preferredZones: profile?.preferences.preferredDeliveryZones ?? [],
    preferredTimes: profile?.preferences.preferredDeliveryTimes ?? [],
    generatedAt: new Date().toISOString(),
  };
}

export function buildDeliveryCustomerInsight(customerId: string) {
  const snapshot = readDeliveryCustomerSnapshot(customerId);

  return {
    deliveryReliability:
      snapshot.totalDeliveries > 0
        ? Math.round((snapshot.completedDeliveries / snapshot.totalDeliveries) * 100)
        : null,
    preferredZone: snapshot.preferredZones[0] ?? null,
  };
}
