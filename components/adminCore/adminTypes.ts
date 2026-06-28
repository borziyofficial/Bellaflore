// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for adminCore.
//
// Назначение (RU): Определения типов для adminCore.
// ==================================================
export type AdminUserRole =
  | "owner"
  | "manager"
  | "florist"
  | "courier"
  | "viewer";

export type AdminPermission =
  | "view_orders"
  | "manage_orders"
  | "change_order_status"
  | "assign_courier"
  | "view_customers"
  | "manage_customers"
  | "view_catalog"
  | "manage_catalog"
  | "view_delivery"
  | "manage_delivery"
  | "view_crm"
  | "manage_crm"
  | "view_analytics"
  | "manage_settings";

export type AdminSection =
  | "orders"
  | "customers"
  | "crm"
  | "catalog"
  | "delivery"
  | "couriers"
  | "analytics"
  | "settings"
  | "notifications";

export type AdminActionId =
  | "view_order"
  | "accept_order"
  | "cancel_order"
  | "change_order_status"
  | "assign_courier"
  | "add_order_note"
  | "view_customer"
  | "edit_customer"
  | "add_customer_note"
  | "view_crm_queue"
  | "move_crm_order_queue"
  | "view_delivery_rules"
  | "edit_delivery_rules"
  | "view_notifications"
  | "process_notification_event";

export type AdminActionType =
  | "read"
  | "write"
  | "delete"
  | "assign"
  | "status_change"
  | "process";

export type AdminResourceType =
  | "order"
  | "customer"
  | "crm_order"
  | "catalog_item"
  | "delivery_rule"
  | "courier"
  | "notification_event"
  | "settings";

export type AdminUser = {
  adminUserId: string;
  adminUserName: string;
  adminUserRole: AdminUserRole;
};

export type AdminActionDefinition = {
  adminActionId: AdminActionId;
  adminActionType: AdminActionType;
  label: string;
  requiredPermission: AdminPermission;
  section: AdminSection;
};

export type AdminPermissionCheckResult = {
  adminPermission: AdminPermission;
  allowed: boolean;
  reason: string | null;
};

export type AdminAccessContext = {
  adminUserId: string;
  adminUserName: string;
  adminUserRole: AdminUserRole;
  permissions: AdminPermission[];
  accessibleSections: AdminSection[];
  createdAt: string;
  updatedAt: string;
};

export type AdminResourceRef = {
  resourceType: AdminResourceType;
  resourceId: string;
};

export type AdminActionContext = {
  adminUserId: string;
  adminUserName: string;
  adminUserRole: AdminUserRole;
  adminActionId: AdminActionId;
  adminActionType: AdminActionType;
  resourceType: AdminResourceType;
  resourceId: string;
  createdAt: string;
};

export type AdminActionValidationResult = {
  allowed: boolean;
  reason: string | null;
  adminActionId: AdminActionId;
  adminUserId: string;
  resourceType: AdminResourceType;
  resourceId: string;
};

export type AdminActionRecordInput = {
  success: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type AdminActionRecordResult = AdminActionValidationResult & {
  recorded: boolean;
  auditEventId: string | null;
};

export type AdminAuditEvent = {
  auditEventId: string;
  adminUserId: string;
  adminUserName: string;
  adminUserRole: AdminUserRole;
  adminActionId: AdminActionId;
  resourceType: AdminResourceType;
  resourceId: string;
  allowed: boolean;
  reason: string | null;
  success: boolean;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreateAdminAuditEventInput = {
  adminUser: AdminUser;
  adminActionId: AdminActionId;
  resource: AdminResourceRef;
  allowed: boolean;
  reason?: string | null;
  success: boolean;
  message?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type AdminConfig = {
  enabled: boolean;
  defaultRole: AdminUserRole;
  auditLogEnabled: boolean;
  requirePermissionCheck: boolean;
  allowOwnerOverride: boolean;
};
