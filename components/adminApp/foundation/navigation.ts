// ==================================================
// SECTION: ADMIN APP — Navigation registry
// РАЗДЕЛ: Единый реестр навигации админ-приложения (Stage 1)
// ==================================================
import type {
  AdminBottomNavId,
  AdminNavItem,
  AdminSidebarId,
} from "@/components/adminApp/foundation/types";
import { getAdminFutureModule } from "@/components/adminApp/foundation/futureModules";

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
    label: "Главная",
    href: "/admin",
    description: "Обзор",
  },
  {
    id: "bouquets",
    label: "Букеты",
    href: "/admin/bouquets",
    description: "Каталог товаров",
  },
  {
    id: "categories",
    label: "Категории",
    href: "/admin/categories",
    description: "Дерево категорий",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "orders",
    label: "Заказы",
    href: "/admin/orders",
    description: "Поток заказов",
  },
  {
    id: "customers",
    label: "Клиенты",
    href: "/admin/customers",
    description: "CRM",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "delivery",
    label: "Доставка",
    href: "/admin/delivery",
    description: "Маршруты и курьеры",
    sidebarOnly: true,
  },
  {
    id: "promotions",
    label: "Акции",
    href: "/admin/promotions",
    description: "Кампании",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "smart-banner",
    label: "Умный баннер",
    href: "/admin/smart-banner",
    description: "Управление главной страницей",
    sidebarOnly: true,
  },
  {
    id: "analytics",
    label: "Аналитика",
    href: "/admin/analytics",
    description: "Показатели",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "notifications",
    label: "Уведомления",
    href: "/admin/notifications",
    description: "Оповещения",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "automation",
    label: "Автоматизация",
    href: "/admin/automation",
    description: "Рабочие процессы",
    sidebarOnly: true,
    future: true,
  },
  {
    id: "settings",
    label: "Настройки",
    href: "/admin/settings",
    description: "Настройки магазина",
    sidebarOnly: true,
    future: true,
  },
];

const BOTTOM_NAV_IDS = new Set<AdminBottomNavId>(
  ADMIN_BOTTOM_NAV_ITEMS.map((item) => item.id as AdminBottomNavId),
);

export function resolveAdminBottomNavId(pathname: string): AdminBottomNavId {
  if (
    pathname.startsWith("/admin/bouquets") ||
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/edit")
  ) {
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
  if (pathname.startsWith("/admin/add") || pathname.startsWith("/admin/edit")) {
    return "bouquets";
  }
  return "dashboard";
}

export function isAdminBottomNavRoute(pathname: string): boolean {
  return BOTTOM_NAV_IDS.has(resolveAdminBottomNavId(pathname));
}

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Главная",
  "/admin/bouquets": "Букеты",
  "/admin/add": "Добавить товар",
  "/admin/orders": "Заказы",
  "/admin/profile": "Профиль",
  "/admin/smart-banner": "Умный баннер",
};

export function resolveAdminPageTitle(pathname: string): string {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (ADMIN_PAGE_TITLES[normalized]) {
    return ADMIN_PAGE_TITLES[normalized];
  }

  if (normalized.startsWith("/admin/edit/")) {
    return "Редактировать товар";
  }

  const sectionMatch = normalized.match(/^\/admin\/([^/]+)$/);
  if (sectionMatch) {
    const futureModule = getAdminFutureModule(sectionMatch[1]);
    if (futureModule) {
      return futureModule.title;
    }
  }

  return "Админ-панель";
}

export const ADMIN_FUTURE_MODULE_SLUGS = ADMIN_SIDEBAR_ITEMS.filter(
  (item) => item.future,
).map((item) => item.href.replace("/admin/", ""));
