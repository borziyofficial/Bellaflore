// ==================================================
// SECTION: ADMIN APP — Future module metadata
// ==================================================

export type AdminFutureModuleConfig = {
  slug: string;
  title: string;
  subtitle: string;
  bullets?: string[];
};

export const ADMIN_FUTURE_MODULES: Record<string, AdminFutureModuleConfig> = {
  categories: {
    slug: "categories",
    title: "Categories",
    subtitle: "Category tree aligned with storefront tabs",
  },
  customers: {
    slug: "customers",
    title: "Customers",
    subtitle: "CRM and customer history",
  },
  promotions: {
    slug: "promotions",
    title: "Promotions",
    subtitle: "Campaigns and seasonal offers",
  },
  "smart-banner": {
    slug: "smart-banner",
    title: "Smart Banner",
    subtitle: "Intelligent storefront promotion engine",
    bullets: [
      "Automatic promotion of bouquets",
      "Views, favorites, orders, searches",
      "Conversion and seasonality signals",
      "Admin priority and manual override",
      "Disable and rollback controls",
    ],
  },
  analytics: {
    slug: "analytics",
    title: "Analytics",
    subtitle: "Store performance and conversion",
  },
  notifications: {
    slug: "notifications",
    title: "Notifications",
    subtitle: "Alerts and Telegram delivery",
  },
  automation: {
    slug: "automation",
    title: "Automation",
    subtitle: "Workflows and scheduled actions",
  },
  settings: {
    slug: "settings",
    title: "Settings",
    subtitle: "Store configuration and admin preferences",
  },
};

export function getAdminFutureModule(slug: string): AdminFutureModuleConfig | null {
  return ADMIN_FUTURE_MODULES[slug] ?? null;
}
