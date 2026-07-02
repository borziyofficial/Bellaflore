// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Roles catalog
// ==================================================
import { ADMIN_PERMISSIONS } from "@/components/adminIntelligence/adminPermissionsCatalog";
import type {
  AdminPermission,
  AdminRole,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export type AdminRoleDefinition = {
  id: AdminRole;
  title: string;
  description: string;
  sortOrder: number;
};

export const ADMIN_ROLES: AdminRole[] = [
  "owner",
  "admin",
  "manager",
  "florist",
  "courier_manager",
  "support",
  "analyst",
  "system",
];

export const ADMIN_ROLE_DEFINITIONS: AdminRoleDefinition[] = [
  {
    id: "owner",
    title: "Владелец",
    description: "Полный доступ ко всем разделам и системным настройкам",
    sortOrder: 1,
  },
  {
    id: "admin",
    title: "Администратор",
    description: "Управление операциями без system.control",
    sortOrder: 2,
  },
  {
    id: "manager",
    title: "Менеджер",
    description: "Заказы, склад, доставка и курьеры",
    sortOrder: 3,
  },
  {
    id: "florist",
    title: "Флорист",
    description: "Заказы и склад в режиме просмотра/сборки",
    sortOrder: 4,
  },
  {
    id: "courier_manager",
    title: "Менеджер курьеров",
    description: "Доставка, курьеры и связанные workflow",
    sortOrder: 5,
  },
  {
    id: "support",
    title: "Поддержка",
    description: "Заказы и уведомления клиентов",
    sortOrder: 6,
  },
  {
    id: "analyst",
    title: "Аналитик",
    description: "Просмотр данных и аналитики",
    sortOrder: 7,
  },
  {
    id: "system",
    title: "System",
    description: "System Brain и внутренние модули",
    sortOrder: 8,
  },
];

const ALL_PERMISSIONS = [...ADMIN_PERMISSIONS];

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((permission) => permission !== "system.control"),
  manager: [
    "orders.view",
    "orders.edit",
    "orders.status.change",
    "catalog.view",
    "inventory.view",
    "inventory.edit",
    "delivery.view",
    "delivery.edit",
    "couriers.view",
    "couriers.edit",
    "notifications.view",
    "workflow.view",
    "analytics.view",
  ],
  florist: [
    "orders.view",
    "orders.status.change",
    "catalog.view",
    "inventory.view",
    "workflow.view",
  ],
  courier_manager: [
    "orders.view",
    "delivery.view",
    "delivery.edit",
    "couriers.view",
    "couriers.edit",
    "notifications.view",
    "workflow.view",
  ],
  support: [
    "orders.view",
    "orders.edit",
    "notifications.view",
    "notifications.edit",
    "workflow.view",
  ],
  analyst: [
    "orders.view",
    "catalog.view",
    "inventory.view",
    "delivery.view",
    "couriers.view",
    "notifications.view",
    "workflow.view",
    "analytics.view",
    "system.view",
  ],
  system: [
    "system.view",
    "system.control",
    "workflow.view",
    "workflow.control",
    "analytics.view",
    "notifications.view",
  ],
};

const ROLE_BY_ID = ADMIN_ROLE_DEFINITIONS.reduce<
  Record<AdminRole, AdminRoleDefinition>
>(
  (map, role) => {
    map[role.id] = role;
    return map;
  },
  {} as Record<AdminRole, AdminRoleDefinition>,
);

export function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function getAdminRoleDefinition(role: AdminRole): AdminRoleDefinition {
  return ROLE_BY_ID[role];
}

export function getPermissionsForRole(role: AdminRole): AdminPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleHasPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getAdminRolesInSortOrder(): AdminRoleDefinition[] {
  return [...ADMIN_ROLE_DEFINITIONS].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}
