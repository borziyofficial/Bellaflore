// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Unified auth bridge
// ==================================================
import {
  ADMIN_SESSION_VALUE,
  storeAdminSession,
} from "@/app/admin/auth";
import type { AdminUser } from "@/components/adminCore/adminTypes";
import type { AdminEntryLoginResult } from "@/components/adminEntry/adminEntryTypes";
import {
  createSecuritySession,
  destroySecuritySession,
  getCurrentSecuritySession,
  validateSecurityLogin,
} from "@/components/securityIntelligence/securityAuthFoundation";
import type {
  SecurityRole,
  SecuritySession,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

function mapSecurityRoleToAdminUserRole(role: SecurityRole): AdminUser["adminUserRole"] {
  if (role === "owner" || role === "system") {
    return "owner";
  }

  if (role === "admin" || role === "manager" || role === "courier_manager") {
    return "manager";
  }

  if (role === "florist") {
    return "florist";
  }

  return "viewer";
}

export function hasValidAdminEntrySession(): boolean {
  return getCurrentSecuritySession() !== null;
}

export function loginWithAdminEntryCredentials(
  username: string,
  password: string,
): AdminEntryLoginResult {
  const validation = validateSecurityLogin(username, password);

  if (!validation.ok || !validation.user) {
    return {
      ok: false,
      session: null,
      message: validation.message,
    };
  }

  const session = createSecuritySession(validation.user);

  if (!session) {
    return {
      ok: false,
      session: null,
      message: "Не удалось создать сессию",
    };
  }

  storeAdminSession();

  return {
    ok: true,
    session,
    message: "OK",
  };
}

export function logoutAdminEntrySession(): void {
  destroySecuritySession();

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("bellaflore.admin.session");
    } catch {
      // Ignore storage errors.
    }
  }
}

export function getAdminEntrySession(): SecuritySession | null {
  return getCurrentSecuritySession();
}

export function adminUserFromSecuritySession(session: SecuritySession): AdminUser {
  return {
    adminUserId: session.userId,
    adminUserName: session.userName,
    adminUserRole: mapSecurityRoleToAdminUserRole(session.role),
  };
}

export function hasLegacyAdminSessionOnly(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem("bellaflore.admin.session") === ADMIN_SESSION_VALUE;
  } catch {
    return false;
  }
}
