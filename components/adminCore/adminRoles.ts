// ==================================================
// SECTION: ADMIN CORE
// РАЗДЕЛ: Ядро админки
//
// Purpose (EN): Roles, permissions, audit log, and admin configuration registry.
//
// Назначение (RU): Роли, права, аудит и реестр конфигурации админ-панели.
// ==================================================
import type { AdminUserRole } from "@/components/adminCore/adminTypes";

export type AdminRoleDefinition = {
  id: AdminUserRole;
  titleRu: string;
  description: string;
  sortOrder: number;
};

export const ADMIN_ROLES: AdminUserRole[] = [
  "owner",
  "manager",
  "florist",
  "courier",
  "viewer",
];

export const ADMIN_ROLE_DEFINITIONS: AdminRoleDefinition[] = [
  {
    id: "owner",
    titleRu: "Владелец",
    description: "Полный доступ ко всем разделам и настройкам",
    sortOrder: 1,
  },
  {
    id: "manager",
    titleRu: "Менеджер",
    description: "Управление заказами, CRM, клиентами и доставкой",
    sortOrder: 2,
  },
  {
    id: "florist",
    titleRu: "Флорист",
    description: "Работа с заказами и сборкой букетов",
    sortOrder: 3,
  },
  {
    id: "courier",
    titleRu: "Курьер",
    description: "Доступ к назначенным заказам и маршрутам",
    sortOrder: 4,
  },
  {
    id: "viewer",
    titleRu: "Наблюдатель",
    description: "Только просмотр без изменений",
    sortOrder: 5,
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
const ADMIN_ROLE_BY_ID = ADMIN_ROLE_DEFINITIONS.reduce<
  Record<AdminUserRole, AdminRoleDefinition>
>(
  (roleMap, role) => {
    roleMap[role.id] = role;
    return roleMap;
  },
  {} as Record<AdminUserRole, AdminRoleDefinition>,
);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isAdminUserRole(value: string): value is AdminUserRole {
  return ADMIN_ROLES.includes(value as AdminUserRole);
}

export function getAdminRoleDefinition(role: AdminUserRole): AdminRoleDefinition {
  return ADMIN_ROLE_BY_ID[role];
}

export function getAdminRoleLabel(role: AdminUserRole): string {
  return getAdminRoleDefinition(role).titleRu;
}

export function getAdminRolesInSortOrder(): AdminRoleDefinition[] {
  return [...ADMIN_ROLE_DEFINITIONS].sort(
    (leftRole, rightRole) => leftRole.sortOrder - rightRole.sortOrder,
  );
}
