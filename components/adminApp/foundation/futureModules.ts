// ==================================================
// SECTION: ADMIN APP — Future module metadata
// ==================================================

export type AdminFutureModuleConfig = {
  slug: string;
  title: string;
  subtitle: string;
  bullets?: string[];
};

export const ADMIN_FUTURE_MODULES: Record<string, AdminFutureModuleConfig> = {
  categories: {
    slug: "categories",
    title: "Категории",
    subtitle: "Дерево категорий, согласованное с разделами витрины",
  },
  customers: {
    slug: "customers",
    title: "Клиенты",
    subtitle: "CRM и история клиентов",
  },
  promotions: {
    slug: "promotions",
    title: "Акции",
    subtitle: "Кампании и сезонные предложения",
  },
  analytics: {
    slug: "analytics",
    title: "Аналитика",
    subtitle: "Показатели магазина и конверсия",
  },
  notifications: {
    slug: "notifications",
    title: "Уведомления",
    subtitle: "Оповещения и доставка в Telegram",
  },
  automation: {
    slug: "automation",
    title: "Автоматизация",
    subtitle: "Рабочие процессы и запланированные действия",
  },
  settings: {
    slug: "settings",
    title: "Настройки",
    subtitle: "Настройки магазина и параметры администратора",
  },
};

export function getAdminFutureModule(slug: string): AdminFutureModuleConfig | null {
  return ADMIN_FUTURE_MODULES[slug] ?? null;
}
