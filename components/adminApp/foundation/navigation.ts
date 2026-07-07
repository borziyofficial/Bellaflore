// ==================================================
// SECTION: ADMIN APP — Navigation registry
// РАЗДЕЛ: Единый реестр навигации админ-приложения (Stage 1)
// ==================================================
import type {
  AdminBottomNavId,
  AdminNavItem,
  AdminSidebarId,
} from "@/components/adminApp/foundation/types";

export const ADMIN_BOTTOM_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "home",
    label: "Главная",
    href: "/admin",
    description: "Dashboard",
  },
  {
    id: "bouquets",
    label: "Букеты",
    href: "/admin/bouquets",
    description: "Catalog",
  },
  {
    id: "add",
    label: "Добавить",
    href: "/admin/add",
    description: "New bouquet",
  },
  {
    id: "orders",
    label: "Заказы",
    href: "/admin/orders",
    description: "Orders",
  },
  {
    id: "profile",
    label: "Профиль",
    href: "/admin/profile",
    description: "Account",
  },
];

export const ADMIN_SIDEBAR_ITEMS: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    description: "Overview",
  },
  {
    id: "bouquets",
    label: "Bouquets",
    href: "/admin/bouquets",
    description: "Product catalog",
  },
  {
    id: "categories",
    label: "Categories",
    href: "/admin/categories",
    description: "Category tree",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    description: "Order pipeline",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/admin/customers",
    description: "CRM",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "delivery",
    label: "Delivery",
    href: "/admin/delivery",
    description: "Routes & couriers",
    sidebarOnly: true,
  },
  {
    id: "promotions",
    label: "Promotions",
    href: "/admin/promotions",
    description: "Campaigns",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "smart-banner",
    label: "Smart Banner",
    href: "/admin/smart-banner",
    description: "Intelligent storefront promotion",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/admin/analytics",
    description: "Performance",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    description: "Alerts",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "automation",
    label: "Automation",
    href: "/admin/automation",
    description: "Workflows",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    description: "Store configuration",
    sidebarOnly: true,
    future: true,
  },
];

const BOTTOM_NAV_IDS = new Set<AdminBottomNavId>(
  ADMIN_BOTTOM_NAV_ITEMS.map((item) => item.id as AdminBottomNavId),
);

export function resolveAdminBottomNavId(pathname: string): AdminBottomNavId {
  if (pathname.startsWith("/admin/bouquets") || pathname.startsWith("/admin/products")) {
    return "bouquets";
  }
  if (pathname.startsWith("/admin/add")) {
    return "add";
  }
  if (pathname.startsWith("/admin/orders")) {
    return "orders";
  }
  if (pathname.startsWith("/admin/profile")) {
    return "profile";
  }
  return "home";
}

export function resolveAdminSidebarId(pathname: string): AdminSidebarId {
  if (pathname === "/admin" || pathname === "/admin/") {
    return "dashboard";
  }
  if (pathname.startsWith("/admin/bouquets") || pathname.startsWith("/admin/products")) {
    return "bouquets";
  }
  if (pathname.startsWith("/admin/categories")) {
    return "categories";
  }
  if (pathname.startsWith("/admin/orders")) {
    return "orders";
  }
  if (pathname.startsWith("/admin/customers") || pathname.startsWith("/admin/crm")) {
    return "customers";
  }
  if (pathname.startsWith("/admin/delivery")) {
    return "delivery";
  }
  if (pathname.startsWith("/admin/promotions")) {
    return "promotions";
  }
  if (pathname.startsWith("/admin/smart-banner")) {
    return "smart-banner";
  }
  if (pathname.startsWith("/admin/analytics")) {
    return "analytics";
  }
  if (pathname.startsWith("/admin/notifications")) {
    return "notifications";
  }
  if (pathname.startsWith("/admin/automation")) {
    return "automation";
  }
  if (pathname.startsWith("/admin/settings")) {
    return "settings";
  }
  if (pathname.startsWith("/admin/profile")) {
    return "settings";
  }
  if (pathname.startsWith("/admin/add")) {
    return "bouquets";
  }
  return "dashboard";
}

export function isAdminBottomNavRoute(pathname: string): boolean {
  return BOTTOM_NAV_IDS.has(resolveAdminBottomNavId(pathname));
}

export const ADMIN_FUTURE_MODULE_SLUGS = ADMIN_SIDEBAR_ITEMS.filter(
  (item) => item.future,
).map((item) => item.href.replace("/admin/", ""));
