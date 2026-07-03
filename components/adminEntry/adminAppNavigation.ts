// ==================================================
// SECTION: ADMIN APP — real navigation (5 sections)
// РАЗДЕЛ: Навигация только по рабочим разделам
// ==================================================

export type AdminAppNavId =
  | "dashboard"
  | "products"
  | "orders"
  | "delivery"
  | "clients";

export type AdminAppNavItem = {
  id: AdminAppNavId;
  label: string;
  href: string;
  description: string;
};

export const ADMIN_APP_NAV_ITEMS: AdminAppNavItem[] = [
  {
    id: "dashboard",
    label: "Дашборд",
    href: "/admin",
    description: "Обзор и быстрые переходы",
  },
  {
    id: "products",
    label: "Товары",
    href: "/admin/products",
    description: "Каталог, цены, фото",
  },
  {
    id: "orders",
    label: "Заказы",
    href: "/admin/orders",
    description: "Статусы и обработка",
  },
  {
    id: "delivery",
    label: "Доставка",
    href: "/admin/delivery",
    description: "Зоны и планировщик",
  },
  {
    id: "clients",
    label: "Клиенты",
    href: "/admin/crm/clients",
    description: "CRM и история заказов",
  },
];

export function resolveAdminAppNavId(pathname: string): AdminAppNavId {
  if (pathname.startsWith("/admin/products")) {
    return "products";
  }
  if (pathname.startsWith("/admin/orders")) {
    return "orders";
  }
  if (pathname.startsWith("/admin/delivery")) {
    return "delivery";
  }
  if (pathname.startsWith("/admin/crm")) {
    return "clients";
  }
  return "dashboard";
}
