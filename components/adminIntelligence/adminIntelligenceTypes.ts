// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type AdminRole =
  | "owner"
  | "admin"
  | "manager"
  | "florist"
  | "courier_manager"
  | "support"
  | "analyst"
  | "system";

export type AdminPermission =
  | "orders.view"
  | "orders.edit"
  | "orders.status.change"
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
  | "system.view"
  | "system.control";

export type AdminEntryPointId =
  | "admin_panel"
  | "system_brain"
  | "third_internal_module";

export type AdminModuleId =
  | "orderIntelligence"
  | "catalogEngine"
  | "inventoryIntelligence"
  | "courierIntelligence"
  | "deliveryIntelligence"
  | "notificationIntelligence"
  | "workflowIntelligence"
  | "analyticsIntelligence"
  | "systemBrain";

export type AdminModuleStatus =
  | "active"
  | "beta"
  | "planned"
  | "disabled";

export type AdminNavigationSectionId =
  | "dashboard"
  | "orders"
  | "catalog"
  | "inventory"
  | "delivery"
  | "couriers"
  | "notifications"
  | "workflow"
  | "analytics"
  | "settings"
  | "system_brain";

export type AdminAuditEventKind =
  | "admin_login"
  | "admin_logout"
  | "order_status_changed"
  | "product_updated"
  | "inventory_updated"
  | "courier_assigned"
  | "workflow_restarted"
  | "notification_retried"
  | "settings_changed";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSession = {
  sessionId: string;
  userId: string;
  userName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  entryPointId: AdminEntryPointId | null;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
};

export type AdminEntryPoint = {
  id: AdminEntryPointId;
  routePath: string;
  title: string;
  description: string;
  roleAccess: AdminRole[];
  enabled: boolean;
};

export type AdminModule = {
  id: AdminModuleId;
  title: string;
  description: string;
  permissions: AdminPermission[];
  status: AdminModuleStatus;
  route: string;
  enabled: boolean;
};

export type AdminNavigationItem = {
  id: AdminNavigationSectionId;
  title: string;
  description: string;
  route: string;
  icon: string;
  permissions: AdminPermission[];
  enabled: boolean;
  sortOrder: number;
  children?: AdminNavigationItem[];
};

export type AdminAuditEvent = {
  id: string;
  kind: AdminAuditEventKind;
  actorId: string;
  actorName: string;
  actorRole: AdminRole;
  resourceType: string | null;
  resourceId: string | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminLoginValidationResult = {
  ok: boolean;
  user: AdminUser | null;
  message: string;
};

export type AdminPermissionCheckResult = {
  permission: AdminPermission;
  allowed: boolean;
  reason: string | null;
};

export type AdminDashboardSummary = {
  ordersCount: number;
  activeDeliveriesCount: number;
  pendingNotificationsCount: number;
  runningWorkflowsCount: number;
  lowStockItemsCount: number;
  attentionItemsCount: number;
  generatedAt: string;
};

export type AiAdminHooks = {
  summarizeAdminDashboard?: () => Promise<{ summary: string; highlights: string[] }>;
  detectAdminAttention?: () => Promise<{
    level: "normal" | "elevated" | "critical";
    items: Array<{ id: string; title: string; reason: string }>;
  }>;
  suggestAdminAction?: (context: {
    section: AdminNavigationSectionId;
    metadata?: Record<string, unknown>;
  }) => Promise<{ action: string; rationale: string } | null>;
  explainSystemState?: () => Promise<{ explanation: string; modules: string[] }>;
  summarizeDailyOperations?: () => Promise<{
    summary: string;
    metrics: Record<string, number>;
  }>;
};
