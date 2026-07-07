// ==================================================
// SECTION: ADMIN APP — real navigation (Stage 1 foundation)
// РАЗДЕЛ: Re-export единого реестра навигации
// ==================================================
export {
  ADMIN_BOTTOM_NAV_ITEMS as ADMIN_APP_NAV_ITEMS,
  resolveAdminBottomNavId as resolveAdminAppNavId,
} from "@/components/adminApp/foundation/navigation";

export type { AdminBottomNavId as AdminAppNavId } from "@/components/adminApp/foundation/types";

export type AdminAppNavItem = {
  id: import("@/components/adminApp/foundation/types").AdminBottomNavId;
  label: string;
  href: string;
  description: string;
};
