// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Module index
// ==================================================
export type {
  AdminEntryRoutePath,
  AdminEntryLoginResult,
  AdminEntryGateState,
  AdminEntryGateProps,
} from "@/components/adminEntry/adminEntryTypes";

export {
  ADMIN_ENTRY_LOGIN_PATH,
  ADMIN_ENTRY_ROUTES,
  buildAdminLoginRedirectUrl,
  resolveAdminEntryRedirectPath,
  isAdminEntryProtectedRoute,
} from "@/components/adminEntry/adminEntryRoutes";

export {
  hasValidAdminEntrySession,
  loginWithAdminEntryCredentials,
  logoutAdminEntrySession,
  getAdminEntrySession,
  adminUserFromSecuritySession,
  hasLegacyAdminSessionOnly,
} from "@/components/adminEntry/adminEntryAuth";

export { AdminEntryGate } from "@/components/adminEntry/AdminEntryGate";

export {
  ADMIN_NAVIGATION_ITEMS,
  getAdminNavigationItemByRoute,
} from "@/components/adminEntry/adminNavigationItems";
export type { AdminNavigationItem } from "@/components/adminEntry/adminNavigationItems";

export { AdminNavigationShell } from "@/components/adminEntry/AdminNavigationShell";
