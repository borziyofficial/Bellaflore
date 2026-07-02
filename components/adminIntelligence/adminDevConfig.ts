// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Dev-only config
//
// WARNING: Development credentials only. Do NOT use in production.
// Replace with real auth provider before go-live.
// ==================================================
import type { AdminRole, AdminUser } from "@/components/adminIntelligence/adminIntelligenceTypes";

export const ADMIN_DEV_CONFIG_FLAG = "DEV_ONLY_NOT_FOR_PRODUCTION";

export type AdminDevCredential = {
  login: string;
  password: string;
  user: Omit<AdminUser, "createdAt" | "updatedAt">;
};

export const ADMIN_DEV_CREDENTIALS: AdminDevCredential[] = [
  {
    login: "owner@bellaflore.local",
    password: "dev-owner",
    user: {
      id: "admin-user-owner",
      name: "Владелец (dev)",
      email: "owner@bellaflore.local",
      role: "owner",
      enabled: true,
    },
  },
  {
    login: "manager@bellaflore.local",
    password: "dev-manager",
    user: {
      id: "admin-user-manager",
      name: "Менеджер (dev)",
      email: "manager@bellaflore.local",
      role: "manager",
      enabled: true,
    },
  },
  {
    login: "system@bellaflore.local",
    password: "dev-system",
    user: {
      id: "admin-user-system",
      name: "System (dev)",
      email: "system@bellaflore.local",
      role: "system",
      enabled: true,
    },
  },
];

export function findDevAdminUserByCredentials(
  login: string,
  password: string,
): AdminUser | null {
  const match = ADMIN_DEV_CREDENTIALS.find(
    (entry) => entry.login === login && entry.password === password,
  );

  if (!match || !match.user.enabled) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    ...match.user,
    createdAt: now,
    updatedAt: now,
  };
}

export function findDevAdminUserById(userId: string): AdminUser | null {
  const match = ADMIN_DEV_CREDENTIALS.find(
    (entry) => entry.user.id === userId,
  );

  if (!match) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    ...match.user,
    createdAt: now,
    updatedAt: now,
  };
}

export function isDevAdminRole(role: AdminRole): boolean {
  return ADMIN_DEV_CREDENTIALS.some((entry) => entry.user.role === role);
}
