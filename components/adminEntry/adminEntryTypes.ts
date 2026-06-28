// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Types
// ==================================================
import type { ReactNode } from "react";
import type { SecuritySession } from "@/components/securityIntelligence/securityIntelligenceTypes";

export type AdminEntryRoutePath =
  | "/admin"
  | "/admin/system-brain"
  | "/admin/internal";

export type AdminEntryLoginResult = {
  ok: boolean;
  session: SecuritySession | null;
  message: string;
};

export type AdminEntryGateState =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "denied";

export type AdminEntryGateProps = {
  route: AdminEntryRoutePath;
  children: ReactNode;
};
