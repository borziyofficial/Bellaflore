// ==================================================
// SECTION: ADMIN APP — Foundation shell
// РАЗДЕЛ: Оболочка админ-приложения Stage 1
// ==================================================
"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import { ADMIN_ENTRY_LOGIN_PATH } from "@/components/adminEntry/adminEntryRoutes";
import { formatAdminRoleLabel } from "@/components/adminEntry/adminNavigationItems";
import { AdminBottomNav } from "@/components/adminApp/layout/AdminBottomNav";
import { AdminSidebar } from "@/components/adminApp/layout/AdminSidebar";
import styles from "@/components/adminApp/layout/AdminFoundationShell.module.css";

type AdminFoundationShellProps = {
  children: ReactNode;
  title?: string;
};

export function AdminFoundationShell({
  children,
  title = "Admin",
}: AdminFoundationShellProps) {
  const pathname = usePathname() ?? "/admin";
  const session = getAdminEntrySession();
  const adminUser = session ? adminUserFromSecuritySession(session) : null;
  const displayName = adminUser?.adminUserName ?? session?.userName ?? "—";
  const displayRole = formatAdminRoleLabel(
    session?.role ?? adminUser?.adminUserRole ?? "—",
  );

  const handleLogout = () => {
    logoutAdminEntrySession();
    window.location.assign(ADMIN_ENTRY_LOGIN_PATH);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.appFrame} aria-label={`${title} admin panel`}>
        <AdminSidebar pathname={pathname} />

        <div className={styles.mainColumn}>
          <header className={styles.topBar}>
            <div className={styles.topBarMain}>
              <p className={styles.eyebrow}>BellaFlore Admin</p>
              <h1 className={styles.pageTitle}>{title}</h1>
            </div>

            {session ? (
              <div className={styles.userPill}>
                <p className={styles.userMeta}>
                  <span>{displayName}</span>
                  <span>{displayRole}</span>
                </p>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            ) : null}
          </header>

          <main className={styles.content}>
            <div className={styles.contentInner}>{children}</div>
          </main>

          <AdminBottomNav pathname={pathname} />
        </div>
      </div>
    </div>
  );
}
