export type {
  AdminModuleAvailability,
  AdminModuleDefinition,
  AdminModuleId,
  AdminModuleSection,
} from "@/components/adminShell/adminModuleTypes";

export {
  ADMIN_MODULES,
  ADMIN_MODULE_STORAGE_KEY,
  BELLAFLORE_MODULE_SECTIONS,
  SYSTEM_CONTROL_SECTIONS,
  getAdminModuleById,
  isAdminModuleId,
} from "@/components/adminShell/adminModules";

export { useAdminModule } from "@/components/adminShell/useAdminModule";
export { AdminShell } from "@/components/adminShell/AdminShell";
export { AdminModuleSwitcher } from "@/components/adminShell/AdminModuleSwitcher";
export { AdminModuleCard } from "@/components/adminShell/AdminModuleCard";
export { AdminDashboardHome } from "@/components/adminShell/AdminDashboardHome";
export { AdminControlCenterClient } from "@/components/adminShell/AdminControlCenterClient";
