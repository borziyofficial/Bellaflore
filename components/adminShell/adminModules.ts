// ==================================================
// SECTION: Admin Shell — module registry
// РАЗДЕЛ: Реестр модулей админ-центра
// ==================================================

import type {
  AdminModuleDefinition,
  AdminModuleId,
  AdminModuleSection,
} from "@/components/adminShell/adminModuleTypes";

export const ADMIN_MODULE_STORAGE_KEY = "bellaflore.admin.activeModule";

export const ADMIN_MODULES: AdminModuleDefinition[] = [
  {
    id: "bellaflore",
    label: "Bellaflore",
    shortLabel: "Магазин Bellaflore",
    description: "Товары, заказы, доставка и контент витрины",
    availability: "active",
  },
  {
    id: "amore-bloom",
    label: "Amore Bloom",
    shortLabel: "Второй магазин",
    description: "Отдельный бренд — подключение позже",
    availability: "coming-soon",
  },
  {
    id: "system-control",
    label: "System Control",
    shortLabel: "Центр управления",
    description: "Статус сборки, окружение и диагностика",
    availability: "placeholder",
  },
];

export const BELLAFLORE_MODULE_SECTIONS: AdminModuleSection[] = [
  {
    id: "orders",
    title: "Заказы",
    description: "Статусы и обработка",
    href: "/admin/orders",
  },
  {
    id: "products",
    title: "Товары",
    description: "Каталог, цены, фото",
    href: "/admin/products",
  },
  {
    id: "delivery",
    title: "Доставка",
    description: "Зоны и маршруты",
    href: "/admin/delivery",
  },
  {
    id: "clients",
    title: "Клиенты",
    description: "CRM и история заказов",
    href: "/admin/crm/clients",
  },
];

export const SYSTEM_CONTROL_SECTIONS: AdminModuleSection[] = [
  {
    id: "build-status",
    title: "Статус сборки",
    description: "Production build и TypeScript проверки",
    statusLabel: "Готово к деплою",
  },
  {
    id: "environment",
    title: "Окружение",
    description: "Переменные и runtime-конфигурация",
    statusLabel: "Placeholder",
    disabled: true,
  },
  {
    id: "telegram-orders",
    title: "Telegram-заказы",
    description: "Статус уведомлений и интеграции",
    statusLabel: "Placeholder",
    disabled: true,
  },
  {
    id: "diagnostics",
    title: "Диагностика",
    description: "Health-check и внутренние метрики",
    statusLabel: "Placeholder",
    disabled: true,
  },
];

export function getAdminModuleById(
  moduleId: AdminModuleId,
): AdminModuleDefinition {
  return (
    ADMIN_MODULES.find((module) => module.id === moduleId) ?? ADMIN_MODULES[0]
  );
}

export function isAdminModuleId(value: string): value is AdminModuleId {
  return ADMIN_MODULES.some((module) => module.id === value);
}
