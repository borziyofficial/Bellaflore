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
    label: "Admin Panel",
    shortLabel: "Panel",
    route: "/admin",
    description: "Workspace foundation and admin sections",
  },
  {
    id: "system-brain",
    label: "System Brain",
    shortLabel: "Brain",
    route: "/admin/system-brain",
    description: "Internal system brain foundation",
  },
  {
    id: "internal-module",
    label: "Internal Module",
    shortLabel: "Internal",
    route: "/admin/internal",
    description: "Internal operations foundation",
  },
];

export function getAdminNavigationItemByRoute(
  route: AdminEntryRoutePath,
): AdminNavigationItem | null {
  return ADMIN_NAVIGATION_ITEMS.find((item) => item.route === route) ?? null;
}
