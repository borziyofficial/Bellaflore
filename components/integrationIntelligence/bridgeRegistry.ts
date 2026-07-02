// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Bridge registry
// ==================================================
import { buildIntegrationExampleRegistryState } from "@/components/integrationIntelligence/integrationExamples";
import type {
  BridgeKind,
  BridgeListFilters,
  BridgeStatus,
  IntegrationBridge,
} from "@/components/integrationIntelligence/integrationTypes";

export const INTEGRATION_BRIDGE_STORAGE_KEY =
  "bellaflore_integration_intelligence_bridge_v1";

let inMemoryBridges: IntegrationBridge[] | null = null;

function readBridgesFromStorage(): IntegrationBridge[] {
  if (typeof window === "undefined") {
    return inMemoryBridges ?? buildIntegrationExampleRegistryState().bridges;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_BRIDGE_STORAGE_KEY);
    if (!raw) {
      return inMemoryBridges ?? buildIntegrationExampleRegistryState().bridges;
    }

    const parsed = JSON.parse(raw) as IntegrationBridge[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildIntegrationExampleRegistryState().bridges;
  } catch {
    return inMemoryBridges ?? buildIntegrationExampleRegistryState().bridges;
  }
}

function writeBridgesToStorage(bridges: IntegrationBridge[]): void {
  inMemoryBridges = bridges;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_BRIDGE_STORAGE_KEY, JSON.stringify(bridges));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesBridgeFilters(bridge: IntegrationBridge, filters: BridgeListFilters): boolean {
  if (filters.kind && bridge.kind !== filters.kind) {
    return false;
  }

  if (filters.status && bridge.status !== filters.status) {
    return false;
  }

  if (filters.wired !== undefined && bridge.wired !== filters.wired) {
    return false;
  }

  return true;
}

export function listBridges(filters: BridgeListFilters = {}): IntegrationBridge[] {
  return readBridgesFromStorage()
    .filter((b) => matchesBridgeFilters(b, filters))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

export function getBridgeById(bridgeId: string): IntegrationBridge | null {
  return readBridgesFromStorage().find((b) => b.id === bridgeId) ?? null;
}

export function getBridgeByKind(kind: BridgeKind): IntegrationBridge | null {
  return readBridgesFromStorage().find((b) => b.kind === kind) ?? null;
}

export function listActiveBridges(): IntegrationBridge[] {
  return listBridges({ status: "active" });
}

export function listPendingBridges(): IntegrationBridge[] {
  return listBridges({ status: "pending" });
}

export function listWiredBridges(): IntegrationBridge[] {
  return listBridges({ wired: true });
}

export function listUnwiredBridges(): IntegrationBridge[] {
  return listBridges({ wired: false });
}

export function listBridgesByStatus(status: BridgeStatus): IntegrationBridge[] {
  return listBridges({ status });
}

export function getCrmBridge(): IntegrationBridge | null {
  return getBridgeByKind("crm");
}

export function getOrderBridge(): IntegrationBridge | null {
  return getBridgeByKind("order");
}

export function getCheckoutBridge(): IntegrationBridge | null {
  return getBridgeByKind("checkout");
}

export function getTelegramBridge(): IntegrationBridge | null {
  return getBridgeByKind("telegram");
}

export function getPaymentBridge(): IntegrationBridge | null {
  return getBridgeByKind("payment");
}

export function getInventoryBridge(): IntegrationBridge | null {
  return getBridgeByKind("inventory");
}

export function getCourierBridge(): IntegrationBridge | null {
  return getBridgeByKind("courier");
}

export function getDeliveryBridge(): IntegrationBridge | null {
  return getBridgeByKind("delivery");
}

export function getAnalyticsBridge(): IntegrationBridge | null {
  return getBridgeByKind("analytics");
}

export function getAiBridge(): IntegrationBridge | null {
  return getBridgeByKind("ai");
}

export function registerBridge(bridge: IntegrationBridge): IntegrationBridge {
  const bridges = readBridgesFromStorage();
  const index = bridges.findIndex((b) => b.id === bridge.id);
  const next =
    index === -1
      ? [...bridges, bridge]
      : bridges.map((b, i) => (i === index ? bridge : b));

  writeBridgesToStorage(next);
  return bridge;
}

export function seedBridgeRegistry(): IntegrationBridge[] {
  writeBridgesToStorage(buildIntegrationExampleRegistryState().bridges);
  return listBridges();
}

export function clearBridgeRegistry(): void {
  writeBridgesToStorage([]);
}

export function buildBridgeRegistrySummary() {
  const bridges = listBridges();

  return {
    bridges,
    crmBridge: getCrmBridge(),
    orderBridge: getOrderBridge(),
    checkoutBridge: getCheckoutBridge(),
    telegramBridge: getTelegramBridge(),
    paymentBridge: getPaymentBridge(),
    inventoryBridge: getInventoryBridge(),
    courierBridge: getCourierBridge(),
    deliveryBridge: getDeliveryBridge(),
    analyticsBridge: getAnalyticsBridge(),
    aiBridge: getAiBridge(),
    totalCount: bridges.length,
    wiredCount: listWiredBridges().length,
    generatedAt: new Date().toISOString(),
  };
}
