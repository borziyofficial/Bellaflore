// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Navigation catalog
// ==================================================
import type {
  AdminNavigationItem,
  AdminNavigationSectionId,
  AdminRole,
} from "@/components/adminIntelligence/adminIntelligenceTypes";
import { getPermissionsForRole } from "@/components/adminIntelligence/adminRolesCatalog";

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Сводка операций и attention items",
    route: "/admin",
    icon: "layout-dashboard",
    permissions: ["orders.view"],
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "orders",
    title: "Orders",
    description: "Заказы и CRM lifecycle",
    route: "/admin/orders",
    icon: "shopping-bag",
    permissions: ["orders.view"],
    enabled: true,
    sortOrder: 2,
  },
  {
    id: "catalog",
    title: "Catalog",
    description: "Товары, коллекции и публикация",
    route: "/admin/catalog",
    icon: "flower",
    permissions: ["catalog.view"],
    enabled: true,
    sortOrder: 3,
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Склад, остатки и резервирование",
    route: "/admin/inventory",
    icon: "warehouse",
    permissions: ["inventory.view"],
    enabled: true,
    sortOrder: 4,
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Задачи доставки и интервалы",
    route: "/admin/delivery",
    icon: "truck",
    permissions: ["delivery.view"],
    enabled: true,
    sortOrder: 5,
  },
  {
    id: "couriers",
    title: "Couriers",
    description: "Профили курьеров и назначения",
    route: "/admin/couriers",
    icon: "users",
    permissions: ["couriers.view"],
    enabled: true,
    sortOrder: 6,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Очередь и правила уведомлений",
    route: "/admin/notifications",
    icon: "bell",
    permissions: ["notifications.view"],
    enabled: true,
    sortOrder: 7,
  },
  {
    id: "workflow",
    title: "Workflow",
    description: "Workflow engine и шаги заказа",
    route: "/admin/workflow",
    icon: "git-branch",
    permissions: ["workflow.view"],
    enabled: true,
    sortOrder: 8,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Отчёты и метрики операций",
    route: "/admin/analytics",
    icon: "bar-chart",
    permissions: ["analytics.view"],
    enabled: true,
    sortOrder: 9,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Настройки админ-системы",
    route: "/admin/settings",
    icon: "settings",
    permissions: ["system.view"],
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "system_brain",
    title: "System Brain",
    description: "Control plane и диагностика модулей",
    route: "/admin/system-brain",
    icon: "cpu",
    permissions: ["system.view"],
    enabled: true,
    sortOrder: 11,
  },
];

export function getAdminNavigationItemById(
  id: AdminNavigationSectionId,
): AdminNavigationItem | null {
  return ADMIN_NAVIGATION_ITEMS.find((item) => item.id === id) ?? null;
}

export function getAdminNavigationForRole(role: AdminRole): AdminNavigationItem[] {
  const rolePermissions = new Set(getPermissionsForRole(role));

  return ADMIN_NAVIGATION_ITEMS.filter((item) => {
    if (!item.enabled) {
      return false;
    }

    return item.permissions.some((permission) => rolePermissions.has(permission));
  }).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getAdminNavigationTree(): AdminNavigationItem[] {
  return [...ADMIN_NAVIGATION_ITEMS].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}
