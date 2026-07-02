// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminSession,
  AdminEntryPoint,
  AdminEntryPointId,
  AdminModule,
  AdminModuleId,
  AdminModuleStatus,
  AdminNavigationItem,
  AdminNavigationSectionId,
  AdminAuditEvent,
  AdminAuditEventKind,
  AdminLoginValidationResult,
  AdminPermissionCheckResult,
  AdminDashboardSummary,
  AiAdminHooks,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export {
  ADMIN_DEV_CONFIG_FLAG,
  ADMIN_DEV_CREDENTIALS,
  findDevAdminUserByCredentials,
  findDevAdminUserById,
  isDevAdminRole,
  type AdminDevCredential,
} from "@/components/adminIntelligence/adminDevConfig";

export {
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_DEFINITIONS,
  isAdminPermission,
  getAdminPermissionDefinition,
  type AdminPermissionDefinition,
} from "@/components/adminIntelligence/adminPermissionsCatalog";

export {
  ADMIN_ROLES,
  ADMIN_ROLE_DEFINITIONS,
  isAdminRole,
  getAdminRoleDefinition,
  getPermissionsForRole,
  roleHasPermission,
  getAdminRolesInSortOrder,
  type AdminRoleDefinition,
} from "@/components/adminIntelligence/adminRolesCatalog";

export {
  ADMIN_ENTRY_POINTS,
  getAdminEntryPointById,
  listEnabledAdminEntryPoints,
  canRoleAccessEntryPoint,
  getEntryPointsForRole,
} from "@/components/adminIntelligence/adminEntryPointsCatalog";

export {
  ADMIN_NAVIGATION_ITEMS,
  getAdminNavigationItemById,
  getAdminNavigationForRole,
  getAdminNavigationTree,
} from "@/components/adminIntelligence/adminNavigationCatalog";

export {
  ADMIN_MODULE_REGISTRY,
  getAdminModuleById,
  listEnabledAdminModules,
  listActiveAdminModules,
  getAdminModuleRegistrySnapshot,
} from "@/components/adminIntelligence/adminModuleRegistry";

export {
  ADMIN_SESSION_STORAGE_KEY,
  validateAdminLogin,
  createAdminSession,
  destroyAdminSession,
  getCurrentAdminSession,
  hasPermission,
  requirePermission,
  loginAdmin,
  getExampleAdminSession,
  clearAdminSessionStore,
} from "@/components/adminIntelligence/adminAuthFoundation";

export {
  ADMIN_AUDIT_STORAGE_KEY,
  ADMIN_AUDIT_EVENT_KINDS,
  recordAdminAuditEvent,
  listAdminAuditEvents,
  filterAdminAuditEventsByKind,
  getAdminAuditEventById,
  clearAdminAuditLog,
  buildAuditEventPreview,
  type CreateAdminAuditEventInput,
} from "@/components/adminIntelligence/adminAuditFoundation";

export {
  buildAdminOrderSummary,
  getAdminOrderAttentionCount,
  type AdminOrderBridgeSummary,
} from "@/components/adminIntelligence/adminOrderBridge";

export {
  buildAdminInventorySummary,
  getAdminInventoryAttentionCount,
  type AdminInventoryBridgeItem,
  type AdminInventoryBridgeSummary,
} from "@/components/adminIntelligence/adminInventoryBridge";

export {
  buildAdminDeliverySummary,
  getAdminDeliveryAttentionCount,
  type AdminDeliveryBridgeSummary,
} from "@/components/adminIntelligence/adminDeliveryBridge";

export {
  buildAdminCourierSummary,
  getAdminCourierAttentionCount,
  type AdminCourierBridgeSummary,
} from "@/components/adminIntelligence/adminCourierBridge";

export {
  buildAdminNotificationSummary,
  getAdminNotificationAttentionCount,
  type AdminNotificationBridgeSummary,
} from "@/components/adminIntelligence/adminNotificationBridge";

export {
  buildAdminWorkflowSummary,
  getAdminWorkflowAttentionCount,
  type AdminWorkflowBridgeSummary,
} from "@/components/adminIntelligence/adminWorkflowBridge";

export {
  registerAiAdminHooks,
  getAiAdminHooks,
  clearAiAdminHooks,
  summarizeAdminDashboard,
  detectAdminAttention,
  suggestAdminAction,
  explainSystemState,
  summarizeDailyOperations,
  AI_ADMIN_INTEGRATION_SLOTS,
} from "@/components/adminIntelligence/aiAdminFoundation";

export {
  buildAdminDashboardSummary,
  getAdminIntelligenceSnapshot,
  getAdminIntelligenceExample,
  runAdminIntelligenceEngine,
} from "@/components/adminIntelligence/adminIntelligenceEngine";
