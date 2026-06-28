// ==================================================
// SECTION: ADMIN CORE
// РАЗДЕЛ: Ядро админки
//
// Purpose (EN): Roles, permissions, audit log, and admin configuration registry.
//
// Назначение (RU): Роли, права, аудит и реестр конфигурации админ-панели.
// ==================================================
import { getAdminConfig } from "@/components/adminCore/adminConfig";
import { getAdminActionDefinition } from "@/components/adminCore/adminActionRegistry";
import {
  createAdminAuditEvent,
  saveAdminAuditEvent,
} from "@/components/adminCore/adminAuditLog";
import { adminUserCanPerformAction } from "@/components/adminCore/adminPermissionEngine";
import type {
  AdminActionContext,
  AdminActionId,
  AdminActionRecordInput,
  AdminActionRecordResult,
  AdminActionValidationResult,
  AdminResourceRef,
  AdminUser,
} from "@/components/adminCore/adminTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function createAdminActionContext(
  adminUser: AdminUser,
  actionId: AdminActionId,
  resource: AdminResourceRef,
): AdminActionContext {
  const action = getAdminActionDefinition(actionId);

  return {
    adminUserId: adminUser.adminUserId,
    adminUserName: adminUser.adminUserName,
    adminUserRole: adminUser.adminUserRole,
    adminActionId: actionId,
    adminActionType: action.adminActionType,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    createdAt: new Date().toISOString(),
  };
}

export function validateAdminAction(
  adminUser: AdminUser,
  actionId: AdminActionId,
  resource: AdminResourceRef,
): AdminActionValidationResult {
  const config = getAdminConfig();

  if (!config.enabled) {
    return {
      allowed: false,
      reason: "Admin core is disabled.",
      adminActionId: actionId,
      adminUserId: adminUser.adminUserId,
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
    };
  }

  const permissionResult = adminUserCanPerformAction(adminUser, actionId);

  return {
    allowed: permissionResult.allowed,
    reason: permissionResult.reason,
    adminActionId: actionId,
    adminUserId: adminUser.adminUserId,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
  };
}

export function recordAdminAction(
  adminUser: AdminUser,
  actionId: AdminActionId,
  resource: AdminResourceRef,
  result: AdminActionRecordInput,
): AdminActionRecordResult {
  const validation = validateAdminAction(adminUser, actionId, resource);
  const config = getAdminConfig();

  if (!config.auditLogEnabled || typeof window === "undefined") {
    return {
      ...validation,
      recorded: false,
      auditEventId: null,
    };
  }

  const auditEvent = createAdminAuditEvent({
    adminUser,
    adminActionId: actionId,
    resource,
    allowed: validation.allowed,
    reason: validation.reason,
    success: result.success,
    message: result.message ?? null,
    metadata: result.metadata ?? {},
  });

  saveAdminAuditEvent(auditEvent);

  return {
    ...validation,
    recorded: true,
    auditEventId: auditEvent.auditEventId,
  };
}

export function validateAndRecordAdminAction(
  adminUser: AdminUser,
  actionId: AdminActionId,
  resource: AdminResourceRef,
  result: AdminActionRecordInput,
): AdminActionRecordResult {
  return recordAdminAction(adminUser, actionId, resource, result);
}
