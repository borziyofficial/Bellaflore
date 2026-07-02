// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Production admin session constants (no secrets)
// ==================================================

export const PRODUCTION_ADMIN_USER_ID_PREFIX = "bellaflore-env-admin";

export function isProductionEnvAdminUserId(userId: string): boolean {
  return userId.startsWith(`${PRODUCTION_ADMIN_USER_ID_PREFIX}-`);
}
