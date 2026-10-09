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
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import type { AdminEntryGateProps, AdminEntryGateState } from "@/components/adminEntry/adminEntryTypes";
import { buildAdminLoginRedirectUrl } from "@/components/adminEntry/adminEntryRoutes";
import { canAccessAdminEntryPoint } from "@/components/securityIntelligence/securityAccessGuards";
import {
  ADMIN_SESSION_CHECK_TIMEOUT_MS,
  checkAdminServerSession,
} from "@/lib/adminSessionCheck";

function resolveGateState(route: AdminEntryGateProps["route"]): {
  state: AdminEntryGateState;
  deniedMessage: string | null;
} {
  if (typeof window === "undefined") {
    return { state: "loading", deniedMessage: null };
  }

  if (!hasValidAdminEntrySession()) {
    return { state: "unauthenticated", deniedMessage: null };
  }

  const session = getAdminEntrySession();
  if (!session) {
    return { state: "unauthenticated", deniedMessage: null };
  }

  const access = canAccessAdminEntryPoint(route, session);
  if (!access.allowed) {
    return {
      state: "denied",
      deniedMessage: access.reason ?? "Access denied",
    };
  }

  return { state: "ready", deniedMessage: null };
}

export function AdminEntryGate({ route, children }: AdminEntryGateProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [gateState, setGateState] = useState<AdminEntryGateState>("loading");
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const loginUrl = buildAdminLoginRedirectUrl(route);

  useEffect(() => {
    let cancelled = false;

    const watchdog = window.setTimeout(() => {
      if (cancelled) return;
      setSessionError(
        "Проверка доступа заняла слишком много времени. Проверьте соединение и повторите.",
      );
      setGateState("error");
    }, ADMIN_SESSION_CHECK_TIMEOUT_MS + 1_000);

    const verifyAccess = async () => {
      if (!cancelled) {
        setSessionError(null);
        setGateState("loading");
      }

      const next = resolveGateState(route);

      if (next.state === "unauthenticated") {
        router.replace(loginUrl);
        if (!cancelled) {
          setGateState("unauthenticated");
        }
        window.clearTimeout(watchdog);
        return;
      }

      const serverSession = await checkAdminServerSession();
      if (cancelled) return;
      window.clearTimeout(watchdog);

      if (serverSession.status === "invalid") {
        void logoutAdminEntrySession();
        router.replace(loginUrl);
        setGateState("unauthenticated");
        return;
      }

      if (serverSession.status === "unavailable") {
        setSessionError(serverSession.message);
        setGateState("error");
        return;
      }

      setDeniedMessage(next.deniedMessage);
      setGateState(next.state);
    };

    void verifyAccess();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
  }, [loginUrl, route, router, attempt]);

  if (gateState === "error") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>Сессия</p>
          <h1 style={styles.title}>Не удалось проверить доступ</h1>
          <p style={styles.message}>{sessionError}</p>
          <button
            type="button"
            style={styles.retry}
            onClick={() => {
              setGateState("loading");
              setSessionError(null);
              setAttempt((current) => current + 1);
            }}
          >
            Повторить проверку
          </button>
        </section>
      </main>
    );
  }

  if (gateState === "loading" || gateState === "unauthenticated") {
    return (
      <main style={styles.page}>
        <p style={styles.message}>
          {gateState === "unauthenticated" ? "Открываем вход..." : "Проверка доступа..."}
        </p>
        {gateState === "unauthenticated" ? (
          <a href={loginUrl} style={styles.link}>
            Перейти ко входу
          </a>
        ) : null}
      </main>
    );
  }

  if (gateState === "denied") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>Доступ запрещён</p>
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
  retry: {
    marginTop: "16px",
    minHeight: "44px",
    border: "1px solid #4a1428",
    borderRadius: "8px",
    padding: "0 16px",
    background: "#4a1428",
    color: "#f6f1ea",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  },
  link: {
    display: "inline-block",
    marginTop: "12px",
    color: "#6f4f21",
    fontWeight: 700,
  },
};
