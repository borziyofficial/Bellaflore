// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Auth foundation
// ==================================================
import {
  ADMIN_DEV_CONFIG_FLAG,
  findDevAdminUserByCredentials,
  findDevAdminUserById,
} from "@/components/adminIntelligence/adminDevConfig";
import {
  canRoleAccessEntryPoint,
  getAdminEntryPointById,
} from "@/components/adminIntelligence/adminEntryPointsCatalog";
import {
  getPermissionsForRole,
  roleHasPermission,
} from "@/components/adminIntelligence/adminRolesCatalog";
import { recordAdminAuditEvent } from "@/components/adminIntelligence/adminAuditFoundation";
import type {
  AdminEntryPointId,
  AdminLoginValidationResult,
  AdminPermission,
  AdminPermissionCheckResult,
  AdminRole,
  AdminSession,
  AdminUser,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export const ADMIN_SESSION_STORAGE_KEY = "bellaflore_admin_intelligence_session_v1";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

let inMemorySession: AdminSession | null = null;

function generateSessionId(): string {
  return `admin-session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSession(
  user: AdminUser,
  entryPointId: AdminEntryPointId | null = null,
): AdminSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  return {
    sessionId: generateSessionId(),
    userId: user.id,
    userName: user.name,
    role: user.role,
    permissions: getPermissionsForRole(user.role),
    entryPointId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: now.toISOString(),
  };
}

function isSessionExpired(session: AdminSession): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function readSessionFromStorage(): AdminSession | null {
  if (typeof window === "undefined") {
    return inMemorySession;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) {
      return inMemorySession;
    }

    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.sessionId || isSessionExpired(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return inMemorySession;
  }
}

function writeSessionToStorage(session: AdminSession | null): void {
  inMemorySession = session;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!session) {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // Session storage is optional.
  }
}

export function validateAdminLogin(
  login: string,
  password: string,
): AdminLoginValidationResult {
  if (!login.trim() || !password.trim()) {
    return {
      ok: false,
      user: null,
      message: "Введите логин и пароль",
    };
  }

  const user = findDevAdminUserByCredentials(login.trim(), password);

  if (!user) {
    return {
      ok: false,
      user: null,
      message: `Неверные учётные данные (${ADMIN_DEV_CONFIG_FLAG})`,
    };
  }

  return {
    ok: true,
    user,
    message: "OK",
  };
}

export function createAdminSession(
  user: AdminUser,
  entryPointId: AdminEntryPointId | null = "admin_panel",
): AdminSession | null {
  if (!user.enabled) {
    return null;
  }

  if (entryPointId && !canRoleAccessEntryPoint(user.role, entryPointId)) {
    return null;
  }

  const session = buildSession(user, entryPointId);
  writeSessionToStorage(session);

  recordAdminAuditEvent({
    kind: "admin_login",
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    message: `Admin login via ${entryPointId ?? "unknown"}`,
    metadata: { entryPointId, devConfig: ADMIN_DEV_CONFIG_FLAG },
  });

  return session;
}

export function destroyAdminSession(): void {
  const session = getCurrentAdminSession();

  if (session) {
    recordAdminAuditEvent({
      kind: "admin_logout",
      actorId: session.userId,
      actorName: session.userName,
      actorRole: session.role,
      message: "Admin logout",
    });
  }

  writeSessionToStorage(null);
}

export function getCurrentAdminSession(): AdminSession | null {
  const session = readSessionFromStorage();
  if (!session || isSessionExpired(session)) {
    writeSessionToStorage(null);
    return null;
  }

  const user = findDevAdminUserById(session.userId);
  if (!user?.enabled) {
    writeSessionToStorage(null);
    return null;
  }

  return session;
}

export function hasPermission(
  permission: AdminPermission,
  session: AdminSession | null = getCurrentAdminSession(),
): AdminPermissionCheckResult {
  if (!session) {
    return {
      permission,
      allowed: false,
      reason: "No active admin session",
    };
  }

  const allowed = roleHasPermission(session.role, permission);

  return {
    permission,
    allowed,
    reason: allowed ? null : `Role ${session.role} lacks ${permission}`,
  };
}

export function requirePermission(
  permission: AdminPermission,
  session: AdminSession | null = getCurrentAdminSession(),
): AdminPermissionCheckResult {
  const result = hasPermission(permission, session);

  if (!result.allowed) {
    return result;
  }

  if (session) {
    const refreshed: AdminSession = {
      ...session,
      lastActivityAt: new Date().toISOString(),
    };
    writeSessionToStorage(refreshed);
  }

  return result;
}

export function loginAdmin(
  login: string,
  password: string,
  entryPointId: AdminEntryPointId = "admin_panel",
): { session: AdminSession | null; message: string } {
  const validation = validateAdminLogin(login, password);
  if (!validation.ok || !validation.user) {
    return { session: null, message: validation.message };
  }

  const entry = getAdminEntryPointById(entryPointId);
  if (!entry?.enabled) {
    return { session: null, message: "Entry point недоступен" };
  }

  const session = createAdminSession(validation.user, entryPointId);
  if (!session) {
    return { session: null, message: "Нет доступа к entry point" };
  }

  return { session, message: "OK" };
}

export function getExampleAdminSession(role: AdminRole = "manager"): AdminSession {
  const devUser =
    findDevAdminUserById(
      role === "owner"
        ? "admin-user-owner"
        : role === "system"
          ? "admin-user-system"
          : "admin-user-manager",
    ) ??
    findDevAdminUserById("admin-user-manager");

  if (!devUser) {
    const now = new Date().toISOString();
    return {
      sessionId: "example-session",
      userId: "example-user",
      userName: "Example Admin",
      role,
      permissions: getPermissionsForRole(role),
      entryPointId: "admin_panel",
      createdAt: now,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      lastActivityAt: now,
    };
  }

  return buildSession(devUser, "admin_panel");
}

export function clearAdminSessionStore(): void {
  writeSessionToStorage(null);
}
