// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Navigation items
// ==================================================
import type { AdminEntryRoutePath } from "@/components/adminEntry/adminEntryTypes";

export type AdminNavigationItem = {
  id: string;
  label: string;
  shortLabel: string;
  route: AdminEntryRoutePath;
  description: string;
};

export const ADMIN_NAVIGATION_ITEMS: AdminNavigationItem[] = [
  {
    id: "admin-panel",
    label: "📈 Панель управления",
    shortLabel: "Панель",
    route: "/admin",
    description: "Рабочая панель Bellaflore и быстрые переходы",
  },
  {
    id: "system-brain",
    label: "⚙️ Системный мозг",
    shortLabel: "Система",
    route: "/admin/system-brain",
    description: "Внутренний системный слой Bellaflore",
  },
  {
    id: "internal-module",
    label: "🧩 Внутренний модуль",
    shortLabel: "Модуль",
    route: "/admin/internal",
    description: "Внутренние операционные инструменты",
  },
];

export function getAdminNavigationItemByRoute(
  route: AdminEntryRoutePath,
): AdminNavigationItem | null {
  return ADMIN_NAVIGATION_ITEMS.find((item) => item.route === route) ?? null;
}

export function formatAdminRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "владелец";
    case "admin":
      return "администратор";
    case "manager":
    case "courier_manager":
      return "менеджер";
    case "florist":
      return "флорист";
    case "viewer":
      return "наблюдатель";
    case "system":
      return "система";
    default:
      return role;
  }
}
