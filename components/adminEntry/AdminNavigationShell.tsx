// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Navigation shell
// ==================================================
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import styles from "@/components/adminEntry/AdminNavigationShell.module.css";
import {
  ADMIN_NAVIGATION_ITEMS,
  formatAdminRoleLabel,
  getAdminNavigationItemByRoute,
} from "@/components/adminEntry/adminNavigationItems";
import { ADMIN_ENTRY_LOGIN_PATH } from "@/components/adminEntry/adminEntryRoutes";
import type { AdminEntryRoutePath } from "@/components/adminEntry/adminEntryTypes";

type AdminNavigationShellProps = {
  activeRoute: AdminEntryRoutePath;
  children: ReactNode;
};

export function AdminNavigationShell({
  activeRoute,
  children,
}: AdminNavigationShellProps) {
  const session = getAdminEntrySession();
  const activeItem = getAdminNavigationItemByRoute(activeRoute);
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
      <div className={styles.appFrame}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerTop}>
              <div className={styles.brandBlock}>
                <p className={styles.eyebrow}>Bellaflore · Админ</p>
                <h1 className={styles.title}>{activeItem?.label ?? "Админ"}</h1>
                <p className={styles.sectionTitle}>
                  {activeItem?.description ?? "Внутреннее приложение администратора"}
                </p>
              </div>

              <div className={styles.userBlock}>
                <p className={styles.userMeta}>
                  Пользователь: <span className={styles.userName}>{displayName}</span> /{" "}
                  {displayRole}
                </p>
                {session ? (
                  <p className={styles.sessionBadge}>
                    <span className={styles.sessionDot} aria-hidden="true" />
                    Защищённая сессия активна
                  </p>
                ) : null}
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            </div>

            <nav className={styles.nav} aria-label="Навигация админ-панели">
              {ADMIN_NAVIGATION_ITEMS.map((item) => {
                const isActive = item.route === activeRoute;

                return (
                  <Link
                    key={item.id}
                    href={item.route}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navDescription}>{item.shortLabel}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
