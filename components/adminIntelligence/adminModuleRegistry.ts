// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Module registry
// ==================================================
import type {
  AdminModule,
  AdminModuleId,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export const ADMIN_MODULE_REGISTRY: AdminModule[] = [
  {
    id: "orderIntelligence",
    title: "Order Intelligence",
    description: "CRM заказов, timeline и admin orders foundation",
    permissions: ["orders.view", "orders.edit", "orders.status.change"],
    status: "active",
    route: "/admin/orders",
    enabled: true,
  },
  {
    id: "catalogEngine",
    title: "Catalog Engine",
    description: "Каталог товаров, категории и публикация",
    permissions: ["catalog.view", "catalog.edit"],
    status: "active",
    route: "/admin/catalog",
    enabled: true,
  },
  {
    id: "inventoryIntelligence",
    title: "Inventory Intelligence",
    description: "Склад, availability и резервирование",
    permissions: ["inventory.view", "inventory.edit"],
    status: "active",
    route: "/admin/inventory",
    enabled: true,
  },
  {
    id: "courierIntelligence",
    title: "Courier Intelligence",
    description: "Профили курьеров, scoring и назначения",
    permissions: ["couriers.view", "couriers.edit"],
    status: "active",
    route: "/admin/couriers",
    enabled: true,
  },
  {
    id: "deliveryIntelligence",
    title: "Delivery Intelligence",
    description: "Задачи доставки, окна и ETA",
    permissions: ["delivery.view", "delivery.edit"],
    status: "active",
    route: "/admin/delivery",
    enabled: true,
  },
  {
    id: "notificationIntelligence",
    title: "Notification Intelligence",
    description: "Очередь уведомлений, шаблоны и escalation",
    permissions: ["notifications.view", "notifications.edit"],
    status: "active",
    route: "/admin/notifications",
    enabled: true,
  },
  {
    id: "workflowIntelligence",
    title: "Workflow Intelligence",
    description: "Workflow engine и orchestration заказов",
    permissions: ["workflow.view", "workflow.control"],
    status: "active",
    route: "/admin/workflow",
    enabled: true,
  },
  {
    id: "analyticsIntelligence",
    title: "Analytics Intelligence",
    description: "Сводные метрики и отчёты операций",
    permissions: ["analytics.view"],
    status: "planned",
    route: "/admin/analytics",
    enabled: true,
  },
  {
    id: "systemBrain",
    title: "System Brain",
    description: "Control plane, диагностика и system hooks",
    permissions: ["system.view", "system.control"],
    status: "beta",
    route: "/admin/system-brain",
    enabled: true,
  },
];

const MODULE_BY_ID = ADMIN_MODULE_REGISTRY.reduce<
  Record<AdminModuleId, AdminModule>
>(
  (map, module) => {
    map[module.id] = module;
    return map;
  },
  {} as Record<AdminModuleId, AdminModule>,
);

export function getAdminModuleById(id: AdminModuleId): AdminModule | null {
  return MODULE_BY_ID[id] ?? null;
}

export function listEnabledAdminModules(): AdminModule[] {
  return ADMIN_MODULE_REGISTRY.filter((module) => module.enabled);
}

export function listActiveAdminModules(): AdminModule[] {
  return ADMIN_MODULE_REGISTRY.filter(
    (module) => module.enabled && module.status === "active",
  );
}

export function getAdminModuleRegistrySnapshot(): {
  modules: AdminModule[];
  activeCount: number;
  betaCount: number;
  plannedCount: number;
} {
  const modules = [...ADMIN_MODULE_REGISTRY];
  return {
    modules,
    activeCount: modules.filter((module) => module.status === "active").length,
    betaCount: modules.filter((module) => module.status === "beta").length,
    plannedCount: modules.filter((module) => module.status === "planned").length,
  };
}
