// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import {
  buildBridgeRegistrySummary,
  listBridges,
  seedBridgeRegistry,
} from "@/components/integrationIntelligence/bridgeRegistry";
import { buildIntegrationExampleRegistryState } from "@/components/integrationIntelligence/integrationExamples";
import {
  buildIntegrationHealthReport,
  calculateIntegrationStatistics,
  listFutureConnectors,
  listIntegrationHealth,
  seedIntegrationMetrics,
} from "@/components/integrationIntelligence/integrationMetrics";
import {
  listExternalApis,
  listWebhooks,
  seedIntegrationRegistry,
} from "@/components/integrationIntelligence/integrationRegistry";
import {
  buildSyncQueueSummary,
  listRetryQueue,
  listSyncQueue,
  seedSyncEngine,
} from "@/components/integrationIntelligence/syncEngine";
import type {
  IntegrationIntelligenceSnapshot,
  IntegrationReadOnlySummary,
} from "@/components/integrationIntelligence/integrationTypes";

export const INTEGRATION_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_integration_intelligence_v1";

export function buildIntegrationIntelligenceSnapshot(
  at: Date = new Date(),
): IntegrationIntelligenceSnapshot {
  return {
    bridges: listBridges(),
    externalApis: listExternalApis(),
    webhooks: listWebhooks(),
    syncQueue: listSyncQueue(),
    retryQueue: listRetryQueue(),
    health: listIntegrationHealth(),
    futureConnectors: listFutureConnectors(),
    statistics: calculateIntegrationStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeIntegrationIntelligence(): IntegrationIntelligenceSnapshot {
  seedBridgeRegistry();
  seedIntegrationRegistry();
  seedSyncEngine();
  seedIntegrationMetrics();
  return buildIntegrationIntelligenceSnapshot();
}

export function getIntegrationIntelligenceExample() {
  return buildIntegrationExampleRegistryState().bridges[0];
}

export function getIntegrationReadOnlySummary(): IntegrationReadOnlySummary {
  const statistics = calculateIntegrationStatistics();

  return {
    bridgeCount: statistics.totalBridges,
    activeBridgeCount: statistics.activeBridges,
    wiredBridgeCount: statistics.wiredBridges,
    pendingSyncCount: statistics.syncQueuePending,
    healthLevel: statistics.healthLevel,
  };
}

export function readIntegrationFoundationCapabilities() {
  return {
    crmBridge: buildBridgeRegistrySummary().crmBridge,
    orderBridge: buildBridgeRegistrySummary().orderBridge,
    checkoutBridge: buildBridgeRegistrySummary().checkoutBridge,
    telegramBridge: buildBridgeRegistrySummary().telegramBridge,
    paymentBridge: buildBridgeRegistrySummary().paymentBridge,
    inventoryBridge: buildBridgeRegistrySummary().inventoryBridge,
    courierBridge: buildBridgeRegistrySummary().courierBridge,
    deliveryBridge: buildBridgeRegistrySummary().deliveryBridge,
    analyticsBridge: buildBridgeRegistrySummary().analyticsBridge,
    aiBridge: buildBridgeRegistrySummary().aiBridge,
    bridgeRegistry: buildBridgeRegistrySummary(),
    externalApiRegistry: listExternalApis(),
    webhookRegistry: listWebhooks(),
    synchronizationQueue: buildSyncQueueSummary(),
    retryQueue: listRetryQueue(),
    integrationHealth: buildIntegrationHealthReport(),
    futureConnectors: listFutureConnectors(),
    integrationStatistics: calculateIntegrationStatistics(),
  };
}

export const INTEGRATION_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "integrationIntelligence",
  storageKeys: [
    INTEGRATION_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_integration_intelligence_bridge_v1",
    "bellaflore_integration_intelligence_external_api_v1",
    "bellaflore_integration_intelligence_webhook_v1",
    "bellaflore_integration_intelligence_sync_queue_v1",
    "bellaflore_integration_intelligence_retry_queue_v1",
    "bellaflore_integration_intelligence_health_v1",
    "bellaflore_integration_intelligence_future_connector_v1",
  ],
  capabilities: [
    "crm_bridge",
    "order_bridge",
    "checkout_bridge",
    "telegram_bridge",
    "payment_bridge",
    "inventory_bridge",
    "courier_bridge",
    "delivery_bridge",
    "analytics_bridge",
    "ai_bridge",
    "external_api_registry",
    "webhook_registry",
    "synchronization_queue",
    "retry_queue",
    "integration_health",
    "future_connectors",
  ],
  layers: [
    { id: "types", file: "integrationTypes.ts" },
    { id: "examples", file: "integrationExamples.ts" },
    {
      id: "registries",
      files: [
        "integrationRegistry.ts",
        "bridgeRegistry.ts",
        "syncEngine.ts",
        "integrationMetrics.ts",
      ],
    },
    { id: "engine", file: "integrationEngine.ts" },
    { id: "foundation", file: "integrationIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllIntegrationFoundationCapabilities() {
  return readIntegrationFoundationCapabilities();
}
