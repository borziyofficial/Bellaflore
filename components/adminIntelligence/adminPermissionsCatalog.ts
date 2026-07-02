// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Permissions catalog
// ==================================================
import type { AdminPermission } from "@/components/adminIntelligence/adminIntelligenceTypes";

export type AdminPermissionDefinition = {
  id: AdminPermission;
  title: string;
  description: string;
  category: string;
};

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  "orders.view",
  "orders.edit",
  "orders.status.change",
  "catalog.view",
  "catalog.edit",
  "inventory.view",
  "inventory.edit",
  "delivery.view",
  "delivery.edit",
  "couriers.view",
  "couriers.edit",
  "notifications.view",
  "notifications.edit",
  "workflow.view",
  "workflow.control",
  "analytics.view",
  "system.view",
  "system.control",
];

export const ADMIN_PERMISSION_DEFINITIONS: AdminPermissionDefinition[] = [
  {
    id: "orders.view",
    title: "Просмотр заказов",
    description: "Доступ к списку и деталям заказов",
    category: "orders",
  },
  {
    id: "orders.edit",
    title: "Редактирование заказов",
    description: "Изменение данных заказа",
    category: "orders",
  },
  {
    id: "orders.status.change",
    title: "Смена статуса заказа",
    description: "Перевод заказа по lifecycle",
    category: "orders",
  },
  {
    id: "catalog.view",
    title: "Просмотр каталога",
    description: "Доступ к товарам и коллекциям",
    category: "catalog",
  },
  {
    id: "catalog.edit",
    title: "Редактирование каталога",
    description: "Изменение товаров и публикации",
    category: "catalog",
  },
  {
    id: "inventory.view",
    title: "Просмотр склада",
    description: "Доступ к остаткам и резервам",
    category: "inventory",
  },
  {
    id: "inventory.edit",
    title: "Редактирование склада",
    description: "Корректировка остатков и резервов",
    category: "inventory",
  },
  {
    id: "delivery.view",
    title: "Просмотр доставки",
    description: "Доступ к задачам доставки",
    category: "delivery",
  },
  {
    id: "delivery.edit",
    title: "Редактирование доставки",
    description: "Изменение задач и интервалов",
    category: "delivery",
  },
  {
    id: "couriers.view",
    title: "Просмотр курьеров",
    description: "Доступ к профилям курьеров",
    category: "couriers",
  },
  {
    id: "couriers.edit",
    title: "Редактирование курьеров",
    description: "Назначение и блокировка курьеров",
    category: "couriers",
  },
  {
    id: "notifications.view",
    title: "Просмотр уведомлений",
    description: "Доступ к очереди уведомлений",
    category: "notifications",
  },
  {
    id: "notifications.edit",
    title: "Редактирование уведомлений",
    description: "Повтор и настройка правил",
    category: "notifications",
  },
  {
    id: "workflow.view",
    title: "Просмотр workflow",
    description: "Доступ к workflow и шагам",
    category: "workflow",
  },
  {
    id: "workflow.control",
    title: "Управление workflow",
    description: "Пауза, retry и restart workflow",
    category: "workflow",
  },
  {
    id: "analytics.view",
    title: "Просмотр аналитики",
    description: "Доступ к отчётам и метрикам",
    category: "analytics",
  },
  {
    id: "system.view",
    title: "Просмотр системы",
    description: "Доступ к System Brain и диагностике",
    category: "system",
  },
  {
    id: "system.control",
    title: "Управление системой",
    description: "Системные настройки и control plane",
    category: "system",
  },
];

const PERMISSION_BY_ID = ADMIN_PERMISSION_DEFINITIONS.reduce<
  Record<AdminPermission, AdminPermissionDefinition>
>(
  (map, definition) => {
    map[definition.id] = definition;
    return map;
  },
  {} as Record<AdminPermission, AdminPermissionDefinition>,
);

export function isAdminPermission(value: string): value is AdminPermission {
  return ADMIN_PERMISSIONS.includes(value as AdminPermission);
}

export function getAdminPermissionDefinition(
  permission: AdminPermission,
): AdminPermissionDefinition {
  return PERMISSION_BY_ID[permission];
}
