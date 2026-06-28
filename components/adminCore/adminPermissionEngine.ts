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
  getPermissionsForRole,
  roleHasPermission,
} from "@/components/adminCore/adminPermissions";
import {
  canAdminAccessSection,
  getAccessibleSectionsForRole,
} from "@/components/adminCore/adminSections";
import type {
  AdminAccessContext,
  AdminActionId,
  AdminPermission,
  AdminPermissionCheckResult,
  AdminSection,
  AdminUser,
  AdminUserRole,
} from "@/components/adminCore/adminTypes";

export { getPermissionsForRole, canAdminAccessSection };


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildDeniedReason(
  role: AdminUserRole,
  permission: AdminPermission,
): string {
  return `Role "${role}" does not have permission "${permission}".`;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function checkAdminPermission(
  role: AdminUserRole,
  permission: AdminPermission,
): AdminPermissionCheckResult {
  const config = getAdminConfig();

  if (!config.enabled) {
    return {
      adminPermission: permission,
      allowed: false,
      reason: "Admin core is disabled.",
    };
  }

  if (
    config.allowOwnerOverride &&
    role === "owner" &&
    roleHasPermission("owner", permission)
  ) {
    return {
      adminPermission: permission,
      allowed: true,
      reason: null,
    };
  }

  if (!config.requirePermissionCheck) {
    return {
      adminPermission: permission,
      allowed: true,
      reason: null,
    };
  }

  const allowed = roleHasPermission(role, permission);

  return {
    adminPermission: permission,
    allowed,
    reason: allowed ? null : buildDeniedReason(role, permission),
  };
}

export function canAdminPerformAction(
  role: AdminUserRole,
  actionId: AdminActionId,
): AdminPermissionCheckResult {
  const action = getAdminActionDefinition(actionId);

  if (!canAdminAccessSection(role, action.section)) {
    return {
      adminPermission: action.requiredPermission,
      allowed: false,
      reason: `Role "${role}" cannot access section "${action.section}".`,
    };
  }

  return checkAdminPermission(role, action.requiredPermission);
}

export function buildAdminAccessContext(adminUser: AdminUser): AdminAccessContext {
  const now = new Date().toISOString();

  return {
    adminUserId: adminUser.adminUserId,
    adminUserName: adminUser.adminUserName,
    adminUserRole: adminUser.adminUserRole,
    permissions: getPermissionsForRole(adminUser.adminUserRole),
    accessibleSections: getAccessibleSectionsForRole(adminUser.adminUserRole),
    createdAt: now,
    updatedAt: now,
  };
}

export function adminUserCanAccessSection(
  adminUser: AdminUser,
  section: AdminSection,
): boolean {
  return canAdminAccessSection(adminUser.adminUserRole, section);
}

export function adminUserCanPerformAction(
  adminUser: AdminUser,
  actionId: AdminActionId,
): AdminPermissionCheckResult {
  return canAdminPerformAction(adminUser.adminUserRole, actionId);
}
