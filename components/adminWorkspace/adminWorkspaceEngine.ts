// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Рабочее пространство админки
//
// Purpose (EN): Workspace layout, sections, access guards, and navigation config.
//
// Назначение (RU): Макет, разделы, проверки доступа и конфигурация навигации админки.
// ==================================================
import { getAdminConfig } from "@/components/adminCore/adminConfig";
import {
  checkAdminPermission,
  getPermissionsForRole,
} from "@/components/adminCore/adminPermissionEngine";
import type { AdminUser } from "@/components/adminCore/adminTypes";
import { getAdminWorkspaceConfig } from "@/components/adminWorkspace/adminWorkspaceConfig";
import {
  getAdminWorkspaceId,
  getAdminWorkspaceSectionById,
  getAdminWorkspaceSectionRegistry,
  resolveAdminWorkspaceSectionByPath,
  resolveAdminWorkspaceSectionSlug,
} from "@/components/adminWorkspace/adminWorkspaceSections";
import type {
  AdminWorkspaceContext,
  AdminWorkspaceSection,
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
function roleMeetsSectionRequirement(
  adminUser: AdminUser,
  section: AdminWorkspaceSection,
): boolean {
  if (adminUser.adminUserRole === "owner") {
    return true;
  }

  if (!section.requiredRole) {
    return true;
  }

  return adminUser.adminUserRole === section.requiredRole;
}

function canAccessWorkspaceSection(
  adminUser: AdminUser,
  section: AdminWorkspaceSection,
): boolean {
  const workspaceConfig = getAdminWorkspaceConfig();
  const adminConfig = getAdminConfig();

  if (!workspaceConfig.enabled || !section.isEnabled) {
    return false;
  }

  if (!section.isVisible && !workspaceConfig.showDisabledSections) {
    return false;
  }

  if (
    adminConfig.allowOwnerOverride &&
    adminUser.adminUserRole === "owner"
  ) {
    return true;
  }

  if (!roleMeetsSectionRequirement(adminUser, section)) {
    return false;
  }

  const permissionResult = checkAdminPermission(
    adminUser.adminUserRole,
    section.requiredPermission,
  );

  return permissionResult.allowed;
}

function filterSectionsForViewer(
  adminUser: AdminUser,
  sections: AdminWorkspaceSection[],
): AdminWorkspaceSection[] {
  if (adminUser.adminUserRole !== "viewer") {
    return sections;
  }

  return sections.filter((section) =>
    section.requiredPermission.startsWith("view_"),
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getAdminWorkspaceSections(
  adminUser: AdminUser,
): AdminWorkspaceSection[] {
  const workspaceConfig = getAdminWorkspaceConfig();

  if (!workspaceConfig.enabled) {
    return [];
  }

  const registry = getAdminWorkspaceSectionRegistry();

  return filterSectionsForViewer(
    adminUser,
    registry.filter((section) => {
      if (!section.isEnabled) {
        return workspaceConfig.showDisabledSections;
      }

      return canAccessWorkspaceSection(adminUser, section);
    }),
  );
}

export function getAdminVisibleSections(
  adminUser: AdminUser,
): AdminWorkspaceSection[] {
  const workspaceConfig = getAdminWorkspaceConfig();

  return getAdminWorkspaceSections(adminUser).filter((section) => {
    if (section.isVisible) {
      return true;
    }

    return workspaceConfig.showDisabledSections;
  });
}

export function getAdminDefaultSection(
  adminUser: AdminUser,
): AdminWorkspaceSection | null {
  const workspaceConfig = getAdminWorkspaceConfig();
  const visibleSections = getAdminVisibleSections(adminUser);

  if (visibleSections.length === 0) {
    return null;
  }

  const configuredDefault = visibleSections.find(
    (section) => section.sectionId === workspaceConfig.defaultSection,
  );

  return configuredDefault ?? visibleSections[0] ?? null;
}

export function canOpenAdminSection(
  adminUser: AdminUser,
  sectionId: AdminWorkspaceSectionId,
): boolean {
  const section = getAdminWorkspaceSectionById(sectionId);

  if (!section) {
    return false;
  }

  return canAccessWorkspaceSection(adminUser, section);
}

export function buildAdminWorkspaceContext(
  adminUser: AdminUser,
): AdminWorkspaceContext {
  const now = new Date().toISOString();
  const visibleSections = getAdminVisibleSections(adminUser);
  const accessibleSections = getAdminWorkspaceSections(adminUser);
  const defaultSection = getAdminDefaultSection(adminUser);

  return {
    workspaceId: getAdminWorkspaceId(),
    adminUserId: adminUser.adminUserId,
    adminUserName: adminUser.adminUserName,
    adminUserRole: adminUser.adminUserRole,
    defaultSectionId: defaultSection?.sectionId ?? "orders",
    visibleSections,
    accessibleSections,
    createdAt: now,
    updatedAt: now,
  };
}

export function resolveAdminSectionByPath(
  path: string,
): AdminWorkspaceSection | null {
  return resolveAdminWorkspaceSectionByPath(path);
}

export function resolveAdminSectionBySlug(
  slug: string,
): AdminWorkspaceSection | null {
  return resolveAdminWorkspaceSectionSlug(slug);
}

export function getAdminWorkspacePermissionsPreview(
  adminUser: AdminUser,
): string[] {
  return getPermissionsForRole(adminUser.adminUserRole);
}
