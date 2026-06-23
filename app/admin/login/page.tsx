"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import {
  ADMIN_DASHBOARD_PATH,
  hasAdminSession,
  storeAdminSession,
} from "../auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasAdminSession()) {
      router.replace(ADMIN_DASHBOARD_PATH);
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Admin login failed: ${response.status}`);
      }

      storeAdminSession();
      router.replace(ADMIN_DASHBOARD_PATH);
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
          <p style={styles.lead}>Панель управления заказами</p>
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
    background: "#f7f2ea",
    color: "#2f2a24",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: {
    width: "min(920px, 100%)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
    border: "1px solid rgba(138, 107, 61, 0.18)",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(47, 42, 36, 0.12)",
  },
  brandPanel: {
    minHeight: "360px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "28px",
    background:
      "linear-gradient(145deg, rgba(47, 42, 36, 0.96), rgba(95, 71, 37, 0.9))",
    color: "#fffaf2",
  },
  eyebrow: {
    margin: 0,
    color: "#dfc38b",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
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
    color: "#8a6b3d",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    minHeight: "48px",
    border: "1px solid rgba(138, 107, 61, 0.28)",
    borderRadius: "8px",
    padding: "0 14px",
    background: "#fffaf2",
    color: "#2f2a24",
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
    border: "1px solid #2f2a24",
    borderRadius: "8px",
    padding: "0 18px",
    background: "#2f2a24",
    color: "#fffaf2",
    cursor: "pointer",
    font: "inherit",
    fontSize: "16px",
    fontWeight: 900,
  },
};
