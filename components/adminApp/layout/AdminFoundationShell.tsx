// ==================================================
// SECTION: ADMIN APP — Foundation shell
// РАЗДЕЛ: Оболочка админ-приложения Stage 1
// ==================================================
"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import { ADMIN_ENTRY_LOGIN_PATH } from "@/components/adminEntry/adminEntryRoutes";
import { formatAdminRoleLabel } from "@/components/adminEntry/adminNavigationItems";
import { AdminBottomNav } from "@/components/adminApp/layout/AdminBottomNav";
import { AdminSidebar } from "@/components/adminApp/layout/AdminSidebar";
import { prefetchAdminCatalog } from "@/components/adminCatalogManager/adminCatalogCache";
import { fetchAdminCategories } from "@/components/adminCatalogManager/adminCustomCategories";
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

  // Warm the catalog + category caches once per admin session, as soon as
  // the persistent shell mounts — regardless of which section loads first.
  // By the time the admin taps "Букеты" or "Добавить", the data is already
  // loaded (or loading), so the section switch itself never blocks on it.
  useEffect(() => {
    prefetchAdminCatalog();
    void fetchAdminCategories();
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.appFrame} aria-label={`${title} — админ-панель`}>
        <AdminSidebar pathname={pathname} />

        <div className={styles.mainColumn}>
          <header className={styles.topBar}>
            <div className={styles.topBarMain}>
              <p className={styles.eyebrow}>BellaFlore Админ</p>
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
