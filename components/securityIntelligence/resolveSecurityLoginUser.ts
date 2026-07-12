// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Unified login user resolution
// ==================================================
import { findDevSecurityUserByCredentials } from "@/components/securityIntelligence/securityDevConfig";
import { resolveProductionAdminUser } from "@/components/securityIntelligence/securityProductionCredentials";
import type { SecurityUser } from "@/components/securityIntelligence/securityIntelligenceTypes";

export function resolveSecurityLoginUser(
  login: string,
  password: string,
): SecurityUser | null {
  const normalizedLogin = login.trim();
  const normalizedPassword = password.trim();

  if (!normalizedLogin || !normalizedPassword) {
    return null;
  }

  // Hardcoded dev credentials are a local convenience only — never honor
  // them in production, so the deployed site has exactly one admin
  // identity: the env-configured production account below.
  if (process.env.NODE_ENV !== "production") {
    const devUser = findDevSecurityUserByCredentials(
      normalizedLogin,
      normalizedPassword,
    );
    if (devUser) {
      return devUser;
    }
  }

  const productionUser = resolveProductionAdminUser(
    normalizedLogin,
    normalizedPassword,
  );
  if (!productionUser) {
    return null;
  }

  const now = new Date().toISOString();
  return { ...productionUser, createdAt: now, updatedAt: now };
}
