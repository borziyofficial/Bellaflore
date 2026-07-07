// ==================================================
// SECTION: ADMIN APP — Foundation types
// РАЗДЕЛ: Типы фундамента админ-приложения (Stage 1)
// ==================================================

export type AdminBottomNavId =
  | "home"
  | "bouquets"
  | "add"
  | "orders"
  | "profile";

export type AdminSidebarId =
  | "dashboard"
  | "bouquets"
  | "categories"
  | "orders"
  | "customers"
  | "delivery"
  | "promotions"
  | "smart-banner"
  | "analytics"
  | "notifications"
  | "automation"
  | "settings";

export type AdminNavItem = {
  id: AdminBottomNavId | AdminSidebarId;
  label: string;
  href: string;
  description?: string;
  /** Sidebar-only modules not in mobile bottom bar */
  sidebarOnly?: boolean;
  /** Module prepared for a future stage */
  future?: boolean;
};
