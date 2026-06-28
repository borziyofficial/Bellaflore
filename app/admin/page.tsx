// ==================================================
// SECTION: Admin — Workspace Home
// РАЗДЕЛ: Admin — главная workspace
// ==================================================

"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AdminEntryGate,
  AdminNavigationShell,
  adminUserFromSecuritySession,
  getAdminEntrySession,
} from "@/components/adminEntry";
import { AdminWorkspaceLayout } from "@/components/adminWorkspace/AdminWorkspaceLayout";
import { guardAdminWorkspaceAccess } from "@/components/adminWorkspace/adminAccessGuards";
import {
  buildAdminWorkspaceContext,
  getAdminVisibleSections,
} from "@/components/adminWorkspace/adminWorkspaceEngine";

function AdminWorkspaceHomeContent() {
  const adminUser = useMemo(() => {
    const currentSession = getAdminEntrySession();
    return currentSession ? adminUserFromSecuritySession(currentSession) : null;
  }, []);

  const workspaceGuard = useMemo(
    () => (adminUser ? guardAdminWorkspaceAccess(adminUser) : null),
    [adminUser],
  );
  const workspaceContext = useMemo(
    () => (adminUser ? buildAdminWorkspaceContext(adminUser) : null),
    [adminUser],
  );
  const visibleSections = useMemo(
    () => (adminUser ? getAdminVisibleSections(adminUser) : []),
    [adminUser],
  );

  if (!adminUser || !workspaceGuard || !workspaceContext) {
    return null;
  }

  if (!workspaceGuard.allowed) {
    return (
      <AdminNavigationShell activeRoute="/admin">
        <AdminWorkspaceLayout
          title="Admin Workspace"
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
      <AdminWorkspaceLayout
        title="Admin Workspace Foundation"
        description="Архитектурное ядро рабочего пространства админ-панели. Navigation shell — Stage 42."
        adminUserName={adminUser.adminUserName}
        adminUserRole={adminUser.adminUserRole}
        sections={visibleSections}
        backHref=""
      >
        <section
          style={{
            border: "1px solid rgba(138, 107, 61, 0.18)",
            borderRadius: "8px",
            padding: "18px",
            background: "#ffffff",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#8a6b3d",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Workspace Context
          </p>
          <p style={{ margin: "12px 0 0", color: "#75695c", lineHeight: 1.5 }}>
            Workspace ID: {workspaceContext.workspaceId}
            <br />
            Default section: {workspaceContext.defaultSectionId}
            <br />
            Accessible sections: {workspaceContext.accessibleSections.length}
          </p>
          <p style={{ margin: "12px 0 0", color: "#75695c" }}>
            Legacy admin routes:{" "}
            <Link href="/admin/orders">/admin/orders</Link>
            {" · "}
            <Link href="/admin/crm">/admin/crm</Link>
          </p>
        </section>
      </AdminWorkspaceLayout>
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
