// ==================================================
// SECTION: Admin Shell — layout wrapper
// РАЗДЕЛ: Оболочка Admin Control Center
// ==================================================
"use client";

import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import { formatAdminRoleLabel } from "@/components/adminEntry/adminNavigationItems";
import { ADMIN_ENTRY_LOGIN_PATH } from "@/components/adminEntry/adminEntryRoutes";
import { AdminDashboardHome } from "@/components/adminShell/AdminDashboardHome";
import { AdminModuleSwitcher } from "@/components/adminShell/AdminModuleSwitcher";
import { useAdminModule } from "@/components/adminShell/useAdminModule";
import styles from "@/components/adminShell/AdminShell.module.css";

export function AdminShell() {
  const [activeModuleId, setActiveModuleId] = useAdminModule();
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
      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerMain}>
              <AdminModuleSwitcher
                activeModuleId={activeModuleId}
                onModuleChange={setActiveModuleId}
              />
              <div className={styles.titleBlock}>
                <p className={styles.eyebrow}>Admin Control Center</p>
                <h1 className={styles.title}>Панель администратора</h1>
              </div>
            </div>

            <div className={styles.userBlock}>
              <p className={styles.userMeta}>
                Пользователь: <span className={styles.userName}>{displayName}</span> /{" "}
                {displayRole}
              </p>
              {session ? (
                <p className={styles.sessionBadge}>
                  <span className={styles.sessionDot} aria-hidden="true" />
                  Сессия активна
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
        </header>

        <main className={styles.content}>
          <AdminDashboardHome activeModuleId={activeModuleId} />
        </main>
      </div>
    </div>
  );
}
