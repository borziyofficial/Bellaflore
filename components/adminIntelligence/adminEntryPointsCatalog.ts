// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Entry points catalog
// ==================================================
import type {
  AdminEntryPoint,
  AdminEntryPointId,
  AdminRole,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

export const ADMIN_ENTRY_POINTS: AdminEntryPoint[] = [
  {
    id: "admin_panel",
    routePath: "/admin",
    title: "Admin Panel",
    description:
      "Центральная панель управления заказами, каталогом, складом, доставкой и курьерами",
    roleAccess: [
      "owner",
      "admin",
      "manager",
      "florist",
      "courier_manager",
      "support",
      "analyst",
    ],
    enabled: true,
  },
  {
    id: "system_brain",
    routePath: "/admin/system-brain",
    title: "System Brain",
    description:
      "Внутренний control plane: workflow, диагностика модулей и системные операции",
    roleAccess: ["owner", "admin", "system", "analyst"],
    enabled: true,
  },
  {
    id: "third_internal_module",
    routePath: "/admin/internal",
    title: "Third Internal Module",
    description:
      "Закрытый внутренний модуль для system-операций и экспериментальных инструментов",
    roleAccess: ["owner", "system"],
    enabled: true,
  },
];

const ENTRY_POINT_BY_ID = ADMIN_ENTRY_POINTS.reduce<
  Record<AdminEntryPointId, AdminEntryPoint>
>(
  (map, entry) => {
    map[entry.id] = entry;
    return map;
  },
  {} as Record<AdminEntryPointId, AdminEntryPoint>,
);

export function getAdminEntryPointById(
  id: AdminEntryPointId,
): AdminEntryPoint | null {
  return ENTRY_POINT_BY_ID[id] ?? null;
}

export function listEnabledAdminEntryPoints(): AdminEntryPoint[] {
  return ADMIN_ENTRY_POINTS.filter((entry) => entry.enabled);
}

export function canRoleAccessEntryPoint(
  role: AdminRole,
  entryPointId: AdminEntryPointId,
): boolean {
  const entry = getAdminEntryPointById(entryPointId);
  if (!entry || !entry.enabled) {
    return false;
  }

  return entry.roleAccess.includes(role);
}

export function getEntryPointsForRole(role: AdminRole): AdminEntryPoint[] {
  return listEnabledAdminEntryPoints().filter((entry) =>
    entry.roleAccess.includes(role),
  );
}
