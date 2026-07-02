// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type HealthStatus =
  | "healthy"
  | "degraded"
  | "warning"
  | "critical"
  | "offline"
  | "unknown";

export type HealthSeverity = "info" | "low" | "medium" | "high" | "critical";

export type HealthModuleId =
  | "orderIntelligence"
  | "inventoryIntelligence"
  | "courierIntelligence"
  | "deliveryIntelligence"
  | "notificationIntelligence"
  | "workflowIntelligence"
  | "adminIntelligence"
  | "aiBrain"
  | "analyticsIntelligence"
  | "catalogEngine"
  | "telegram";

export type HealthCheckId = string;

export type HealthCheck = {
  id: HealthCheckId;
  moduleId: HealthModuleId;
  title: string;
  description: string;
};

export type HealthCheckResult = {
  checkId: HealthCheckId;
  moduleId: HealthModuleId;
  status: HealthStatus;
  severity: HealthSeverity;
  passed: boolean;
  message: string;
  checkedAt: string;
  metadata: Record<string, unknown>;
};

export type HealthIssue = {
  id: string;
  moduleId: HealthModuleId;
  checkId: HealthCheckId;
  status: HealthStatus;
  severity: HealthSeverity;
  title: string;
  description: string;
  detectedAt: string;
  resourceType: string | null;
  resourceId: string | null;
};

export type HealthIncidentStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "escalated";

export type HealthIncident = {
  id: string;
  issueId: string;
  moduleId: HealthModuleId;
  severity: HealthSeverity;
  status: HealthIncidentStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  escalatedAt: string | null;
  metadata: Record<string, unknown>;
};

export type HealthMetric = {
  id: string;
  label: string;
  value: number;
  unit: string | null;
  moduleId: HealthModuleId;
  status: HealthStatus;
};

export type HealthModuleStatus = {
  moduleId: HealthModuleId;
  title: string;
  status: HealthStatus;
  score: number;
  checkCount: number;
  passedChecks: number;
  failedChecks: number;
  issues: HealthIssue[];
  lastCheckedAt: string;
};

export type HealthSnapshot = {
  id: string;
  systemStatus: HealthStatus;
  systemScore: number;
  collectedAt: string;
  moduleStatuses: HealthModuleStatus[];
  checkResults: HealthCheckResult[];
  issues: HealthIssue[];
  metrics: HealthMetric[];
  openIncidents: number;
};

export type HealthReport = {
  id: string;
  title: string;
  systemStatus: HealthStatus;
  systemScore: number;
  summary: string;
  moduleStatuses: HealthModuleStatus[];
  criticalIssues: HealthIssue[];
  warnings: HealthIssue[];
  incidents: HealthIncident[];
  generatedAt: string;
};

export type HealthNotificationEventKind =
  | "health_warning_detected"
  | "health_critical_detected"
  | "module_offline_detected"
  | "incident_escalated"
  | "incident_resolved";

export type HealthNotificationEvent = {
  kind: HealthNotificationEventKind;
  moduleId: HealthModuleId;
  severity: HealthSeverity;
  title: string;
  message: string;
  incidentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type HealthAiBrainPayload = {
  healthSignals: Array<{
    id: string;
    title: string;
    severity: HealthSeverity;
    moduleId: HealthModuleId;
  }>;
  healthRisks: Array<{
    id: string;
    title: string;
    severity: HealthSeverity;
    moduleId: HealthModuleId;
  }>;
  healthRecommendations: Array<{
    id: string;
    title: string;
    rationale: string;
    moduleId: HealthModuleId;
  }>;
  healthReportSummary: string;
  generatedAt: string;
};

export type HealthAdminDashboardPayload = {
  systemHealthCard: {
    status: HealthStatus;
    score: number;
    lastCheckedAt: string;
  };
  moduleHealthCards: HealthModuleStatus[];
  incidents: HealthIncident[];
  criticalIssues: HealthIssue[];
  warnings: HealthIssue[];
  generatedAt: string;
};

export type SystemHealthSummary = {
  status: HealthStatus;
  score: number;
  label: string;
  moduleCount: number;
  healthyModules: number;
  degradedModules: number;
  criticalModules: number;
};
