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
import shellTheme from "@/components/adminEntry/adminShellTheme.module.css";
import { AdminWorkspaceLayout } from "@/components/adminWorkspace/AdminWorkspaceLayout";
import workspaceStyles from "@/components/adminWorkspace/AdminWorkspaceLayout.module.css";
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
      <AdminWorkspaceLayout
        title="📈 Панель управления"
        description="Основное рабочее пространство админ-панели Bellaflore."
        adminUserName={adminUser.adminUserName}
        adminUserRole={adminUser.adminUserRole}
        sections={visibleSections}
        backHref=""
      >
        <section
          className={`${workspaceStyles.card} ${workspaceStyles.placeholderCard}`}
        >
          <p className={workspaceStyles.eyebrow}>Скоро</p>
          <h3 className={workspaceStyles.placeholderTitle}>Каталог и фото товаров</h3>
          <p className={workspaceStyles.muted} style={{ marginTop: "10px" }}>
            Здесь позже будет управление букетами, фото, категориями, ценами и
            карточками товаров.
          </p>
          <p className={workspaceStyles.placeholderNote}>
            Загрузка фото и catalog engine пока не подключены.
          </p>
        </section>

        <section className={`${shellTheme.surfaceCard} ${shellTheme.contentStack}`}>
          <p className={shellTheme.eyebrow}>Контекст workspace</p>
          <div className={workspaceStyles.contextGrid}>
            <p className={workspaceStyles.contextRow}>
              <span className={workspaceStyles.contextLabel}>ID workspace:</span>
              {workspaceContext.workspaceId}
            </p>
            <p className={workspaceStyles.contextRow}>
              <span className={workspaceStyles.contextLabel}>Раздел по умолчанию:</span>
              {workspaceContext.defaultSectionId}
            </p>
            <p className={workspaceStyles.contextRow}>
              <span className={workspaceStyles.contextLabel}>Доступных разделов:</span>
              {workspaceContext.accessibleSections.length}
            </p>
          </div>
          <p className={workspaceStyles.legacyLinks}>
            Legacy-маршруты: <Link href="/admin/orders">/admin/orders</Link>
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
