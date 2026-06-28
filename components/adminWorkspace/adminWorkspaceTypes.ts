// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for adminWorkspace.
//
// Назначение (RU): Определения типов для adminWorkspace.
// ==================================================
import type {
  AdminPermission,
  AdminSection,
  AdminUserRole,
} from "@/components/adminCore/adminTypes";

export type AdminWorkspaceSectionId = AdminSection;

export type AdminWorkspaceConfig = {
  enabled: boolean;
  defaultSection: AdminWorkspaceSectionId;
  useAccessGuards: boolean;
  showDisabledSections: boolean;
  mobileAdminEnabled: boolean;
  desktopAdminEnabled: boolean;
};

export type AdminWorkspaceSection = {
  workspaceId: string;
  sectionId: AdminWorkspaceSectionId;
  sectionName: string;
  sectionPath: string;
  sectionIcon: string;
  sectionDescription: string;
  requiredPermission: AdminPermission;
  requiredRole: AdminUserRole | null;
  isEnabled: boolean;
  isVisible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminWorkspaceContext = {
  workspaceId: string;
  adminUserId: string;
  adminUserName: string;
  adminUserRole: AdminUserRole;
  defaultSectionId: AdminWorkspaceSectionId;
  visibleSections: AdminWorkspaceSection[];
  accessibleSections: AdminWorkspaceSection[];
  createdAt: string;
  updatedAt: string;
};

export type AdminAccessDeniedReason =
  | "workspace_disabled"
  | "section_disabled"
  | "section_not_found"
  | "permission_denied"
  | "role_denied"
  | "guard_disabled";

export type AdminAccessGuardResult = {
  allowed: boolean;
  reason: AdminAccessDeniedReason | null;
  message: string | null;
  section: AdminWorkspaceSection | null;
};

export type AdminWorkspaceGuardContext = AdminAccessGuardResult & {
  adminUserId: string;
  adminUserRole: AdminUserRole;
  path: string | null;
};
