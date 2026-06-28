// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Route constants
// ==================================================
import type { AdminEntryRoutePath } from "@/components/adminEntry/adminEntryTypes";

export const ADMIN_ENTRY_LOGIN_PATH = "/admin/login";

export const ADMIN_ENTRY_ROUTES = {
  panel: "/admin",
  systemBrain: "/admin/system-brain",
  internal: "/admin/internal",
  login: ADMIN_ENTRY_LOGIN_PATH,
} as const satisfies Record<string, AdminEntryRoutePath | "/admin/login">;

export function buildAdminLoginRedirectUrl(targetRoute: string): string {
  return `${ADMIN_ENTRY_LOGIN_PATH}?redirect=${encodeURIComponent(targetRoute)}`;
}

export function resolveAdminEntryRedirectPath(
  redirect: string | null | undefined,
): AdminEntryRoutePath {
  if (
    redirect === ADMIN_ENTRY_ROUTES.panel ||
    redirect === ADMIN_ENTRY_ROUTES.systemBrain ||
    redirect === ADMIN_ENTRY_ROUTES.internal
  ) {
    return redirect;
  }

  return ADMIN_ENTRY_ROUTES.panel;
}

export function isAdminEntryProtectedRoute(path: string): path is AdminEntryRoutePath {
  return (
    path === ADMIN_ENTRY_ROUTES.panel ||
    path === ADMIN_ENTRY_ROUTES.systemBrain ||
    path === ADMIN_ENTRY_ROUTES.internal
  );
}
