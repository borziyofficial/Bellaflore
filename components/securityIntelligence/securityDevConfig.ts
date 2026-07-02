// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Dev-only config
//
// WARNING: DEV_ONLY_NOT_FOR_PRODUCTION
// Development credentials only. Do NOT use in production.
// Replace with env-backed auth provider before go-live.
// ==================================================
import type { SecurityUser } from "@/components/securityIntelligence/securityIntelligenceTypes";

export const SECURITY_DEV_CONFIG_FLAG = "DEV_ONLY_NOT_FOR_PRODUCTION";

export type SecurityDevCredential = {
  login: string;
  password: string;
  user: Omit<SecurityUser, "createdAt" | "updatedAt">;
};

export const SECURITY_DEV_CREDENTIALS: SecurityDevCredential[] = [
  {
    login: "Borziy13",
    password: "Anonymous123s",
    user: {
      id: "security-user-borziy13",
      name: "Borziy13",
      email: "borziy13@bellaflore.local",
      role: "owner",
      enabled: true,
    },
  },
  {
    login: "owner@bellaflore.local",
    password: "dev-owner-secure",
    user: {
      id: "security-user-owner",
      name: "Owner (dev)",
      email: "owner@bellaflore.local",
      role: "owner",
      enabled: true,
    },
  },
  {
    login: "admin@bellaflore.local",
    password: "dev-admin-secure",
    user: {
      id: "security-user-admin",
      name: "Admin (dev)",
      email: "admin@bellaflore.local",
      role: "admin",
      enabled: true,
    },
  },
  {
    login: "system@bellaflore.local",
    password: "dev-system-secure",
    user: {
      id: "security-user-system",
      name: "System (dev)",
      email: "system@bellaflore.local",
      role: "system",
      enabled: true,
    },
  },
];

export function findDevSecurityUserByCredentials(
  login: string,
  password: string,
): SecurityUser | null {
  const normalizedLogin = login.trim();
  const normalizedPassword = password.trim();

  const match = SECURITY_DEV_CREDENTIALS.find(
    (entry) =>
      entry.login === normalizedLogin && entry.password === normalizedPassword,
  );

  if (!match?.user.enabled) {
    return null;
  }

  const now = new Date().toISOString();
  return { ...match.user, createdAt: now, updatedAt: now };
}

export function findDevSecurityUserById(userId: string): SecurityUser | null {
  const match = SECURITY_DEV_CREDENTIALS.find((entry) => entry.user.id === userId);
  if (!match) {
    return null;
  }

  const now = new Date().toISOString();
  return { ...match.user, createdAt: now, updatedAt: now };
}

export function isDevSecurityCredentialsEnabled(): boolean {
  return SECURITY_DEV_CREDENTIALS.length > 0;
}
