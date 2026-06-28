// ==================================================
// SECTION: ADMIN WORKSPACE
// РАЗДЕЛ: Рабочее пространство админки
//
// Purpose (EN): Workspace layout, sections, access guards, and navigation config.
//
// Назначение (RU): Макет, разделы, проверки доступа и конфигурация навигации админки.
// ==================================================
import type { AdminUser } from "@/components/adminCore/adminTypes";

export const TEST_ADMIN_USER: AdminUser = {
  adminUserId: "admin-test-owner-001",
  adminUserName: "Bellaflore Owner",
  adminUserRole: "owner",
};

export function getTestAdminUser(): AdminUser {
  return { ...TEST_ADMIN_USER };
}
