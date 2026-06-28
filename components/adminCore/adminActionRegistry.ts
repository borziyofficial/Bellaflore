// ==================================================
// SECTION: ADMIN CORE
// РАЗДЕЛ: Ядро админки
//
// Purpose (EN): Roles, permissions, audit log, and admin configuration registry.
//
// Назначение (RU): Роли, права, аудит и реестр конфигурации админ-панели.
// ==================================================
import type {
  AdminActionDefinition,
  AdminActionId,
} from "@/components/adminCore/adminTypes";

export const ADMIN_ACTION_REGISTRY: AdminActionDefinition[] = [
  {
    adminActionId: "view_order",
    adminActionType: "read",
    label: "Просмотр заказа",
    requiredPermission: "view_orders",
    section: "orders",
  },
  {
    adminActionId: "accept_order",
    adminActionType: "status_change",
    label: "Принять заказ",
    requiredPermission: "change_order_status",
    section: "orders",
  },
  {
    adminActionId: "cancel_order",
    adminActionType: "status_change",
    label: "Отменить заказ",
    requiredPermission: "change_order_status",
    section: "orders",
  },
  {
    adminActionId: "change_order_status",
    adminActionType: "status_change",
    label: "Изменить статус заказа",
    requiredPermission: "change_order_status",
    section: "orders",
  },
  {
    adminActionId: "assign_courier",
    adminActionType: "assign",
    label: "Назначить курьера",
    requiredPermission: "assign_courier",
    section: "couriers",
  },
  {
    adminActionId: "add_order_note",
    adminActionType: "write",
    label: "Добавить заметку к заказу",
    requiredPermission: "manage_orders",
    section: "orders",
  },
  {
    adminActionId: "view_customer",
    adminActionType: "read",
    label: "Просмотр клиента",
    requiredPermission: "view_customers",
    section: "customers",
  },
  {
    adminActionId: "edit_customer",
    adminActionType: "write",
    label: "Редактировать клиента",
    requiredPermission: "manage_customers",
    section: "customers",
  },
  {
    adminActionId: "add_customer_note",
    adminActionType: "write",
    label: "Добавить заметку к клиенту",
    requiredPermission: "manage_customers",
    section: "customers",
  },
  {
    adminActionId: "view_crm_queue",
    adminActionType: "read",
    label: "Просмотр CRM-очереди",
    requiredPermission: "view_crm",
    section: "crm",
  },
  {
    adminActionId: "move_crm_order_queue",
    adminActionType: "write",
    label: "Переместить заказ в CRM-очереди",
    requiredPermission: "manage_crm",
    section: "crm",
  },
  {
    adminActionId: "view_delivery_rules",
    adminActionType: "read",
    label: "Просмотр правил доставки",
    requiredPermission: "view_delivery",
    section: "delivery",
  },
  {
    adminActionId: "edit_delivery_rules",
    adminActionType: "write",
    label: "Редактировать правила доставки",
    requiredPermission: "manage_delivery",
    section: "delivery",
  },
  {
    adminActionId: "view_notifications",
    adminActionType: "read",
    label: "Просмотр уведомлений",
    requiredPermission: "view_orders",
    section: "notifications",
  },
  {
    adminActionId: "process_notification_event",
    adminActionType: "process",
    label: "Обработать notification event",
    requiredPermission: "manage_orders",
    section: "notifications",
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
const ADMIN_ACTION_BY_ID = ADMIN_ACTION_REGISTRY.reduce<
  Record<AdminActionId, AdminActionDefinition>
>(
  (actionMap, action) => {
    actionMap[action.adminActionId] = action;
    return actionMap;
  },
  {} as Record<AdminActionId, AdminActionDefinition>,
);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isAdminActionId(value: string): value is AdminActionId {
  return value in ADMIN_ACTION_BY_ID;
}

export function getAdminActionDefinition(
  actionId: AdminActionId,
): AdminActionDefinition {
  return ADMIN_ACTION_BY_ID[actionId];
}

export function getAdminActionsForSection(
  section: AdminActionDefinition["section"],
): AdminActionDefinition[] {
  return ADMIN_ACTION_REGISTRY.filter((action) => action.section === section);
}

export function getAllAdminActions(): AdminActionDefinition[] {
  return [...ADMIN_ACTION_REGISTRY];
}
