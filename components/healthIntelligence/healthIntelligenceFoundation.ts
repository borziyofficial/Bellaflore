// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  HealthStatus,
  HealthSeverity,
  HealthCheck,
  HealthCheckResult,
  HealthIssue,
  HealthIncident,
  HealthIncidentStatus,
  HealthMetric,
  HealthSnapshot,
  HealthReport,
  HealthModuleStatus,
  HealthModuleId,
  HealthNotificationEvent,
  HealthNotificationEventKind,
  HealthAiBrainPayload,
  HealthAdminDashboardPayload,
  SystemHealthSummary,
} from "@/components/healthIntelligence/healthIntelligenceTypes";

export {
  scoreToHealthStatus,
  healthStatusLabel,
  calculateSystemHealthScore,
  buildSystemHealthSummary,
  getScoreBandLabel,
} from "@/components/healthIntelligence/healthScoreEngine";

export {
  HEALTH_INCIDENTS_STORAGE_KEY,
  createHealthIncident,
  listHealthIncidents,
  getHealthIncidentById,
  markIncidentAcknowledged,
  escalateHealthIncident,
  resolveHealthIncident,
  clearHealthIncidentsStore,
  getExampleHealthIncident,
} from "@/components/healthIntelligence/healthIncidentFoundation";

export {
  readHealthOrderSnapshot,
  runHealthOrderChecks,
  detectHealthOrderIssues,
} from "@/components/healthIntelligence/healthOrderBridge";

export {
  readHealthInventorySnapshot,
  runHealthInventoryChecks,
  detectHealthInventoryIssues,
} from "@/components/healthIntelligence/healthInventoryBridge";

export {
  readHealthCourierSnapshot,
  runHealthCourierChecks,
  detectHealthCourierIssues,
} from "@/components/healthIntelligence/healthCourierBridge";

export {
  readHealthDeliverySnapshot,
  runHealthDeliveryChecks,
  detectHealthDeliveryIssues,
} from "@/components/healthIntelligence/healthDeliveryBridge";

export {
  readHealthNotificationSnapshot,
  runHealthNotificationChecks,
  detectHealthNotificationIssues,
} from "@/components/healthIntelligence/healthNotificationBridge";

export {
  readHealthWorkflowSnapshot,
  runHealthWorkflowChecks,
  detectHealthWorkflowIssues,
} from "@/components/healthIntelligence/healthWorkflowBridge";

export {
  readHealthAdminSnapshot,
  runHealthAdminChecks,
} from "@/components/healthIntelligence/healthAdminBridge";

export {
  readHealthAiBrainSnapshot,
  runHealthAiBrainChecks,
} from "@/components/healthIntelligence/healthAiBrainBridge";

export {
  readHealthAnalyticsSnapshot,
  runHealthAnalyticsChecks,
} from "@/components/healthIntelligence/healthAnalyticsBridge";

export {
  readHealthCatalogSnapshot,
  runHealthCatalogChecks,
} from "@/components/healthIntelligence/healthCatalogBridge";

export {
  readHealthTelegramSnapshot,
  runHealthTelegramChecks,
  recordTelegramHealthSendStatusPlaceholder,
  type TelegramHealthSendStatus,
} from "@/components/healthIntelligence/healthTelegramBridge";

export {
  buildHealthWarningNotificationEvent,
  buildHealthCriticalNotificationEvent,
  buildModuleOfflineNotificationEvent,
  buildIncidentEscalatedNotificationEvent,
  buildIncidentResolvedNotificationEvent,
  buildHealthNotificationEventsFromSnapshot,
  HEALTH_NOTIFICATION_EVENT_KINDS,
} from "@/components/healthIntelligence/healthNotificationFoundation";

export {
  buildHealthAiBrainPayload,
} from "@/components/healthIntelligence/healthAiBrainFoundation";

export {
  buildHealthAdminDashboardPayload,
} from "@/components/healthIntelligence/healthAdminFoundation";

export {
  runHealthChecks,
  collectHealthSnapshot,
  detectHealthIssues,
  createHealthReport,
  summarizeModuleHealth,
  getSystemHealthStatus,
  autoCreateIncidentsFromIssues,
  getHealthIntelligenceExample,
  runHealthIntelligenceEngine,
} from "@/components/healthIntelligence/healthIntelligenceEngine";
