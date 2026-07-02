// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Audit foundation
// ==================================================
import type {
  AdminAuditEvent,
  AdminAuditEventKind,
  AdminRole,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export const ADMIN_AUDIT_STORAGE_KEY = "bellaflore_admin_intelligence_audit_v1";

export type CreateAdminAuditEventInput = {
  kind: AdminAuditEventKind;
  actorId: string;
  actorName: string;
  actorRole: AdminRole;
  resourceType?: string | null;
  resourceId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

const inMemoryAuditLog: AdminAuditEvent[] = [];

function generateAuditEventId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readAuditLogFromStorage(): AdminAuditEvent[] {
  if (typeof window === "undefined") {
    return [...inMemoryAuditLog];
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
    if (!raw) {
      return [...inMemoryAuditLog];
    }

    const parsed = JSON.parse(raw) as AdminAuditEvent[];
    return Array.isArray(parsed) ? parsed : [...inMemoryAuditLog];
  } catch {
    return [...inMemoryAuditLog];
  }
}

function writeAuditLogToStorage(events: AdminAuditEvent[]): void {
  inMemoryAuditLog.length = 0;
  inMemoryAuditLog.push(...events);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Audit storage is optional.
  }
}

export function recordAdminAuditEvent(
  input: CreateAdminAuditEventInput,
): AdminAuditEvent {
  const event: AdminAuditEvent = {
    id: generateAuditEventId(),
    kind: input.kind,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    message: input.message,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  const events = readAuditLogFromStorage();
  events.unshift(event);

  const trimmed = events.slice(0, 500);
  writeAuditLogToStorage(trimmed);

  return event;
}

export function listAdminAuditEvents(limit = 50): AdminAuditEvent[] {
  return readAuditLogFromStorage().slice(0, limit);
}

export function filterAdminAuditEventsByKind(
  kind: AdminAuditEventKind,
): AdminAuditEvent[] {
  return readAuditLogFromStorage().filter((event) => event.kind === kind);
}

export function getAdminAuditEventById(
  eventId: string,
): AdminAuditEvent | null {
  return readAuditLogFromStorage().find((event) => event.id === eventId) ?? null;
}

export function clearAdminAuditLog(): void {
  writeAuditLogToStorage([]);
}

export const ADMIN_AUDIT_EVENT_KINDS: AdminAuditEventKind[] = [
  "admin_login",
  "admin_logout",
  "order_status_changed",
  "product_updated",
  "inventory_updated",
  "courier_assigned",
  "workflow_restarted",
  "notification_retried",
  "settings_changed",
];

export function buildAuditEventPreview(
  kind: AdminAuditEventKind,
): CreateAdminAuditEventInput {
  const previews: Record<AdminAuditEventKind, CreateAdminAuditEventInput> = {
    admin_login: {
      kind: "admin_login",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      message: "Admin login via admin_panel",
    },
    admin_logout: {
      kind: "admin_logout",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      message: "Admin logout",
    },
    order_status_changed: {
      kind: "order_status_changed",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      resourceType: "order",
      resourceId: "BF-1001",
      message: "Order status changed: new → confirmed",
    },
    product_updated: {
      kind: "product_updated",
      actorId: "admin-user-owner",
      actorName: "Владелец (dev)",
      actorRole: "owner",
      resourceType: "catalog_product",
      resourceId: "bouquet-rose-classic",
      message: "Catalog product updated",
    },
    inventory_updated: {
      kind: "inventory_updated",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      resourceType: "inventory_item",
      resourceId: "flower-rose-red",
      message: "Stock quantity adjusted",
    },
    courier_assigned: {
      kind: "courier_assigned",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      resourceType: "order",
      resourceId: "BF-1001",
      message: "Courier assigned to order",
      metadata: { courierId: "courier-ivan" },
    },
    workflow_restarted: {
      kind: "workflow_restarted",
      actorId: "admin-user-system",
      actorName: "System (dev)",
      actorRole: "system",
      resourceType: "workflow",
      resourceId: "wf-example-001",
      message: "Workflow restarted by admin",
    },
    notification_retried: {
      kind: "notification_retried",
      actorId: "admin-user-manager",
      actorName: "Менеджер (dev)",
      actorRole: "manager",
      resourceType: "notification",
      resourceId: "notif-001",
      message: "Notification retry queued",
    },
    settings_changed: {
      kind: "settings_changed",
      actorId: "admin-user-owner",
      actorName: "Владелец (dev)",
      actorRole: "owner",
      resourceType: "settings",
      resourceId: "admin_intelligence",
      message: "Admin settings updated",
    },
  };

  return previews[kind];
}
