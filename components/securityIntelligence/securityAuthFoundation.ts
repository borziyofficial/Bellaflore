// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Auth foundation
// ==================================================
import { getPermissionsForSecurityRole } from "@/components/securityIntelligence/securityRolesCatalog";
import { createSecurityAuditEvent } from "@/components/securityIntelligence/securityAuditFoundation";
import {
  checkRateLimit,
  recordRateLimitHit,
} from "@/components/securityIntelligence/securityRateLimitFoundation";
import type {
  SecurityLoginValidationResult,
  SecuritySession,
  SecurityUser,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

export const SECURITY_SESSION_STORAGE_KEY =
  "bellaflore_security_intelligence_session_v1";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

let inMemorySession: SecuritySession | null = null;

function generateSessionId(): string {
  return `security-session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isSessionExpired(session: SecuritySession): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function readSessionFromStorage(): SecuritySession | null {
  if (typeof window === "undefined") {
    return inMemorySession;
  }

  try {
    const raw = window.localStorage.getItem(SECURITY_SESSION_STORAGE_KEY);
    if (!raw) {
      return inMemorySession;
    }

    const parsed = JSON.parse(raw) as SecuritySession;
    if (!parsed?.sessionId || isSessionExpired(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return inMemorySession;
  }
}

function writeSessionToStorage(session: SecuritySession | null): void {
  inMemorySession = session;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!session) {
      window.localStorage.removeItem(SECURITY_SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SECURITY_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Optional session storage.
  }
}

function buildSession(user: SecurityUser): SecuritySession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  return {
    sessionId: generateSessionId(),
    userId: user.id,
    userName: user.name,
    role: user.role,
    permissions: getPermissionsForSecurityRole(user.role),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: now.toISOString(),
    refreshedAt: null,
  };
}

// Credential verification is server-only (see /api/admin/login and
// resolveSecurityLoginUser.ts) so the account roster and password
// comparison are never bundled into client-side JavaScript. This
// client-side helper only tracks rate limiting/auditing for failed
// local validation attempts; it deliberately cannot authenticate anyone
// on its own.
export function validateSecurityLogin(
  login: string,
  password: string,
): SecurityLoginValidationResult {
  const rateLimit = checkRateLimit("login_attempt", login.trim() || "anonymous");
  if (!rateLimit.allowed) {
    createSecurityAuditEvent({
      kind: "suspicious_activity",
      actorId: null,
      actorRole: null,
      message: "Login rate limit exceeded",
      metadata: { login: login.trim(), bucket: "login_attempt" },
    });

    return { ok: false, user: null, message: "Слишком много попыток входа" };
  }

  if (!login.trim() || !password.trim()) {
    createSecurityAuditEvent({
      kind: "login_failed",
      actorId: null,
      actorRole: null,
      message: "Empty login or password",
      metadata: { login: login.trim() },
    });

    return { ok: false, user: null, message: "Введите логин и пароль" };
  }

  recordRateLimitHit("login_attempt", login.trim());
  createSecurityAuditEvent({
    kind: "login_failed",
    actorId: null,
    actorRole: null,
    message: "Local credential validation is disabled; use /api/admin/login",
    metadata: { login: login.trim() },
  });

  return {
    ok: false,
    user: null,
    message: "Не удалось проверить учётные данные без сети.",
  };
}

export function createSecuritySession(user: SecurityUser): SecuritySession | null {
  if (!user.enabled) {
    return null;
  }

  const session = buildSession(user);
  writeSessionToStorage(session);

  createSecurityAuditEvent({
    kind: "login_success",
    actorId: user.id,
    actorRole: user.role,
    message: "Security session created",
    metadata: { sessionId: session.sessionId },
  });

  return session;
}

export function destroySecuritySession(): void {
  const session = getCurrentSecuritySession();

  if (session) {
    createSecurityAuditEvent({
      kind: "logout",
      actorId: session.userId,
      actorRole: session.role,
      message: "Security session destroyed",
    });
  }

  writeSessionToStorage(null);
}

export function getCurrentSecuritySession(): SecuritySession | null {
  const session = readSessionFromStorage();

  if (!session || isSessionExpired(session)) {
    if (session && isSessionExpired(session)) {
      createSecurityAuditEvent({
        kind: "session_expired",
        actorId: session.userId,
        actorRole: session.role,
        message: "Security session expired",
      });
    }

    writeSessionToStorage(null);
    return null;
  }

  // The stored session was only ever created after a successful server-side
  // login (see createSecuritySession / /api/admin/login); the HttpOnly
  // session cookie is the real authority checked on every admin API call,
  // so this client-side session is trusted as-is once we know it hasn't
  // expired.
  return session;
}

export function refreshSecuritySession(): SecuritySession | null {
  const session = getCurrentSecuritySession();
  if (!session) {
    return null;
  }

  const now = new Date();
  const refreshed: SecuritySession = {
    ...session,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    lastActivityAt: now.toISOString(),
    refreshedAt: now.toISOString(),
  };

  writeSessionToStorage(refreshed);
  return refreshed;
}

export function getExampleSecuritySession(role: SecurityUser["role"] = "admin"): SecuritySession {
  const now = new Date().toISOString();
  return {
    sessionId: "example-security-session",
    userId: "example-user",
    userName: "Example User",
    role,
    permissions: getPermissionsForSecurityRole(role),
    createdAt: now,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    lastActivityAt: now,
    refreshedAt: null,
  };
}

export function clearSecuritySessionStore(): void {
  writeSessionToStorage(null);
}
