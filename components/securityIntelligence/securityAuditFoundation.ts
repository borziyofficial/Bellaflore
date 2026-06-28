// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Audit foundation
// ==================================================
import type {
  SecurityEvent,
  SecurityEventKind,
  SecurityRole,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

export const SECURITY_AUDIT_STORAGE_KEY =
  "bellaflore_security_intelligence_audit_v1";

export type CreateSecurityAuditEventInput = {
  kind: SecurityEventKind;
  actorId: string | null;
  actorRole: SecurityRole | null;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

const inMemoryAudit: SecurityEvent[] = [];

function generateEventId(): string {
  return `security-event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readAuditFromStorage(): SecurityEvent[] {
  if (typeof window === "undefined") {
    return [...inMemoryAudit];
  }

  try {
    const raw = window.localStorage.getItem(SECURITY_AUDIT_STORAGE_KEY);
    if (!raw) {
      return [...inMemoryAudit];
    }

    const parsed = JSON.parse(raw) as SecurityEvent[];
    return Array.isArray(parsed) ? parsed : [...inMemoryAudit];
  } catch {
    return [...inMemoryAudit];
  }
}

function writeAuditToStorage(events: SecurityEvent[]): void {
  inMemoryAudit.length = 0;
  inMemoryAudit.push(...events);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SECURITY_AUDIT_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Optional audit storage.
  }
}

export function createSecurityAuditEvent(
  input: CreateSecurityAuditEventInput,
): SecurityEvent {
  const event: SecurityEvent = {
    id: generateEventId(),
    kind: input.kind,
    actorId: input.actorId,
    actorRole: input.actorRole,
    message: input.message,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
    reviewed: false,
  };

  const events = readAuditFromStorage();
  events.unshift(event);
  writeAuditToStorage(events.slice(0, 500));

  return event;
}

export function listSecurityAuditEvents(limit = 50): SecurityEvent[] {
  return readAuditFromStorage().slice(0, limit);
}

export function filterSecurityAuditEvents(filters: {
  kind?: SecurityEventKind;
  actorId?: string;
  reviewed?: boolean;
}): SecurityEvent[] {
  return readAuditFromStorage().filter((event) => {
    if (filters.kind && event.kind !== filters.kind) {
      return false;
    }

    if (filters.actorId && event.actorId !== filters.actorId) {
      return false;
    }

    if (filters.reviewed != null && event.reviewed !== filters.reviewed) {
      return false;
    }

    return true;
  });
}

export function markSecurityEventReviewed(eventId: string): SecurityEvent | null {
  const events = readAuditFromStorage();
  const index = events.findIndex((event) => event.id === eventId);

  if (index === -1) {
    return null;
  }

  events[index] = { ...events[index], reviewed: true };
  writeAuditToStorage(events);
  return events[index];
}

export function clearSecurityAuditLog(): void {
  writeAuditToStorage([]);
}

export const SECURITY_AUDIT_EVENT_KINDS: SecurityEventKind[] = [
  "login_success",
  "login_failed",
  "logout",
  "session_expired",
  "permission_denied",
  "module_access_denied",
  "suspicious_activity",
  "password_config_warning",
  "admin_action_performed",
  "security_policy_changed",
];

export function getExampleSecurityAuditEvent(): SecurityEvent {
  return {
    id: "security-event-example",
    kind: "permission_denied",
    actorId: "security-user-manager",
    actorRole: "manager",
    message: "Permission denied: security.control",
    metadata: { permission: "security.control", route: "/admin/security" },
    createdAt: new Date().toISOString(),
    reviewed: false,
  };
}
