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
} from "@/components/securityIntelligence/securityAuthFoundation";
import type {
  SecurityRole,
  SecuritySession,
  SecurityUser,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

type AdminLoginApiResponse = {
  authenticated?: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role: SecurityRole;
  };
};

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

function finalizeAdminEntryLogin(user: SecurityUser): AdminEntryLoginResult {
  const session = createSecuritySession(user);

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

function securityUserFromApiResponse(
  response: AdminLoginApiResponse,
): SecurityUser | null {
  if (!response.user?.id || !response.user.name || !response.user.role) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: response.user.id,
    name: response.user.name,
    email: response.user.email ?? `${response.user.name}@bellaflore.ru`,
    role: response.user.role,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasValidAdminEntrySession(): boolean {
  return getCurrentSecuritySession() !== null;
}

export async function loginWithAdminEntryCredentials(
  username: string,
  password: string,
): Promise<AdminEntryLoginResult> {
  const trimmedLogin = username.trim();
  const trimmedPassword = password.trim();

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: trimmedLogin,
        password: trimmedPassword,
      }),
    });

    const body = (await response.json()) as AdminLoginApiResponse;

    if (!response.ok) {
      return {
        ok: false,
        session: null,
        message: body.message || "Неверное имя пользователя или пароль.",
      };
    }

    const user = securityUserFromApiResponse(body);
    if (!user) {
      return {
        ok: false,
        session: null,
        message: "Не удалось создать сессию",
      };
    }

    return finalizeAdminEntryLogin(user);
  } catch {
    // Credential verification only ever happens server-side (/api/admin/login);
    // if the request itself failed (e.g. network error), there is no local
    // fallback that can safely authenticate the user.
    return {
      ok: false,
      session: null,
      message: "Не удалось проверить учётные данные.",
    };
  }
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
