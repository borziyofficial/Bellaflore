// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Roles catalog
// ==================================================
import { SECURITY_PERMISSIONS } from "@/components/securityIntelligence/securityPermissionsCatalog";
import type {
  SecurityPermission,
  SecurityRole,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

const ALL = [...SECURITY_PERMISSIONS];

const ROLE_PERMISSIONS: Record<SecurityRole, SecurityPermission[]> = {
  owner: ALL,
  admin: ALL.filter((permission) => permission !== "system.control" && permission !== "security.control"),
  manager: [
    "orders.view",
    "orders.edit",
    "catalog.view",
    "inventory.view",
    "inventory.edit",
    "delivery.view",
    "delivery.edit",
    "couriers.view",
    "couriers.edit",
    "notifications.view",
    "workflow.view",
    "analytics.view",
    "health.view",
  ],
  florist: [
    "orders.view",
    "catalog.view",
    "inventory.view",
    "workflow.view",
    "health.view",
  ],
  courier_manager: [
    "orders.view",
    "delivery.view",
    "delivery.edit",
    "couriers.view",
    "couriers.edit",
    "notifications.view",
    "workflow.view",
    "health.view",
  ],
  support: [
    "orders.view",
    "orders.edit",
    "notifications.view",
    "notifications.edit",
    "workflow.view",
    "health.view",
  ],
  analyst: [
    "orders.view",
    "catalog.view",
    "inventory.view",
    "delivery.view",
    "couriers.view",
    "notifications.view",
    "workflow.view",
    "analytics.view",
    "health.view",
    "aiBrain.view",
    "system.view",
    "security.view",
  ],
  system: [
    "system.view",
    "system.control",
    "workflow.view",
    "workflow.control",
    "analytics.view",
    "health.view",
    "aiBrain.view",
    "security.view",
    "notifications.view",
  ],
};

export const SECURITY_ROLES: SecurityRole[] = [
  "owner",
  "admin",
  "manager",
  "florist",
  "courier_manager",
  "support",
  "analyst",
  "system",
];

export function getPermissionsForSecurityRole(role: SecurityRole): SecurityPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function securityRoleHasPermission(
  role: SecurityRole,
  permission: SecurityPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getAllowedRolesForPermission(
  permission: SecurityPermission,
): SecurityRole[] {
  return SECURITY_ROLES.filter((role) => securityRoleHasPermission(role, permission));
}
