// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Access guards
// ==================================================
import { createSecurityAuditEvent } from "@/components/securityIntelligence/securityAuditFoundation";
import {
  getCurrentSecuritySession,
  refreshSecuritySession,
} from "@/components/securityIntelligence/securityAuthFoundation";
import {
  getSecurityModuleAccess,
  getSecurityRouteRule,
} from "@/components/securityIntelligence/securityRouteAccessFoundation";
import { securityRoleHasPermission } from "@/components/securityIntelligence/securityRolesCatalog";
import type {
  SecurityAccessCheck,
  SecurityModuleId,
  SecurityPermission,
  SecurityRoutePath,
  SecuritySession,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

function buildAccessCheck(
  input: Omit<SecurityAccessCheck, "checkedAt">,
): SecurityAccessCheck {
  return {
    ...input,
    checkedAt: new Date().toISOString(),
  };
}

function getSessionOrNull(
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecuritySession | null {
  return session;
}

export function hasSecurityPermission(
  permission: SecurityPermission,
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  if (!session) {
    return buildAccessCheck({
      allowed: false,
      permission,
      route: null,
      moduleId: null,
      reason: "No active security session",
    });
  }

  const allowed = securityRoleHasPermission(session.role, permission);

  return buildAccessCheck({
    allowed,
    permission,
    route: null,
    moduleId: null,
    reason: allowed ? null : `Role ${session.role} lacks ${permission}`,
  });
}

export function requireSecurityPermission(
  permission: SecurityPermission,
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  const result = hasSecurityPermission(permission, session);

  if (!result.allowed) {
    createSecurityAuditEvent({
      kind: "permission_denied",
      actorId: session?.userId ?? null,
      actorRole: session?.role ?? null,
      message: result.reason ?? "Permission denied",
      metadata: { permission },
    });
    return result;
  }

  refreshSecuritySession();
  return result;
}

export function canAccessAdminEntryPoint(
  route: SecurityRoutePath,
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  const rule = getSecurityRouteRule(route);

  if (!rule || !rule.enabled) {
    return buildAccessCheck({
      allowed: false,
      permission: null,
      route,
      moduleId: null,
      reason: "Route rule not found or disabled",
    });
  }

  if (!session) {
    return buildAccessCheck({
      allowed: false,
      permission: rule.requiredPermissions[0] ?? null,
      route,
      moduleId: null,
      reason: "Authentication required",
    });
  }

  if (!rule.allowedRoles.includes(session.role)) {
    createSecurityAuditEvent({
      kind: "module_access_denied",
      actorId: session.userId,
      actorRole: session.role,
      message: `Route access denied: ${route}`,
      metadata: { route },
    });

    return buildAccessCheck({
      allowed: false,
      permission: rule.requiredPermissions[0] ?? null,
      route,
      moduleId: null,
      reason: `Role ${session.role} cannot access ${route}`,
    });
  }

  const hasAllPermissions = rule.requiredPermissions.every((permission) =>
    securityRoleHasPermission(session.role, permission),
  );

  if (!hasAllPermissions) {
    createSecurityAuditEvent({
      kind: "permission_denied",
      actorId: session.userId,
      actorRole: session.role,
      message: `Missing permissions for ${route}`,
      metadata: { route, requiredPermissions: rule.requiredPermissions },
    });

    return buildAccessCheck({
      allowed: false,
      permission: rule.requiredPermissions[0] ?? null,
      route,
      moduleId: null,
      reason: "Missing required permissions",
    });
  }

  return buildAccessCheck({
    allowed: true,
    permission: rule.requiredPermissions[0] ?? null,
    route,
    moduleId: null,
    reason: null,
  });
}

export function canAccessModule(
  moduleId: SecurityModuleId,
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  const access = getSecurityModuleAccess(moduleId);

  if (!access || !access.enabled) {
    return buildAccessCheck({
      allowed: false,
      permission: null,
      route: null,
      moduleId,
      reason: "Module access rule not found",
    });
  }

  return canAccessAdminEntryPoint(access.route, session);
}

export function canPerformAction(
  permission: SecurityPermission,
  actionLabel: string,
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  const result = requireSecurityPermission(permission, session);

  if (result.allowed && session) {
    createSecurityAuditEvent({
      kind: "admin_action_performed",
      actorId: session.userId,
      actorRole: session.role,
      message: actionLabel,
      metadata: { permission },
    });
  }

  return result;
}

export function canControlSystem(
  session: SecuritySession | null = getCurrentSecuritySession(),
): SecurityAccessCheck {
  return requireSecurityPermission("system.control", getSessionOrNull(session));
}

export function getExampleDeniedAccess(): SecurityAccessCheck {
  return buildAccessCheck({
    allowed: false,
    permission: "security.control",
    route: "/admin/security",
    moduleId: "securityIntelligence",
    reason: "Role manager lacks security.control",
  });
}
