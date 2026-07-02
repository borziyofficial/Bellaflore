// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Integration metrics & health
// ==================================================
import { buildIntegrationExampleRegistryState } from "@/components/integrationIntelligence/integrationExamples";
import {
  listBridges,
  listPendingBridges,
  listWiredBridges,
} from "@/components/integrationIntelligence/bridgeRegistry";
import {
  listExternalApis,
  listWebhooks,
} from "@/components/integrationIntelligence/integrationRegistry";
import {
  listPendingRetryQueue,
  listPendingSyncQueue,
} from "@/components/integrationIntelligence/syncEngine";
import type {
  FutureConnector,
  FutureConnectorStatus,
  IntegrationHealthLevel,
  IntegrationHealthMetric,
  IntegrationStatistics,
} from "@/components/integrationIntelligence/integrationTypes";

export const INTEGRATION_HEALTH_STORAGE_KEY =
  "bellaflore_integration_intelligence_health_v1";

export const INTEGRATION_FUTURE_CONNECTOR_STORAGE_KEY =
  "bellaflore_integration_intelligence_future_connector_v1";

let inMemoryHealth: IntegrationHealthMetric[] | null = null;
let inMemoryFutureConnectors: FutureConnector[] | null = null;

function readHealthFromStorage(): IntegrationHealthMetric[] {
  if (typeof window === "undefined") {
    return inMemoryHealth ?? buildIntegrationExampleRegistryState().health;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_HEALTH_STORAGE_KEY);
    if (!raw) {
      return inMemoryHealth ?? buildIntegrationExampleRegistryState().health;
    }

    const parsed = JSON.parse(raw) as IntegrationHealthMetric[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildIntegrationExampleRegistryState().health;
  } catch {
    return inMemoryHealth ?? buildIntegrationExampleRegistryState().health;
  }
}

function writeHealthToStorage(metrics: IntegrationHealthMetric[]): void {
  inMemoryHealth = metrics;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INTEGRATION_HEALTH_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // In-memory fallback remains active.
  }
}

function readFutureConnectorsFromStorage(): FutureConnector[] {
  if (typeof window === "undefined") {
    return inMemoryFutureConnectors ?? buildIntegrationExampleRegistryState().futureConnectors;
  }

  try {
    const raw = window.localStorage.getItem(INTEGRATION_FUTURE_CONNECTOR_STORAGE_KEY);
    if (!raw) {
      return inMemoryFutureConnectors ?? buildIntegrationExampleRegistryState().futureConnectors;
    }

    const parsed = JSON.parse(raw) as FutureConnector[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildIntegrationExampleRegistryState().futureConnectors;
  } catch {
    return inMemoryFutureConnectors ?? buildIntegrationExampleRegistryState().futureConnectors;
  }
}

function writeFutureConnectorsToStorage(connectors: FutureConnector[]): void {
  inMemoryFutureConnectors = connectors;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      INTEGRATION_FUTURE_CONNECTOR_STORAGE_KEY,
      JSON.stringify(connectors),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

export function resolveOverallHealthLevel(
  metrics: IntegrationHealthMetric[],
): IntegrationHealthLevel {
  if (metrics.some((m) => m.level === "critical")) {
    return "critical";
  }

  if (metrics.some((m) => m.level === "degraded")) {
    return "degraded";
  }

  if (metrics.every((m) => m.level === "healthy" || m.level === "unknown")) {
    return metrics.some((m) => m.level === "healthy") ? "healthy" : "unknown";
  }

  return "unknown";
}

export function listIntegrationHealth(bridgeId?: string): IntegrationHealthMetric[] {
  return readHealthFromStorage().filter((m) =>
    bridgeId ? m.bridgeId === bridgeId : true,
  );
}

export function getIntegrationHealthById(id: string): IntegrationHealthMetric | null {
  return readHealthFromStorage().find((m) => m.id === id) ?? null;
}

export function getOverallIntegrationHealth(): IntegrationHealthMetric | null {
  return readHealthFromStorage().find((m) => m.bridgeId === null) ?? null;
}

export function listFutureConnectors(status?: FutureConnectorStatus): FutureConnector[] {
  return readFutureConnectorsFromStorage().filter((c) =>
    status ? c.status === status : true,
  );
}

export function getFutureConnectorById(id: string): FutureConnector | null {
  return readFutureConnectorsFromStorage().find((c) => c.id === id) ?? null;
}

export function calculateIntegrationStatistics(): IntegrationStatistics {
  const bridges = listBridges();
  const active = bridges.filter((b) => b.status === "active");
  const error = bridges.filter((b) => b.status === "error");
  const health = readHealthFromStorage();

  return {
    totalBridges: bridges.length,
    activeBridges: active.length,
    wiredBridges: listWiredBridges().length,
    pendingBridges: listPendingBridges().length,
    errorBridges: error.length,
    externalApiCount: listExternalApis().length,
    webhookCount: listWebhooks().length,
    syncQueuePending: listPendingSyncQueue().length,
    retryQueuePending: listPendingRetryQueue().length,
    healthLevel: resolveOverallHealthLevel(health),
    calculatedAt: new Date().toISOString(),
  };
}

export function registerIntegrationHealthMetric(
  metric: IntegrationHealthMetric,
): IntegrationHealthMetric {
  const metrics = readHealthFromStorage();
  const index = metrics.findIndex((m) => m.id === metric.id);
  const next =
    index === -1
      ? [...metrics, metric]
      : metrics.map((m, i) => (i === index ? metric : m));

  writeHealthToStorage(next);
  return metric;
}

export function registerFutureConnector(connector: FutureConnector): FutureConnector {
  const connectors = readFutureConnectorsFromStorage();
  const index = connectors.findIndex((c) => c.id === connector.id);
  const next =
    index === -1
      ? [...connectors, connector]
      : connectors.map((c, i) => (i === index ? connector : c));

  writeFutureConnectorsToStorage(next);
  return connector;
}

export function seedIntegrationMetrics(): IntegrationHealthMetric[] {
  const seed = buildIntegrationExampleRegistryState();
  writeHealthToStorage(seed.health);
  writeFutureConnectorsToStorage(seed.futureConnectors);
  return listIntegrationHealth();
}

export function clearIntegrationMetrics(): void {
  writeHealthToStorage([]);
  writeFutureConnectorsToStorage([]);
}

export function buildIntegrationHealthReport() {
  const health = listIntegrationHealth();
  const statistics = calculateIntegrationStatistics();

  return {
    overall: getOverallIntegrationHealth(),
    metrics: health,
    statistics,
    healthLevel: statistics.healthLevel,
    generatedAt: new Date().toISOString(),
  };
}
