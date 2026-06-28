// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Permissions catalog
// ==================================================
import type { SecurityPermission } from "@/components/securityIntelligence/securityIntelligenceTypes";

export const SECURITY_PERMISSIONS: SecurityPermission[] = [
  "orders.view",
  "orders.edit",
  "catalog.view",
  "catalog.edit",
  "inventory.view",
  "inventory.edit",
  "delivery.view",
  "delivery.edit",
  "couriers.view",
  "couriers.edit",
  "notifications.view",
  "notifications.edit",
  "workflow.view",
  "workflow.control",
  "analytics.view",
  "health.view",
  "aiBrain.view",
  "system.view",
  "system.control",
  "security.view",
  "security.control",
];

export function isSecurityPermission(value: string): value is SecurityPermission {
  return SECURITY_PERMISSIONS.includes(value as SecurityPermission);
}
