// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type SecurityRole =
  | "owner"
  | "admin"
  | "manager"
  | "florist"
  | "courier_manager"
  | "support"
  | "analyst"
  | "system";

export type SecurityPermission =
  | "orders.view"
  | "orders.edit"
  | "catalog.view"
  | "catalog.edit"
  | "inventory.view"
  | "inventory.edit"
  | "delivery.view"
  | "delivery.edit"
  | "couriers.view"
  | "couriers.edit"
  | "notifications.view"
  | "notifications.edit"
  | "workflow.view"
  | "workflow.control"
  | "analytics.view"
  | "health.view"
  | "aiBrain.view"
  | "system.view"
  | "system.control"
  | "security.view"
  | "security.control";

export type SecurityRoutePath =
  | "/admin"
  | "/admin/system-brain"
  | "/admin/internal"
  | "/admin/orders"
  | "/admin/catalog"
  | "/admin/inventory"
  | "/admin/delivery"
  | "/admin/couriers"
  | "/admin/notifications"
  | "/admin/workflow"
  | "/admin/analytics"
  | "/admin/health"
  | "/admin/security"
  | "/admin/settings";

export type SecurityModuleId =
  | "orderIntelligence"
  | "catalogEngine"
  | "inventoryIntelligence"
  | "courierIntelligence"
  | "deliveryIntelligence"
  | "notificationIntelligence"
  | "workflowIntelligence"
  | "analyticsIntelligence"
  | "healthIntelligence"
  | "aiBrain"
  | "adminIntelligence"
  | "securityIntelligence";

export type SecurityEventKind =
  | "login_success"
  | "login_failed"
  | "logout"
  | "session_expired"
  | "permission_denied"
  | "module_access_denied"
  | "suspicious_activity"
  | "password_config_warning"
  | "admin_action_performed"
  | "security_policy_changed";

export type SecurityRiskKind =
  | "weak_password"
  | "repeated_failed_login"
  | "expired_session"
  | "missing_permission"
  | "dev_credentials_enabled"
  | "public_admin_route"
  | "missing_env_secret"
  | "suspicious_admin_action";

export type SecurityRiskSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SecurityUser = {
  id: string;
  name: string;
  email: string;
  role: SecurityRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SecuritySession = {
  sessionId: string;
  userId: string;
  userName: string;
  role: SecurityRole;
  permissions: SecurityPermission[];
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  refreshedAt: string | null;
};

export type SecurityPolicy = {
  id: string;
  title: string;
  description: string;
  requiredPermissions: SecurityPermission[];
  allowedRoles: SecurityRole[];
  enabled: boolean;
};

export type SecurityEvent = {
  id: string;
  kind: SecurityEventKind;
  actorId: string | null;
  actorRole: SecurityRole | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  reviewed: boolean;
};

export type SecurityAuditLog = SecurityEvent;

export type SecurityRisk = {
  id: string;
  kind: SecurityRiskKind;
  severity: SecurityRiskSeverity;
  title: string;
  description: string;
  mitigation: string;
  detectedAt: string;
  metadata: Record<string, unknown>;
};

export type SecurityAccessCheck = {
  allowed: boolean;
  permission: SecurityPermission | null;
  route: SecurityRoutePath | null;
  moduleId: SecurityModuleId | null;
  reason: string | null;
  checkedAt: string;
};

export type SecurityModuleAccess = {
  moduleId: SecurityModuleId;
  title: string;
  route: SecurityRoutePath;
  requiredPermissions: SecurityPermission[];
  allowedRoles: SecurityRole[];
  enabled: boolean;
};

export type SecurityLoginValidationResult = {
  ok: boolean;
  user: SecurityUser | null;
  message: string;
};

export type SecurityRateLimitBucket =
  | "login_attempt"
  | "admin_action"
  | "notification_retry"
  | "api_request";

export type SecurityRateLimitCheck = {
  bucket: SecurityRateLimitBucket;
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
};

export type SecurityPostureSummary = {
  score: number;
  status: "secure" | "attention" | "at_risk";
  openRisks: number;
  auditEvents24h: number;
  checklistComplete: number;
  checklistTotal: number;
  generatedAt: string;
};

export type AiSecurityHooks = {
  detectSecurityRisk?: () => Promise<SecurityRisk[]>;
  explainSecurityEvent?: (event: SecurityEvent) => Promise<string>;
  suggestSecurityAction?: (risk: SecurityRisk) => Promise<{ action: string; rationale: string } | null>;
  summarizeSecurityPosture?: () => Promise<SecurityPostureSummary>;
  optimizeSecurityPolicy?: () => Promise<SecurityPolicy[]>;
};

export type ProductionReadinessCheckItem = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  status: "pending" | "ready" | "warning";
};

export type ProductionReadinessChecklist = {
  items: ProductionReadinessCheckItem[];
  readyCount: number;
  totalCount: number;
  isProductionReady: boolean;
  generatedAt: string;
};
