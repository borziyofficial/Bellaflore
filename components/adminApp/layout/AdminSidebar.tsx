// ==================================================
// SECTION: ADMIN APP — Sidebar navigation
// РАЗДЕЛ: Боковая навигация (desktop)
// ==================================================
"use client";

import Link from "next/link";
import {
  ADMIN_SIDEBAR_ITEMS,
  resolveAdminSidebarId,
} from "@/components/adminApp/foundation/navigation";
import styles from "@/components/adminApp/layout/AdminFoundationShell.module.css";

type AdminSidebarProps = {
  pathname: string;
};

export function AdminSidebar({ pathname }: AdminSidebarProps) {
  const activeId = resolveAdminSidebarId(pathname);

  return (
    <aside className={styles.sidebar} aria-label="Боковая навигация админ-панели">
      <div className={styles.sidebarBrand}>
        <span className={styles.brandMark} aria-hidden="true">
          B
        </span>
        <div>
          <p className={styles.sidebarEyebrow}>BellaFlore</p>
          <p className={styles.sidebarTitle}>Админ</p>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        {ADMIN_SIDEBAR_ITEMS.map((item) => {
          const isActive = item.id === activeId;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.sidebarLinkLabel}>{item.label}</span>
              {item.future ? (
                <span className={styles.sidebarFutureTag}>Скоро</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
