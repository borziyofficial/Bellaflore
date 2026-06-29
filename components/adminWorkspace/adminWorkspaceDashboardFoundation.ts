// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Dashboard foundation data (read-only)
// ==================================================

export type AdminWorkspaceQuickLink = {
  id: string;
  label: string;
  href: string | null;
  note: string;
};

export type AdminWorkspaceStatCard = {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "info";
};

export type AdminWorkspaceRoadmapItem = {
  stage: string;
  title: string;
  description: string;
};

export const ADMIN_WORKSPACE_QUICK_LINKS: AdminWorkspaceQuickLink[] = [
  {
    id: "catalog",
    label: "🌸 Каталог",
    href: "/admin#catalog-admin",
    note: "Букеты и коллекции",
  },
  {
    id: "photos",
    label: "🖼 Фото товаров",
    href: null,
    note: "Stage 45 · скоро",
  },
  {
    id: "orders",
    label: "📦 Заказы",
    href: "/admin/orders",
    note: "Legacy workspace",
  },
  {
    id: "clients",
    label: "👥 Клиенты",
    href: "/admin/crm/clients",
    note: "CRM и клиенты",
  },
  {
    id: "couriers",
    label: "🚚 Курьеры",
    href: "/admin/couriers",
    note: "Назначения и маршруты",
  },
  {
    id: "analytics",
    label: "📈 Аналитика",
    href: "/admin/analytics",
    note: "Метрики Bellaflore",
  },
  {
    id: "settings",
    label: "⚙️ Настройки",
    href: "/admin/settings",
    note: "Системные параметры",
  },
];

export const ADMIN_WORKSPACE_STAT_CARDS: AdminWorkspaceStatCard[] = [
  {
    id: "orders-today",
    label: "Сегодня заказов",
    value: "0",
    tone: "neutral",
  },
  {
    id: "new-clients",
    label: "Новые клиенты",
    value: "0",
    tone: "neutral",
  },
  {
    id: "active-deliveries",
    label: "Активные доставки",
    value: "0",
    tone: "neutral",
  },
  {
    id: "catalog-items",
    label: "Товаров в каталоге",
    value: "5",
    tone: "info",
  },
  {
    id: "telegram-status",
    label: "Статус Telegram",
    value: "не подключён",
    tone: "warning",
  },
  {
    id: "site-status",
    label: "Статус сайта",
    value: "работает локально",
    tone: "success",
  },
];

export const ADMIN_WORKSPACE_ROADMAP: AdminWorkspaceRoadmapItem[] = [
  {
    stage: "Stage 44",
    title: "Catalog Manager",
    description: "Foundation UI каталога на /admin — mock-товары, поиск и фильтры.",
  },
  {
    stage: "Stage 45",
    title: "Photo Manager",
    description: "Загрузка и привязка фото к товарам без production wiring.",
  },
  {
    stage: "Stage 46",
    title: "Product Editor",
    description: "Редактор цен, описаний и состава букетов.",
  },
  {
    stage: "Stage 47",
    title: "Orders Workspace",
    description: "Полноценное рабочее место заказов внутри admin shell.",
  },
];
