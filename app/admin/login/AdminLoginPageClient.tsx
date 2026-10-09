// ==================================================
// SECTION: Admin — Login Page Client
// РАЗДЕЛ: Admin — клиентская часть страницы входа
// ==================================================

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import {
  hasValidAdminEntrySession,
  loginWithAdminEntryCredentials,
  logoutAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import { checkAdminServerSession } from "@/lib/adminSessionCheck";
import {
  ADMIN_ENTRY_ROUTES,
  resolveAdminEntryRedirectPath,
} from "@/components/adminEntry/adminEntryRoutes";

export default function AdminLoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = resolveAdminEntryRedirectPath(searchParams.get("redirect"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasValidAdminEntrySession()) return;

    let cancelled = false;
    void checkAdminServerSession().then(async (result) => {
      if (cancelled) return;
      if (result.status === "valid") {
        router.replace(redirectPath);
        return;
      }
      if (result.status === "invalid") {
        await logoutAdminEntrySession();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [redirectPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const result = await loginWithAdminEntryCredentials(username, password);

      if (!result.ok) {
        setErrorMessage(result.message || "Неверное имя пользователя или пароль.");
        return;
      }

      router.replace(redirectPath);
    } catch {
      setErrorMessage("Неверное имя пользователя или пароль.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.shell} aria-label="Вход в панель администратора">
        <div style={styles.brandPanel}>
          <p style={styles.eyebrow}>BellaFlore</p>
          <h1 style={styles.title}>Вход администратора</h1>
          <p style={styles.lead}>
            📈 Панель управления · ⚙️ Системный мозг · 🧩 Внутренний модуль
          </p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.fieldLabel}>
            <span style={styles.labelText}>Имя пользователя</span>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.fieldLabel}>
            <span style={styles.labelText}>Пароль</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              style={styles.input}
              required
            />
          </label>

          {errorMessage && <p style={styles.error}>{errorMessage}</p>}

          <button type="submit" style={styles.loginButton} disabled={submitting}>
            {submitting ? "Вход..." : "Войти"}
          </button>

          <p style={styles.hint}>
            После входа: {redirectPath === ADMIN_ENTRY_ROUTES.panel ? "/admin" : redirectPath}
          </p>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    alignItems: "center",
    padding: "24px",
    background: "#f7f3ed",
    color: "#2a2521",
    fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
  },
  shell: {
    width: "min(920px, 100%)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
    border: "1px solid rgba(74, 20, 40, 0.12)",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fdfbf9",
    boxShadow: "0 18px 48px rgba(47, 42, 36, 0.12)",
  },
  brandPanel: {
    minHeight: "360px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "28px",
    background: "#4a1428",
    color: "#f6f1ea",
  },
  eyebrow: {
    margin: 0,
    color: "#c4a574",
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontWeight: 600,
    fontSize: "clamp(32px, 7vw, 52px)",
    lineHeight: 1,
  },
  lead: {
    margin: "14px 0 0",
    color: "rgba(255, 250, 242, 0.78)",
    fontSize: "16px",
    lineHeight: 1.45,
  },
  form: {
    display: "grid",
    alignContent: "center",
    gap: "16px",
    padding: "28px",
  },
  fieldLabel: {
    display: "grid",
    gap: "8px",
  },
  labelText: {
    color: "#746f68",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    minHeight: "48px",
    border: "1px solid rgba(74, 20, 40, 0.18)",
    borderRadius: "8px",
    padding: "0 14px",
    background: "#fdfbf9",
    color: "#2a2521",
    font: "inherit",
    fontSize: "16px",
    outline: "none",
  },
  error: {
    margin: 0,
    border: "1px solid rgba(176, 42, 42, 0.28)",
    borderRadius: "8px",
    padding: "12px 14px",
    background: "#fff1f1",
    color: "#8e2020",
    fontSize: "14px",
    lineHeight: 1.35,
  },
  loginButton: {
    minHeight: "48px",
    border: "1px solid #4a1428",
    borderRadius: "8px",
    padding: "0 18px",
    background: "#4a1428",
    color: "#f6f1ea",
    cursor: "pointer",
    font: "inherit",
    fontSize: "16px",
    fontWeight: 900,
  },
  hint: {
    margin: 0,
    color: "#75695c",
    fontSize: "13px",
    lineHeight: 1.4,
  },
};
