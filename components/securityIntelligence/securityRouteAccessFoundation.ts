// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Route access foundation
// ==================================================
import type {
  SecurityModuleAccess,
  SecurityPermission,
  SecurityRole,
  SecurityRoutePath,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

export type SecurityRouteRule = {
  route: SecurityRoutePath;
  title: string;
  requiredPermissions: SecurityPermission[];
  allowedRoles: SecurityRole[];
  enabled: boolean;
};

export const SECURITY_ROUTE_RULES: SecurityRouteRule[] = [
  {
    route: "/admin",
    title: "Admin Panel",
    requiredPermissions: ["orders.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "courier_manager", "support", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/system-brain",
    title: "System Brain",
    requiredPermissions: ["aiBrain.view", "system.view"],
    allowedRoles: ["owner", "admin", "system", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/internal",
    title: "Internal Module",
    requiredPermissions: ["system.control"],
    allowedRoles: ["owner", "system"],
    enabled: true,
  },
  {
    route: "/admin/orders",
    title: "Orders",
    requiredPermissions: ["orders.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "courier_manager", "support", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/catalog",
    title: "Catalog",
    requiredPermissions: ["catalog.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/inventory",
    title: "Inventory",
    requiredPermissions: ["inventory.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/delivery",
    title: "Delivery",
    requiredPermissions: ["delivery.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/couriers",
    title: "Couriers",
    requiredPermissions: ["couriers.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/notifications",
    title: "Notifications",
    requiredPermissions: ["notifications.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "support", "analyst"],
    enabled: true,
  },
  {
    route: "/admin/workflow",
    title: "Workflow",
    requiredPermissions: ["workflow.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "support", "analyst", "system"],
    enabled: true,
  },
  {
    route: "/admin/analytics",
    title: "Analytics",
    requiredPermissions: ["analytics.view"],
    allowedRoles: ["owner", "admin", "manager", "analyst", "system"],
    enabled: true,
  },
  {
    route: "/admin/health",
    title: "Health",
    requiredPermissions: ["health.view"],
    allowedRoles: ["owner", "admin", "manager", "analyst", "system"],
    enabled: true,
  },
  {
    route: "/admin/security",
    title: "Security",
    requiredPermissions: ["security.view"],
    allowedRoles: ["owner", "admin", "analyst", "system"],
    enabled: true,
  },
  {
    route: "/admin/settings",
    title: "Settings",
    requiredPermissions: ["system.view"],
    allowedRoles: ["owner", "admin", "system"],
    enabled: true,
  },
];

export const SECURITY_MODULE_ACCESS: SecurityModuleAccess[] = [
  {
    moduleId: "orderIntelligence",
    title: "Orders",
    route: "/admin/orders",
    requiredPermissions: ["orders.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "courier_manager", "support", "analyst"],
    enabled: true,
  },
  {
    moduleId: "catalogEngine",
    title: "Catalog",
    route: "/admin/catalog",
    requiredPermissions: ["catalog.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "analyst"],
    enabled: true,
  },
  {
    moduleId: "inventoryIntelligence",
    title: "Inventory",
    route: "/admin/inventory",
    requiredPermissions: ["inventory.view"],
    allowedRoles: ["owner", "admin", "manager", "florist", "analyst"],
    enabled: true,
  },
  {
    moduleId: "deliveryIntelligence",
    title: "Delivery",
    route: "/admin/delivery",
    requiredPermissions: ["delivery.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "analyst"],
    enabled: true,
  },
  {
    moduleId: "courierIntelligence",
    title: "Couriers",
    route: "/admin/couriers",
    requiredPermissions: ["couriers.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "analyst"],
    enabled: true,
  },
  {
    moduleId: "notificationIntelligence",
    title: "Notifications",
    route: "/admin/notifications",
    requiredPermissions: ["notifications.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "support", "analyst"],
    enabled: true,
  },
  {
    moduleId: "workflowIntelligence",
    title: "Workflow",
    route: "/admin/workflow",
    requiredPermissions: ["workflow.view"],
    allowedRoles: ["owner", "admin", "manager", "courier_manager", "support", "analyst", "system"],
    enabled: true,
  },
  {
    moduleId: "analyticsIntelligence",
    title: "Analytics",
    route: "/admin/analytics",
    requiredPermissions: ["analytics.view"],
    allowedRoles: ["owner", "admin", "manager", "analyst", "system"],
    enabled: true,
  },
  {
    moduleId: "healthIntelligence",
    title: "Health",
    route: "/admin/health",
    requiredPermissions: ["health.view"],
    allowedRoles: ["owner", "admin", "manager", "analyst", "system"],
    enabled: true,
  },
  {
    moduleId: "aiBrain",
    title: "AI Brain",
    route: "/admin/system-brain",
    requiredPermissions: ["aiBrain.view"],
    allowedRoles: ["owner", "admin", "analyst", "system"],
    enabled: true,
  },
  {
    moduleId: "securityIntelligence",
    title: "Security",
    route: "/admin/security",
    requiredPermissions: ["security.view"],
    allowedRoles: ["owner", "admin", "analyst", "system"],
    enabled: true,
  },
];

const ROUTE_BY_PATH = SECURITY_ROUTE_RULES.reduce<
  Record<SecurityRoutePath, SecurityRouteRule>
>(
  (map, rule) => {
    map[rule.route] = rule;
    return map;
  },
  {} as Record<SecurityRoutePath, SecurityRouteRule>,
);

const MODULE_BY_ID = SECURITY_MODULE_ACCESS.reduce<
  Record<SecurityModuleAccess["moduleId"], SecurityModuleAccess>
>(
  (map, entry) => {
    map[entry.moduleId] = entry;
    return map;
  },
  {} as Record<SecurityModuleAccess["moduleId"], SecurityModuleAccess>,
);

export function getSecurityRouteRule(route: SecurityRoutePath): SecurityRouteRule | null {
  return ROUTE_BY_PATH[route] ?? null;
}

export function getSecurityModuleAccess(
  moduleId: SecurityModuleAccess["moduleId"],
): SecurityModuleAccess | null {
  return MODULE_BY_ID[moduleId] ?? null;
}

export function listSecurityRouteRules(): SecurityRouteRule[] {
  return [...SECURITY_ROUTE_RULES];
}
