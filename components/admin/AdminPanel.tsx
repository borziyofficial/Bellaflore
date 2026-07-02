// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админ-панель
//
// Purpose (EN):
// Root admin panel shell with navigation chrome
//
// Назначение (RU):
// Корневая оболочка админ-панели
// ==================================================
"use client";

import { AdminDashboardContent } from "@/components/admin/AdminDashboardContent";
import { AdminDeliveryPlannerContent } from "@/components/admin/AdminDeliveryPlannerContent";
import { AdminOrdersContent } from "@/components/admin/AdminOrdersContent";
import styles from "@/components/admin/AdminPanel.module.css";
import { useState, type ReactNode } from "react";

const ADMIN_NAV_ITEMS = [
  "Dashboard",
  "Orders",
  "Delivery Planner",
  "Catalog",
  "Customers",
  "Couriers",
  "Analytics",
  "Settings",
] as const;

type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number];

type AdminPanelProps = {
  children?: ReactNode;
};

function AdminSectionPlaceholder({ section }: { section: AdminNavItem }) {
  return (
    <section className={styles.adminPlaceholder} aria-live="polite">
      <p className={styles.adminPlaceholderEyebrow}>Admin foundation</p>
      <h2 className={styles.adminPlaceholderTitle}>{section}</h2>
      <p className={styles.adminPlaceholderText}>
        This section is a placeholder for the future BellaFlore admin workspace.
        Navigation is visual only for now.
      </p>
    </section>
  );
}

function renderAdminSection(section: AdminNavItem) {
  if (section === "Dashboard") {
    return <AdminDashboardContent />;
  }

  if (section === "Orders") {
    return <AdminOrdersContent />;
  }

  if (section === "Delivery Planner") {
    return <AdminDeliveryPlannerContent />;
  }

  return <AdminSectionPlaceholder section={section} />;
}

export function AdminPanel({ children }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminNavItem>("Dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const handleNavSelect = (section: AdminNavItem) => {
    setActiveSection(section);
    closeMobileSidebar();
  };

  return (
    <div className={styles.adminShell}>
      {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Мобильный заголовок с меню
Purpose (EN): Mobile header with menu toggle
Назначение (RU): Мобильный заголовок с меню
================================================== */}
      <header className={styles.adminMobileHeader}>
        <button
          type="button"
          className={styles.adminMenuButton}
          aria-label="Open admin menu"
          aria-expanded={mobileSidebarOpen}
          onClick={() => setMobileSidebarOpen(true)}
        >
          ☰
        </button>
        <p className={styles.adminMobileTitle}>BellaFlore Admin</p>
      </header>

      {mobileSidebarOpen ? (
        <button
          type="button"
          className={styles.adminBackdrop}
          aria-label="Close admin menu"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <div className={styles.adminLayout}>
        {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Боковая навигация админки
Purpose (EN): Sidebar navigation
Назначение (RU): Боковая навигация админки
================================================== */}
        <aside
          className={`${styles.adminSidebar} ${
            mobileSidebarOpen ? styles.adminSidebarOpen : ""
          }`}
          aria-label="Admin navigation"
        >
          <div className={styles.adminSidebarHeader}>
            <div>
              <p className={styles.adminBrandEyebrow}>BellaFlore</p>
              <h1 className={styles.adminBrandTitle}>Admin Panel</h1>
            </div>
            <button
              type="button"
              className={styles.adminCloseButton}
              aria-label="Close admin menu"
              onClick={closeMobileSidebar}
            >
              ×
            </button>
          </div>

          <nav className={styles.adminNav}>
            {ADMIN_NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.adminNavItem} ${
                  activeSection === item ? styles.adminNavItemActive : ""
                }`}
                aria-current={activeSection === item ? "page" : undefined}
                onClick={() => handleNavSelect(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* ==================================================
SECTION: ADMIN
РАЗДЕЛ: Область контента активного раздела
Purpose (EN): Active section content area
Назначение (RU): Область контента активного раздела
================================================== */}
        <main className={styles.adminContent}>
          {children ?? renderAdminSection(activeSection)}
        </main>
      </div>
    </div>
  );
}
