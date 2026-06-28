// ==================================================
// SECTION: ADMIN CORE
// РАЗДЕЛ: Ядро админки
//
// Purpose (EN): Roles, permissions, audit log, and admin configuration registry.
//
// Назначение (RU): Роли, права, аудит и реестр конфигурации админ-панели.
// ==================================================
import type {
  AdminAuditEvent,
  CreateAdminAuditEventInput,
} from "@/components/adminCore/adminTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const ADMIN_AUDIT_LOG_STORAGE_KEY = "bellaflore_admin_audit_log_v1";

let adminAuditEventCounter = 0;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createAuditEventId(adminUserId: string, createdAt: string): string {
  adminAuditEventCounter += 1;
  return `AAE-${adminUserId}-${Date.parse(createdAt)}-${adminAuditEventCounter}`;
}

export function isAdminAuditEvent(value: unknown): value is AdminAuditEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminAuditEvent>;

  return (
    typeof candidate.auditEventId === "string" &&
    candidate.auditEventId.trim().length > 0 &&
    typeof candidate.adminUserId === "string" &&
    typeof candidate.adminActionId === "string" &&
    typeof candidate.resourceType === "string" &&
    typeof candidate.resourceId === "string" &&
    typeof candidate.allowed === "boolean" &&
    typeof candidate.success === "boolean" &&
    typeof candidate.createdAt === "string"
  );
}

export function readAdminAuditEvents(): AdminAuditEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_AUDIT_LOG_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isAdminAuditEvent);
  } catch {
    return [];
  }
}

export function writeAdminAuditEvents(events: AdminAuditEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_AUDIT_LOG_STORAGE_KEY,
      JSON.stringify(events),
    );
  } catch {
    // In-memory audit log still works if storage is blocked.
  }
}

export function saveAdminAuditEvent(event: AdminAuditEvent): AdminAuditEvent[] {
  const existingEvents = readAdminAuditEvents();
  const nextEvents = [...existingEvents, event];
  writeAdminAuditEvents(nextEvents);
  return nextEvents;
}

export function createAdminAuditEvent(
  input: CreateAdminAuditEventInput,
): AdminAuditEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    auditEventId: createAuditEventId(input.adminUser.adminUserId, createdAt),
    adminUserId: input.adminUser.adminUserId,
    adminUserName: input.adminUser.adminUserName,
    adminUserRole: input.adminUser.adminUserRole,
    adminActionId: input.adminActionId,
    resourceType: input.resource.resourceType,
    resourceId: input.resource.resourceId,
    allowed: input.allowed,
    reason: input.reason ?? null,
    success: input.success,
    message: input.message ?? null,
    metadata: input.metadata ?? {},
    createdAt,
  };
}

export function getAdminAuditEvents(): AdminAuditEvent[] {
  return readAdminAuditEvents().sort(
    (leftEvent, rightEvent) =>
      Date.parse(rightEvent.createdAt) - Date.parse(leftEvent.createdAt),
  );
}

export function getAdminAuditEventsByAdmin(
  adminUserId: string,
): AdminAuditEvent[] {
  return getAdminAuditEvents().filter(
    (event) => event.adminUserId === adminUserId,
  );
}

export function getAdminAuditEventsByResource(
  resourceType: AdminAuditEvent["resourceType"],
  resourceId: string,
): AdminAuditEvent[] {
  return getAdminAuditEvents().filter(
    (event) =>
      event.resourceType === resourceType && event.resourceId === resourceId,
  );
}

export function clearAdminAuditEvents(): void {
  writeAdminAuditEvents([]);
}
