// ==================================================
// SECTION: ADMIN APP — Bottom navigation
// РАЗДЕЛ: Нижняя навигация (mobile)
// ==================================================
"use client";

import Link from "next/link";
import {
  ADMIN_BOTTOM_NAV_ITEMS,
  resolveAdminBottomNavId,
} from "@/components/adminApp/foundation/navigation";
import styles from "@/components/adminApp/layout/AdminFoundationShell.module.css";

type AdminBottomNavProps = {
  pathname: string;
};

export function AdminBottomNav({ pathname }: AdminBottomNavProps) {
  const activeId = resolveAdminBottomNavId(pathname);

  return (
    <nav className={styles.tabBar} aria-label="Admin mobile navigation">
      {ADMIN_BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.tabDot} aria-hidden="true" />
            <span className={styles.tabLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
