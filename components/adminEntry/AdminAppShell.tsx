// ==================================================
// SECTION: ADMIN APP SHELL
// РАЗДЕЛ: Оболочка с сайдбаром (5 реальных разделов)
// ==================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import {
  ADMIN_APP_NAV_ITEMS,
  resolveAdminAppNavId,
} from "@/components/adminEntry/adminAppNavigation";
import { ADMIN_ENTRY_LOGIN_PATH } from "@/components/adminEntry/adminEntryRoutes";
import { formatAdminRoleLabel } from "@/components/adminEntry/adminNavigationItems";
import styles from "@/components/adminEntry/AdminAppShell.module.css";

type AdminAppShellProps = {
  children: ReactNode;
  title?: string;
};

export function AdminAppShell({ children, title }: AdminAppShellProps) {
  const pathname = usePathname();
  const activeNavId = resolveAdminAppNavId(pathname);
  const activeItem =
    ADMIN_APP_NAV_ITEMS.find((item) => item.id === activeNavId) ??
    ADMIN_APP_NAV_ITEMS[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const session = getAdminEntrySession();
  const adminUser = session ? adminUserFromSecuritySession(session) : null;
  const displayName = adminUser?.adminUserName ?? session?.userName ?? "—";
  const displayRole = formatAdminRoleLabel(
    session?.role ?? adminUser?.adminUserRole ?? "—",
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logoutAdminEntrySession();
    window.location.assign(ADMIN_ENTRY_LOGIN_PATH);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Открыть меню админки"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          ☰
        </button>
        <div className={styles.mobileTitleBlock}>
          <p className={styles.mobileEyebrow}>BellaFlore Admin</p>
          <h1 className={styles.mobileTitle}>{title ?? activeItem.label}</h1>
        </div>
      </header>

      {mobileMenuOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Закрыть меню"
          onClick={closeMobileMenu}
        />
      ) : null}

      <div className={styles.layout}>
        <aside
          className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}
          aria-label="Навигация админ-панели"
        >
          <div className={styles.sidebarHeader}>
            <div>
              <p className={styles.brandEyebrow}>BellaFlore</p>
              <p className={styles.brandTitle}>Admin</p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Закрыть меню"
              onClick={closeMobileMenu}
            >
              ×
            </button>
          </div>

          <nav className={styles.nav}>
            {ADMIN_APP_NAV_ITEMS.map((item) => {
              const isActive = item.id === activeNavId;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </Link>
              );
            })}
          </nav>

          {session ? (
            <div className={styles.sidebarFooter}>
              <p className={styles.userMeta}>
                {displayName} · {displayRole}
              </p>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Выйти
              </button>
            </div>
          ) : null}
        </aside>

        <main className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
