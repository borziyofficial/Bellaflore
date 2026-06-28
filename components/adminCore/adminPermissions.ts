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
  AdminUserRole,
} from "@/components/adminCore/adminTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AdminPermissionDefinition = {
  id: AdminPermission;
  titleRu: string;
  description: string;
};

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  "view_orders",
  "manage_orders",
  "change_order_status",
  "assign_courier",
  "view_customers",
  "manage_customers",
  "view_catalog",
  "manage_catalog",
  "view_delivery",
  "manage_delivery",
  "view_crm",
  "manage_crm",
  "view_analytics",
  "manage_settings",
];

export const ADMIN_PERMISSION_DEFINITIONS: AdminPermissionDefinition[] = [
  {
    id: "view_orders",
    titleRu: "Просмотр заказов",
    description: "Просмотр списка и деталей заказов",
  },
  {
    id: "manage_orders",
    titleRu: "Управление заказами",
    description: "Создание и редактирование заказов",
  },
  {
    id: "change_order_status",
    titleRu: "Изменение статуса заказа",
    description: "Перевод заказа по lifecycle pipeline",
  },
  {
    id: "assign_courier",
    titleRu: "Назначение курьера",
    description: "Назначение и снятие курьера с заказа",
  },
  {
    id: "view_customers",
    titleRu: "Просмотр клиентов",
    description: "Просмотр карточек клиентов",
  },
  {
    id: "manage_customers",
    titleRu: "Управление клиентами",
    description: "Редактирование клиентских данных",
  },
  {
    id: "view_catalog",
    titleRu: "Просмотр каталога",
    description: "Просмотр товаров и коллекций",
  },
  {
    id: "manage_catalog",
    titleRu: "Управление каталогом",
    description: "Редактирование каталога",
  },
  {
    id: "view_delivery",
    titleRu: "Просмотр доставки",
    description: "Просмотр зон и правил доставки",
  },
  {
    id: "manage_delivery",
    titleRu: "Управление доставкой",
    description: "Изменение правил и зон доставки",
  },
  {
    id: "view_crm",
    titleRu: "Просмотр CRM",
    description: "Просмотр CRM-очередей и карточек",
  },
  {
    id: "manage_crm",
    titleRu: "Управление CRM",
    description: "Изменение CRM-данных и очередей",
  },
  {
    id: "view_analytics",
    titleRu: "Просмотр аналитики",
    description: "Доступ к аналитическим отчётам",
  },
  {
    id: "manage_settings",
    titleRu: "Управление настройками",
    description: "Изменение системных настроек",
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
const ALL_PERMISSIONS = [...ADMIN_PERMISSIONS];

const VIEW_PERMISSIONS: AdminPermission[] = [
  "view_orders",
  "view_customers",
  "view_catalog",
  "view_delivery",
  "view_crm",
  "view_analytics",
];

const ROLE_PERMISSIONS: Record<AdminUserRole, AdminPermission[]> = {
  owner: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS.filter(
    (permission) => permission !== "manage_settings",
  ),
  florist: [
    "view_orders",
    "change_order_status",
    "view_customers",
    "view_catalog",
    "view_delivery",
    "view_crm",
  ],
  courier: [
    "view_orders",
    "view_customers",
    "view_delivery",
    "assign_courier",
  ],
  viewer: VIEW_PERMISSIONS,
};

const PERMISSION_BY_ID = ADMIN_PERMISSION_DEFINITIONS.reduce<
  Record<AdminPermission, AdminPermissionDefinition>
>(
  (permissionMap, permission) => {
    permissionMap[permission.id] = permission;
    return permissionMap;
  },
  {} as Record<AdminPermission, AdminPermissionDefinition>,
);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isAdminPermission(value: string): value is AdminPermission {
  return ADMIN_PERMISSIONS.includes(value as AdminPermission);
}

export function getAdminPermissionDefinition(
  permission: AdminPermission,
): AdminPermissionDefinition {
  return PERMISSION_BY_ID[permission];
}

export function getPermissionsForRole(role: AdminUserRole): AdminPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(
  role: AdminUserRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
