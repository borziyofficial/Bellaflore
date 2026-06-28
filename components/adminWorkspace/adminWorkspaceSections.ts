// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Рабочее пространство админки
//
// Purpose (EN): Workspace layout, sections, access guards, and navigation config.
//
// Назначение (RU): Макет, разделы, проверки доступа и конфигурация навигации админки.
// ==================================================
import type {
  AdminPermission,
  AdminSection,
  AdminUserRole,
} from "@/components/adminCore/adminTypes";
import type { AdminWorkspaceSection } from "@/components/adminWorkspace/adminWorkspaceTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const WORKSPACE_ID = "bellaflore-admin-workspace-v1";
const WORKSPACE_CREATED_AT = "2026-01-01T00:00:00.000Z";

type AdminWorkspaceSectionSeed = {
  sectionId: AdminSection;
  sectionName: string;
  sectionPath: string;
  sectionIcon: string;
  sectionDescription: string;
  requiredPermission: AdminPermission;
  requiredRole: AdminUserRole | null;
  isEnabled: boolean;
  isVisible: boolean;
  order: number;
};

const ADMIN_WORKSPACE_SECTION_SEEDS: AdminWorkspaceSectionSeed[] = [
  {
    sectionId: "orders",
    sectionName: "Заказы",
    sectionPath: "/admin/orders",
    sectionIcon: "orders",
    sectionDescription: "Управление заказами и lifecycle",
    requiredPermission: "view_orders",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 1,
  },
  {
    sectionId: "crm",
    sectionName: "CRM",
    sectionPath: "/admin/crm",
    sectionIcon: "crm",
    sectionDescription: "CRM-очереди и карточки заказов",
    requiredPermission: "view_crm",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 2,
  },
  {
    sectionId: "customers",
    sectionName: "Клиенты",
    sectionPath: "/admin/customers",
    sectionIcon: "customers",
    sectionDescription: "Клиентская база и история заказов",
    requiredPermission: "view_customers",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 3,
  },
  {
    sectionId: "catalog",
    sectionName: "Каталог",
    sectionPath: "/admin/catalog",
    sectionIcon: "catalog",
    sectionDescription: "Товары, коллекции и цены",
    requiredPermission: "view_catalog",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 4,
  },
  {
    sectionId: "delivery",
    sectionName: "Доставка",
    sectionPath: "/admin/delivery",
    sectionIcon: "delivery",
    sectionDescription: "Зоны, confidence и правила доставки",
    requiredPermission: "view_delivery",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 5,
  },
  {
    sectionId: "couriers",
    sectionName: "Курьеры",
    sectionPath: "/admin/couriers",
    sectionIcon: "couriers",
    sectionDescription: "Назначение курьеров и маршруты",
    requiredPermission: "assign_courier",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 6,
  },
  {
    sectionId: "analytics",
    sectionName: "Аналитика",
    sectionPath: "/admin/analytics",
    sectionIcon: "analytics",
    sectionDescription: "Отчёты и метрики Bellaflore",
    requiredPermission: "view_analytics",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 7,
  },
  {
    sectionId: "notifications",
    sectionName: "Уведомления",
    sectionPath: "/admin/notifications",
    sectionIcon: "notifications",
    sectionDescription: "Event bus и notification queue",
    requiredPermission: "view_orders",
    requiredRole: null,
    isEnabled: true,
    isVisible: true,
    order: 8,
  },
  {
    sectionId: "settings",
    sectionName: "Настройки",
    sectionPath: "/admin/settings",
    sectionIcon: "settings",
    sectionDescription: "Системные настройки Bellaflore",
    requiredPermission: "manage_settings",
    requiredRole: "owner",
    isEnabled: true,
    isVisible: true,
    order: 9,
  },
];

function buildWorkspaceSection(
  seed: AdminWorkspaceSectionSeed,
): AdminWorkspaceSection {
  const updatedAt = new Date().toISOString();

  return {
    workspaceId: WORKSPACE_ID,
    sectionId: seed.sectionId,
    sectionName: seed.sectionName,
    sectionPath: seed.sectionPath,
    sectionIcon: seed.sectionIcon,
    sectionDescription: seed.sectionDescription,
    requiredPermission: seed.requiredPermission,
    requiredRole: seed.requiredRole,
    isEnabled: seed.isEnabled,
    isVisible: seed.isVisible,
    order: seed.order,
    createdAt: WORKSPACE_CREATED_AT,
    updatedAt,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getAdminWorkspaceSectionRegistry(): AdminWorkspaceSection[] {
  return ADMIN_WORKSPACE_SECTION_SEEDS.map(buildWorkspaceSection).sort(
    (leftSection, rightSection) => leftSection.order - rightSection.order,
  );
}

export function getAdminWorkspaceSectionById(
  sectionId: AdminSection,
): AdminWorkspaceSection | null {
  return (
    getAdminWorkspaceSectionRegistry().find(
      (section) => section.sectionId === sectionId,
    ) ?? null
  );
}

export function resolveAdminWorkspaceSectionByPath(
  path: string,
): AdminWorkspaceSection | null {
  const normalizedPath = path.split("?")[0]?.replace(/\/$/, "") || path;

  return (
    getAdminWorkspaceSectionRegistry().find(
      (section) => section.sectionPath === normalizedPath,
    ) ?? null
  );
}

export function resolveAdminWorkspaceSectionSlug(
  slug: string,
): AdminWorkspaceSection | null {
  return getAdminWorkspaceSectionById(slug as AdminSection);
}

export function getAdminWorkspaceId(): string {
  return WORKSPACE_ID;
}
