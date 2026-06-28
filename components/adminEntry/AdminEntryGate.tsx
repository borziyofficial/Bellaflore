// ==================================================
// SECTION: ADMIN ENTRY
// РАЗДЕЛ: Route gate
// ==================================================
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminEntrySession,
  hasValidAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import type { AdminEntryGateProps, AdminEntryGateState } from "@/components/adminEntry/adminEntryTypes";
import { buildAdminLoginRedirectUrl } from "@/components/adminEntry/adminEntryRoutes";
import { canAccessAdminEntryPoint } from "@/components/securityIntelligence/securityAccessGuards";

export function AdminEntryGate({ route, children }: AdminEntryGateProps) {
  const router = useRouter();
  const [gateState, setGateState] = useState<AdminEntryGateState>("loading");
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  useEffect(() => {
    const authTimer = window.setTimeout(() => {
      if (!hasValidAdminEntrySession()) {
        router.replace(buildAdminLoginRedirectUrl(route));
        setGateState("unauthenticated");
        return;
      }

      const session = getAdminEntrySession();
      if (!session) {
        router.replace(buildAdminLoginRedirectUrl(route));
        setGateState("unauthenticated");
        return;
      }

      const access = canAccessAdminEntryPoint(route, session);
      if (!access.allowed) {
        setDeniedMessage(access.reason ?? "Access denied");
        setGateState("denied");
        return;
      }

      setGateState("ready");
    }, 0);

    return () => window.clearTimeout(authTimer);
  }, [route, router]);

  if (gateState === "loading" || gateState === "unauthenticated") {
    return (
      <main style={styles.page}>
        <p style={styles.message}>Проверка доступа...</p>
      </main>
    );
  }

  if (gateState === "denied") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>Access Denied</p>
          <h1 style={styles.title}>Доступ запрещён</h1>
          <p style={styles.message}>{deniedMessage ?? "У вас нет доступа к этому разделу."}</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#f7f2ea",
    color: "#2f2a24",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: "min(520px, 100%)",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    padding: "24px",
    background: "#ffffff",
  },
  eyebrow: {
    margin: 0,
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "28px",
    lineHeight: 1.1,
  },
  message: {
    margin: "12px 0 0",
    color: "#75695c",
    lineHeight: 1.5,
  },
};
