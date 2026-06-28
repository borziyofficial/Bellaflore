// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Рабочее пространство админки
//
// Purpose (EN): Workspace layout, sections, access guards, and navigation config.
//
// Назначение (RU): Макет, разделы, проверки доступа и конфигурация навигации админки.
// ==================================================
import { getAdminConfig } from "@/components/adminCore/adminConfig";
import { checkAdminPermission } from "@/components/adminCore/adminPermissionEngine";
import type { AdminUser } from "@/components/adminCore/adminTypes";
import { getAdminWorkspaceConfig } from "@/components/adminWorkspace/adminWorkspaceConfig";
import {
  canOpenAdminSection,
  resolveAdminSectionByPath,
  resolveAdminSectionBySlug,
} from "@/components/adminWorkspace/adminWorkspaceEngine";
import {
  getAdminWorkspaceSectionById,
  getAdminWorkspaceSectionRegistry,
} from "@/components/adminWorkspace/adminWorkspaceSections";
import type {
  AdminAccessGuardResult,
  AdminAccessDeniedReason,
  AdminWorkspaceGuardContext,
  AdminWorkspaceSectionId,
} from "@/components/adminWorkspace/adminWorkspaceTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildDeniedResult(
  allowed: boolean,
  reason: AdminAccessDeniedReason | null,
  message: string | null,
  section: AdminAccessGuardResult["section"],
): AdminAccessGuardResult {
  return {
    allowed,
    reason,
    message,
    section,
  };
}

function roleMeetsSectionRequirement(
  adminUser: AdminUser,
  section: NonNullable<AdminAccessGuardResult["section"]>,
): boolean {
  if (adminUser.adminUserRole === "owner") {
    return true;
  }

  if (!section.requiredRole) {
    return true;
  }

  return adminUser.adminUserRole === section.requiredRole;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function guardAdminWorkspaceAccess(
  adminUser: AdminUser,
): AdminWorkspaceGuardContext {
  const workspaceConfig = getAdminWorkspaceConfig();
  const adminConfig = getAdminConfig();

  if (!workspaceConfig.enabled) {
    return {
      ...buildDeniedResult(
        false,
        "workspace_disabled",
        "Admin Workspace Foundation is disabled.",
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: null,
    };
  }

  if (!adminConfig.enabled) {
    return {
      ...buildDeniedResult(
        false,
        "workspace_disabled",
        "Admin Core is disabled.",
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: null,
    };
  }

  if (!workspaceConfig.useAccessGuards) {
    return {
      ...buildDeniedResult(true, null, null, null),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: null,
    };
  }

  const hasAnySection = getAdminWorkspaceSectionRegistry().some((section) =>
    canOpenAdminSection(adminUser, section.sectionId),
  );

  if (!hasAnySection && adminUser.adminUserRole !== "owner") {
    return {
      ...buildDeniedResult(
        false,
        "permission_denied",
        "No accessible admin workspace sections for this user.",
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: null,
    };
  }

  return {
    ...buildDeniedResult(true, null, null, null),
    adminUserId: adminUser.adminUserId,
    adminUserRole: adminUser.adminUserRole,
    path: null,
  };
}

export function guardAdminSectionAccess(
  adminUser: AdminUser,
  sectionId: AdminWorkspaceSectionId,
): AdminWorkspaceGuardContext {
  const workspaceConfig = getAdminWorkspaceConfig();
  const section = getAdminWorkspaceSectionById(sectionId);

  if (!workspaceConfig.enabled) {
    return {
      ...buildDeniedResult(
        false,
        "workspace_disabled",
        "Admin Workspace Foundation is disabled.",
        section,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section?.sectionPath ?? null,
    };
  }

  if (!section) {
    return {
      ...buildDeniedResult(
        false,
        "section_not_found",
        `Admin section "${sectionId}" was not found.`,
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: null,
    };
  }

  if (!section.isEnabled) {
    return {
      ...buildDeniedResult(
        false,
        "section_disabled",
        `Section "${section.sectionName}" is disabled.`,
        section,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  if (!workspaceConfig.useAccessGuards) {
    return {
      ...buildDeniedResult(true, null, null, section),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  if (
    adminUser.adminUserRole === "owner" &&
    getAdminConfig().allowOwnerOverride
  ) {
    return {
      ...buildDeniedResult(true, null, null, section),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  if (adminUser.adminUserRole === "viewer" && !section.requiredPermission.startsWith("view_")) {
    return {
      ...buildDeniedResult(
        false,
        "permission_denied",
        "Viewer role can access only view sections.",
        section,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  if (!roleMeetsSectionRequirement(adminUser, section)) {
    return {
      ...buildDeniedResult(
        false,
        "role_denied",
        `Role "${adminUser.adminUserRole}" cannot access "${section.sectionName}".`,
        section,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  const permissionResult = checkAdminPermission(
    adminUser.adminUserRole,
    section.requiredPermission,
  );

  if (!permissionResult.allowed) {
    return {
      ...buildDeniedResult(
        false,
        "permission_denied",
        permissionResult.reason,
        section,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: section.sectionPath,
    };
  }

  return {
    ...buildDeniedResult(true, null, null, section),
    adminUserId: adminUser.adminUserId,
    adminUserRole: adminUser.adminUserRole,
    path: section.sectionPath,
  };
}

export function guardAdminRouteAccess(
  adminUser: AdminUser,
  path: string,
): AdminWorkspaceGuardContext {
  const workspaceGuard = guardAdminWorkspaceAccess(adminUser);

  if (!workspaceGuard.allowed) {
    return {
      ...workspaceGuard,
      path,
    };
  }

  const section = resolveAdminSectionByPath(path);

  if (!section) {
    return {
      ...buildDeniedResult(
        false,
        "section_not_found",
        `No admin workspace section registered for path "${path}".`,
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path,
    };
  }

  const sectionGuard = guardAdminSectionAccess(adminUser, section.sectionId);

  return {
    ...sectionGuard,
    path,
  };
}

export function guardAdminSectionSlugAccess(
  adminUser: AdminUser,
  slug: string,
): AdminWorkspaceGuardContext {
  const section = resolveAdminSectionBySlug(slug);

  if (!section) {
    return {
      ...buildDeniedResult(
        false,
        "section_not_found",
        `Admin section "${slug}" was not found.`,
        null,
      ),
      adminUserId: adminUser.adminUserId,
      adminUserRole: adminUser.adminUserRole,
      path: `/admin/${slug}`,
    };
  }

  return {
    ...guardAdminSectionAccess(adminUser, section.sectionId),
    path: section.sectionPath,
  };
}
