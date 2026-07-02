// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: History engine
// ==================================================
import {
  getCustomerProfile,
  saveCustomerProfileState,
} from "@/components/customerIntelligence/customerProfileEngine";
import { readOrderCustomerSnapshot } from "@/components/customerIntelligence/orderCustomerBridge";
import type {
  CustomerHistory,
  CustomerHistoryEntry,
  CustomerProfile,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

function generateHistoryId(): string {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildCustomerHistoryFromOrders(
  customerId: string,
): CustomerHistoryEntry[] {
  const snapshot = readOrderCustomerSnapshot(customerId);

  return snapshot.orders.map((order) => ({
    id: generateHistoryId(),
    orderId: order.orderId,
    status: order.status,
    totalRub: order.totalRub,
    deliveryDate: order.deliveryDate,
    itemsSummary: order.itemsSummary,
    occurredAt: order.createdAt,
  }));
}

export function syncCustomerHistory(customerId: string): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const entries = buildCustomerHistoryFromOrders(customerId);
  const history: CustomerHistory = {
    entries,
    syncedAt: new Date().toISOString(),
  };

  return saveCustomerProfileState({ ...profile, history });
}

export function appendCustomerHistoryEntry(
  customerId: string,
  entry: Omit<CustomerHistoryEntry, "id">,
): CustomerProfile | null {
  const profile = getCustomerProfile(customerId);
  if (!profile) {
    return null;
  }

  const historyEntry: CustomerHistoryEntry = {
    ...entry,
    id: generateHistoryId(),
  };

  return saveCustomerProfileState({
    ...profile,
    history: {
      entries: [historyEntry, ...profile.history.entries],
      syncedAt: profile.history.syncedAt,
    },
  });
}
