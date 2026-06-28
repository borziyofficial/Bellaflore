// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  SecurityUser,
  SecurityRole,
  SecurityPermission,
  SecuritySession,
  SecurityPolicy,
  SecurityEvent,
  SecurityEventKind,
  SecurityRisk,
  SecurityRiskKind,
  SecurityRiskSeverity,
  SecurityAuditLog,
  SecurityAccessCheck,
  SecurityModuleAccess,
  SecurityModuleId,
  SecurityRoutePath,
  SecurityLoginValidationResult,
  SecurityRateLimitBucket,
  SecurityRateLimitCheck,
  SecurityPostureSummary,
  AiSecurityHooks,
  ProductionReadinessCheckItem,
  ProductionReadinessChecklist,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

export {
  SECURITY_DEV_CONFIG_FLAG,
  SECURITY_DEV_CREDENTIALS,
  findDevSecurityUserByCredentials,
  findDevSecurityUserById,
  isDevSecurityCredentialsEnabled,
  type SecurityDevCredential,
} from "@/components/securityIntelligence/securityDevConfig";

export {
  SECURITY_PERMISSIONS,
  isSecurityPermission,
} from "@/components/securityIntelligence/securityPermissionsCatalog";

export {
  SECURITY_ROLES,
  getPermissionsForSecurityRole,
  securityRoleHasPermission,
  getAllowedRolesForPermission,
} from "@/components/securityIntelligence/securityRolesCatalog";

export {
  SECURITY_SESSION_STORAGE_KEY,
  validateSecurityLogin,
  createSecuritySession,
  destroySecuritySession,
  getCurrentSecuritySession,
  refreshSecuritySession,
  isSessionExpired,
  getExampleSecuritySession,
  clearSecuritySessionStore,
} from "@/components/securityIntelligence/securityAuthFoundation";

export {
  SECURITY_ROUTE_RULES,
  SECURITY_MODULE_ACCESS,
  getSecurityRouteRule,
  getSecurityModuleAccess,
  listSecurityRouteRules,
  type SecurityRouteRule,
} from "@/components/securityIntelligence/securityRouteAccessFoundation";

export {
  hasSecurityPermission,
  requireSecurityPermission,
  canAccessAdminEntryPoint,
  canAccessModule,
  canPerformAction,
  canControlSystem,
  getExampleDeniedAccess,
} from "@/components/securityIntelligence/securityAccessGuards";

export {
  SECURITY_AUDIT_STORAGE_KEY,
  SECURITY_AUDIT_EVENT_KINDS,
  createSecurityAuditEvent,
  listSecurityAuditEvents,
  filterSecurityAuditEvents,
  markSecurityEventReviewed,
  clearSecurityAuditLog,
  getExampleSecurityAuditEvent,
  type CreateSecurityAuditEventInput,
} from "@/components/securityIntelligence/securityAuditFoundation";

export {
  detectSecurityRisks,
  getExampleSecurityRisk,
  resetSecurityRiskCounter,
  SECURITY_RISK_KINDS,
} from "@/components/securityIntelligence/securityRiskEngine";

export {
  checkRateLimit,
  recordRateLimitHit,
  resetRateLimitBucket,
  getRateLimitConfig,
} from "@/components/securityIntelligence/securityRateLimitFoundation";

export { readSecurityAdminSnapshot } from "@/components/securityIntelligence/securityAdminBridge";
export { readSecurityHealthSnapshot } from "@/components/securityIntelligence/securityHealthBridge";
export { readSecurityAiBrainSnapshot } from "@/components/securityIntelligence/securityAiBrainBridge";
export { readSecurityAnalyticsSnapshot } from "@/components/securityIntelligence/securityAnalyticsBridge";

export {
  registerAiSecurityHooks,
  getAiSecurityHooks,
  clearAiSecurityHooks,
  detectSecurityRisk,
  explainSecurityEvent,
  suggestSecurityAction,
  summarizeSecurityPosture,
  optimizeSecurityPolicy,
  AI_SECURITY_INTEGRATION_SLOTS,
} from "@/components/securityIntelligence/aiSecurityFoundation";

export { buildProductionReadinessChecklist } from "@/components/securityIntelligence/securityProductionReadiness";

export {
  getSecurityIntelligenceSnapshot,
  getSecurityPostureReport,
  getSecurityIntelligenceExample,
  loginSecurityUser,
  runSecurityIntelligenceEngine,
} from "@/components/securityIntelligence/securityIntelligenceEngine";
