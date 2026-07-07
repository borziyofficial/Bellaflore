// ==================================================
// SECTION: ADMIN APP — Public exports
// ==================================================

export type {
  AdminBottomNavId,
  AdminNavItem,
  AdminSidebarId,
} from "@/components/adminApp/foundation/types";

export {
  ADMIN_BOTTOM_NAV_ITEMS,
  ADMIN_FUTURE_MODULE_SLUGS,
  ADMIN_SIDEBAR_ITEMS,
  isAdminBottomNavRoute,
  resolveAdminBottomNavId,
  resolveAdminSidebarId,
} from "@/components/adminApp/foundation/navigation";

export {
  ADMIN_FUTURE_MODULES,
  getAdminFutureModule,
} from "@/components/adminApp/foundation/futureModules";

export { AdminFoundationShell } from "@/components/adminApp/layout/AdminFoundationShell";
export { AdminAppPage } from "@/components/adminApp/layout/AdminAppPage";
export { AdminRouteLayout } from "@/components/adminApp/layout/AdminRouteLayout";
export { AdminSidebar } from "@/components/adminApp/layout/AdminSidebar";
export { AdminBottomNav } from "@/components/adminApp/layout/AdminBottomNav";

export { AdminDashboardModule } from "@/components/adminApp/modules/dashboard/AdminDashboardModule";
export { AdminBouquetsModule } from "@/components/adminApp/modules/bouquets/AdminBouquetsModule";
export { AdminAddModule } from "@/components/adminApp/modules/add/AdminAddModule";
export { AdminOrdersModule } from "@/components/adminApp/modules/orders/AdminOrdersModule";
export { AdminProfileModule } from "@/components/adminApp/modules/profile/AdminProfileModule";
export { AdminFutureModule } from "@/components/adminApp/modules/shared/AdminFutureModule";
