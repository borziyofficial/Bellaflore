// ==================================================
// SECTION: ADMIN CORE
// РАЗДЕЛ: Ядро админки
//
// Purpose (EN): Roles, permissions, audit log, and admin configuration registry.
//
// Назначение (RU): Роли, права, аудит и реестр конфигурации админ-панели.
// ==================================================
import type {
  AdminPermission,
  AdminSection,
  AdminUserRole,
} from "@/components/adminCore/adminTypes";
import { roleHasPermission } from "@/components/adminCore/adminPermissions";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AdminSectionDefinition = {
  id: AdminSection;
  titleRu: string;
  description: string;
  requiredPermissions: AdminPermission[];
  sortOrder: number;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  "orders",
  "customers",
  "crm",
  "catalog",
  "delivery",
  "couriers",
  "analytics",
  "settings",
  "notifications",
];

export const ADMIN_SECTION_DEFINITIONS: AdminSectionDefinition[] = [
  {
    id: "orders",
    titleRu: "Заказы",
    description: "Управление заказами и lifecycle",
    requiredPermissions: ["view_orders", "manage_orders"],
    sortOrder: 1,
  },
  {
    id: "customers",
    titleRu: "Клиенты",
    description: "CRM-клиенты и история покупок",
    requiredPermissions: ["view_customers", "manage_customers"],
    sortOrder: 2,
  },
  {
    id: "crm",
    titleRu: "CRM",
    description: "CRM-очереди и карточки заказов",
    requiredPermissions: ["view_crm", "manage_crm"],
    sortOrder: 3,
  },
  {
    id: "catalog",
    titleRu: "Каталог",
    description: "Товары, коллекции и цены",
    requiredPermissions: ["view_catalog", "manage_catalog"],
    sortOrder: 4,
  },
  {
    id: "delivery",
    titleRu: "Доставка",
    description: "Зоны, confidence и правила доставки",
    requiredPermissions: ["view_delivery", "manage_delivery"],
    sortOrder: 5,
  },
  {
    id: "couriers",
    titleRu: "Курьеры",
    description: "Назначение курьеров и маршруты",
    requiredPermissions: ["view_orders", "assign_courier"],
    sortOrder: 6,
  },
  {
    id: "analytics",
    titleRu: "Аналитика",
    description: "Отчёты и метрики",
    requiredPermissions: ["view_analytics"],
    sortOrder: 7,
  },
  {
    id: "settings",
    titleRu: "Настройки",
    description: "Системные настройки Bellaflore",
    requiredPermissions: ["manage_settings"],
    sortOrder: 8,
  },
  {
    id: "notifications",
    titleRu: "Уведомления",
    description: "Event bus и notification queue",
    requiredPermissions: ["view_orders", "manage_orders"],
    sortOrder: 9,
  },
];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const SECTION_BY_ID = ADMIN_SECTION_DEFINITIONS.reduce<
  Record<AdminSection, AdminSectionDefinition>
>(
  (sectionMap, section) => {
    sectionMap[section.id] = section;
    return sectionMap;
  },
  {} as Record<AdminSection, AdminSectionDefinition>,
);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isAdminSection(value: string): value is AdminSection {
  return ADMIN_SECTIONS.includes(value as AdminSection);
}

export function getAdminSectionDefinition(
  section: AdminSection,
): AdminSectionDefinition {
  return SECTION_BY_ID[section];
}

export function getAdminSectionLabel(section: AdminSection): string {
  return getAdminSectionDefinition(section).titleRu;
}

export function canAdminAccessSection(
  role: AdminUserRole,
  section: AdminSection,
): boolean {
  const sectionDefinition = getAdminSectionDefinition(section);

  return sectionDefinition.requiredPermissions.some((permission) =>
    roleHasPermission(role, permission),
  );
}

export function getAccessibleSectionsForRole(
  role: AdminUserRole,
): AdminSection[] {
  return ADMIN_SECTIONS.filter((section) =>
    canAdminAccessSection(role, section),
  );
}

export function getAdminSectionsInSortOrder(): AdminSectionDefinition[] {
  return [...ADMIN_SECTION_DEFINITIONS].sort(
    (leftSection, rightSection) => leftSection.sortOrder - rightSection.sortOrder,
  );
}
