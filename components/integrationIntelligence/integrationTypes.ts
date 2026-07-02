// ==================================================
// SECTION: INTEGRATION INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type BridgeKind =
  | "crm"
  | "order"
  | "checkout"
  | "telegram"
  | "payment"
  | "inventory"
  | "courier"
  | "delivery"
  | "analytics"
  | "ai";

export type BridgeStatus = "active" | "inactive" | "pending" | "error";

export type BridgeDirection = "inbound" | "outbound" | "bidirectional";

export type ExternalApiStatus = "active" | "inactive" | "deprecated" | "maintenance";

export type WebhookStatus = "active" | "inactive" | "paused";

export type SyncQueueStatus = "pending" | "processing" | "completed" | "failed";

export type RetryQueueStatus = "pending" | "scheduled" | "exhausted" | "completed";

export type IntegrationHealthLevel = "healthy" | "degraded" | "critical" | "unknown";

export type FutureConnectorStatus = "planned" | "in_design" | "ready_for_wiring";

export type IntegrationBridge = {
  id: string;
  kind: BridgeKind;
  name: string;
  description: string;
  direction: BridgeDirection;
  status: BridgeStatus;
  sourceModule: string;
  targetModule: string;
  wired: boolean;
  readOnly: boolean;
  lastSyncAt: string | null;
  errorCount: number;
  updatedAt: string;
};

export type ExternalApiEntry = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  version: string;
  status: ExternalApiStatus;
  authType: "none" | "api_key" | "oauth2" | "bearer";
  rateLimitPerMinute: number | null;
  timeoutMs: number;
  wired: boolean;
  updatedAt: string;
};

export type WebhookEntry = {
  id: string;
  name: string;
  eventType: string;
  targetUrl: string;
  status: WebhookStatus;
  secretConfigured: boolean;
  lastTriggeredAt: string | null;
  successCount: number;
  failureCount: number;
  wired: boolean;
  updatedAt: string;
};

export type SyncQueueEntry = {
  id: string;
  bridgeId: string;
  bridgeKind: BridgeKind;
  operation: string;
  payloadSummary: string;
  status: SyncQueueStatus;
  priority: number;
  scheduledAt: string;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type RetryQueueEntry = {
  id: string;
  syncQueueId: string;
  bridgeId: string;
  attempt: number;
  maxAttempts: number;
  status: RetryQueueStatus;
  nextRetryAt: string;
  lastError: string | null;
  createdAt: string;
};

export type IntegrationHealthMetric = {
  id: string;
  bridgeId: string | null;
  bridgeKind: BridgeKind | null;
  level: IntegrationHealthLevel;
  label: string;
  message: string;
  latencyMs: number | null;
  uptimePercent: number | null;
  checkedAt: string;
};

export type FutureConnector = {
  id: string;
  name: string;
  kind: BridgeKind | "external";
  description: string;
  status: FutureConnectorStatus;
  targetModule: string;
  estimatedWiringStage: string | null;
  dependencies: string[];
  createdAt: string;
};

export type IntegrationStatistics = {
  totalBridges: number;
  activeBridges: number;
  wiredBridges: number;
  pendingBridges: number;
  errorBridges: number;
  externalApiCount: number;
  webhookCount: number;
  syncQueuePending: number;
  retryQueuePending: number;
  healthLevel: IntegrationHealthLevel;
  calculatedAt: string;
};

export type IntegrationIntelligenceSnapshot = {
  bridges: IntegrationBridge[];
  externalApis: ExternalApiEntry[];
  webhooks: WebhookEntry[];
  syncQueue: SyncQueueEntry[];
  retryQueue: RetryQueueEntry[];
  health: IntegrationHealthMetric[];
  futureConnectors: FutureConnector[];
  statistics: IntegrationStatistics;
  generatedAt: string;
};

export type BridgeListFilters = {
  kind?: BridgeKind;
  status?: BridgeStatus;
  wired?: boolean;
};

export type IntegrationRegistryState = {
  bridges: IntegrationBridge[];
  externalApis: ExternalApiEntry[];
  webhooks: WebhookEntry[];
  syncQueue: SyncQueueEntry[];
  retryQueue: RetryQueueEntry[];
  health: IntegrationHealthMetric[];
  futureConnectors: FutureConnector[];
};

export type IntegrationReadOnlySummary = {
  bridgeCount: number;
  activeBridgeCount: number;
  wiredBridgeCount: number;
  pendingSyncCount: number;
  healthLevel: IntegrationHealthLevel;
};
