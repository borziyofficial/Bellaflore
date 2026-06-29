// ==================================================
// SECTION: Admin — Workspace Home
// РАЗДЕЛ: Admin — главная workspace
// ==================================================

"use client";

import { useMemo } from "react";
import {
  AdminEntryGate,
  AdminNavigationShell,
  adminUserFromSecuritySession,
  getAdminEntrySession,
} from "@/components/adminEntry";
import { AdminWorkspaceDashboard } from "@/components/adminWorkspace/AdminWorkspaceDashboard";
import { AdminWorkspaceLayout } from "@/components/adminWorkspace/AdminWorkspaceLayout";
import { guardAdminWorkspaceAccess } from "@/components/adminWorkspace/adminAccessGuards";

function AdminWorkspaceHomeContent() {
  const adminUser = useMemo(() => {
    const currentSession = getAdminEntrySession();
    return currentSession ? adminUserFromSecuritySession(currentSession) : null;
  }, []);

  const workspaceGuard = useMemo(
    () => (adminUser ? guardAdminWorkspaceAccess(adminUser) : null),
    [adminUser],
  );

  if (!adminUser || !workspaceGuard) {
    return null;
  }

  if (!workspaceGuard.allowed) {
    return (
      <AdminNavigationShell activeRoute="/admin">
        <AdminWorkspaceLayout
          title="Панель управления"
          description={workspaceGuard.message ?? "Доступ к workspace запрещён."}
          adminUserName={adminUser.adminUserName}
          adminUserRole={adminUser.adminUserRole}
          backHref=""
        />
      </AdminNavigationShell>
    );
  }

  return (
    <AdminNavigationShell activeRoute="/admin">
      <AdminWorkspaceDashboard
        adminUserName={adminUser.adminUserName}
        adminUserRole={adminUser.adminUserRole}
      />
    </AdminNavigationShell>
  );
}

export default function AdminWorkspaceHomePage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminWorkspaceHomeContent />
    </AdminEntryGate>
  );
}
