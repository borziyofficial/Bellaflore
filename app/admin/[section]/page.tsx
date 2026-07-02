// ==================================================
// SECTION: Admin — Dynamic Section Page
// РАЗДЕЛ: Admin — динамическая страница раздела
//
// Purpose (EN): Resolves admin workspace section by URL slug and renders placeholder or access-denied panel.
//
// Назначение (RU): Разрешает раздел admin workspace по URL-slug и рендерит placeholder или панель отказа в доступе.
// ==================================================

"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  AdminWorkspaceDeniedPanel,
  AdminWorkspaceLayout,
  AdminWorkspacePlaceholderPanel,
} from "@/components/adminWorkspace/AdminWorkspaceLayout";
import { guardAdminSectionSlugAccess } from "@/components/adminWorkspace/adminAccessGuards";
import { resolveAdminSectionBySlug } from "@/components/adminWorkspace/adminWorkspaceEngine";
import { getTestAdminUser } from "@/components/adminWorkspace/testAdminUser";

export default function AdminWorkspaceSectionPage() {
  const params = useParams<{ section: string }>();
  const sectionSlug = typeof params.section === "string" ? params.section : "";
  const adminUser = useMemo(() => getTestAdminUser(), []);
  const section = useMemo(
    () => resolveAdminSectionBySlug(sectionSlug),
    [sectionSlug],
  );
  const sectionGuard = useMemo(
    () => guardAdminSectionSlugAccess(adminUser, sectionSlug),
    [adminUser, sectionSlug],
  );

  if (!section) {
    return (
      <AdminWorkspaceLayout
        title="Раздел не найден"
        description={`Section "${sectionSlug}" is not registered in Admin Workspace.`}
        adminUserName={adminUser.adminUserName}
        adminUserRole={adminUser.adminUserRole}
      >
        <AdminWorkspaceDeniedPanel
          message={`Раздел "${sectionSlug}" не найден в registry.`}
        />
      </AdminWorkspaceLayout>
    );
  }

  if (!sectionGuard.allowed) {
    return (
      <AdminWorkspaceLayout
        title={section.sectionName}
        description={section.sectionDescription}
        adminUserName={adminUser.adminUserName}
        adminUserRole={adminUser.adminUserRole}
      >
        <AdminWorkspaceDeniedPanel
          message={sectionGuard.message ?? "Доступ запрещён"}
        />
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={section.sectionName}
      description={section.sectionDescription}
      adminUserName={adminUser.adminUserName}
      adminUserRole={adminUser.adminUserRole}
    >
      <AdminWorkspacePlaceholderPanel sectionName={section.sectionName} />
    </AdminWorkspaceLayout>
  );
}
