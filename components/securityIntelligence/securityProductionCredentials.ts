// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Production admin credentials (server-only)
// ==================================================
import { PRODUCTION_ADMIN_USER_ID_PREFIX } from "@/components/securityIntelligence/securityProductionConstants";
import type { SecurityUser } from "@/components/securityIntelligence/securityIntelligenceTypes";

function buildProductionAdminUserId(login: string): string {
  const normalized = login.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${PRODUCTION_ADMIN_USER_ID_PREFIX}-${normalized || "user"}`;
}

export function resolveProductionAdminUser(
  login: string,
  password: string,
): Omit<SecurityUser, "createdAt" | "updatedAt"> | null {
  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const normalizedLogin = login.trim();
  const normalizedPassword = password.trim();

  if (!adminUsername || !adminPassword) {
    return null;
  }

  if (normalizedLogin !== adminUsername || normalizedPassword !== adminPassword) {
    return null;
  }

  return {
    id: buildProductionAdminUserId(adminUsername),
    name: adminUsername,
    email: `${adminUsername}@bellaflore.ru`,
    role: "owner",
    enabled: true,
  };
}
